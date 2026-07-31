import {
  ProcessedPlayer,
  OptimizeSquadOptions,
  OptimalSquad,
  SquadPick,
  SquadHorizon,
  ProcessedData,
  SQUAD_RULES,
  SQUAD_SIZE,
  STARTING_SIZE,
  MAX_PER_CLUB,
  DEFAULT_BUDGET,
} from '@fpl/contracts/fpl';
import solver from 'javascript-lp-solver';
import { ApplicationService } from '../../app';

/**
 * A candidate player reduced to just the fields the optimiser needs.
 *
 * Prices are held in integer tenths of a million to keep the MILP free of
 * floating-point noise (FPL prices are always multiples of 0.1).
 */
type Candidate = {
  id: number;
  position: number;
  club: number;
  /** Price in tenths of a million, e.g. 9.5m → 95. */
  price: number;
  value: number;
  player: ProcessedPlayer;
};

/**
 * Options for the transfer-constrained optimisation.
 *
 * Kept separate from OptimizeSquadOptions so the existing optimize() path
 * remains entirely unchanged.
 */
export type ConstrainedOptimizeOptions = {
  /** The current squad player IDs (all 15 must be known). */
  currentSquadIds: number[];
  /**
   * Selling price per incumbent, in tenths of a million.
   *
   * Used as the cost coefficient for incumbent variables and to compute total
   * available funds.  Players not in this map fall back to their live price.
   */
  sellingPriceTenths: Map<number, number>;
  /** Total available budget in tenths of a million (= sum of selling prices + bank). */
  budgetTenths: number;
  /** Maximum number of transfers allowed (min-retained = 15 - maxTransfers). */
  maxTransfers: number;
  horizon: SquadHorizon;
  benchWeight?: number;
  benchGkWeight?: number;
};

/**
 * Result of constrained optimisation — extends OptimalSquad with transfer metadata.
 */
export type ConstrainedOptimalSquad = OptimalSquad & {
  /** Number of incumbents replaced (= transfers used). */
  transfersUsed: number;
};

/**
 * Default weight for outfield bench players.
 */
const DEFAULT_BENCH_WEIGHT = 0.2;

/**
 * Default weight for the bench goalkeeper.
 *
 * The backup keeper starts only if the first-choice keeper is dropped or
 * injured, so budget spent here is close to wasted. The legacy Python model
 * weighted them the same as outfield subs (0.2), which systematically
 * overpaid for the second keeper.
 */
const DEFAULT_BENCH_GK_WEIGHT = 0.01;

export class SquadOptimizerService extends ApplicationService {
  /**
   * Build the optimal 15-player squad within a budget.
   *
   * Formulated as a mixed-integer program. The club limit (max 3 per team) is
   * what makes a plain per-position knapsack unsound, and is precisely the
   * constraint a MILP handles naturally.
   *
   * Before solving, the candidate pool is reduced by dominance pruning (see
   * `pruneDominated`), which typically removes a large majority of players
   * without affecting the optimum and keeps branch-and-bound tractable.
   *
   * If the solver fails or times out, a greedy + local-search heuristic
   * produces a feasible squad and the result is flagged `optimal: false`.
   *
   * @param data - the processed FPL data.
   * @param options - budget, horizon, weights and include/exclude lists.
   *
   * @returns the optimal (or best-found) squad.
   */
  public optimize(
    data: ProcessedData,
    options: OptimizeSquadOptions = {}
  ): OptimalSquad {
    const {
      horizon = 'value5',
      budget = DEFAULT_BUDGET,
      benchWeight = DEFAULT_BENCH_WEIGHT,
      benchGkWeight = DEFAULT_BENCH_GK_WEIGHT,
      include = [],
      exclude = [],
    } = options;

    const budgetTenths = Math.round(budget * 10);
    const candidates = this.buildCandidates(data, horizon, exclude);
    const pruned = this.pruneDominated(candidates, include);

    const solved = this.solveMilp(
      pruned,
      budgetTenths,
      benchWeight,
      benchGkWeight,
      include
    );

    const result =
      solved ??
      this.solveGreedy(
        pruned,
        budgetTenths,
        benchWeight,
        benchGkWeight,
        include
      );

    return {
      ...result,
      budget,
      horizon,
      optimal: solved !== null,
      candidatesConsidered: pruned.length,
    };
  }

  /**
   * Find the best squad that uses at most `maxTransfers` changes from the
   * current squad.
   *
   * This is a dedicated constrained optimisation path. It does NOT use or
   * modify the public `optimize()` method, ensuring the existing endpoint
   * behaviour is completely unchanged.
   *
   * Five traps avoided vs. the base optimizer:
   *
   * 1. **Dominance pruning** — incumbents are pinned in the `required` set
   *    passed to `pruneDominated`, so an injured or cheap incumbent can never
   *    be discarded before the solver considers keeping them.
   *
   * 2. **Unavailable incumbents** — `buildCandidatesForTransfer` keeps all
   *    incumbents regardless of `status`, while still barring non-available
   *    players from being new signings.
   *
   * 3. **Transfer-aware prices** — each incumbent's cost coefficient is their
   *    selling price (from `sellingPriceTenths`); the total budget is the sum
   *    of all selling prices plus the bank.
   *
   * 4. **Tie-break toward fewer transfers** — after proving the optimal
   *    objective value, a second solve maximises retained incumbents at that
   *    fixed objective. No epsilon fudge.
   *
   * 5. **Safe fallback** — the greedy fallback is transfer-constrained: it
   *    first locks in all incumbents, then replaces up to `maxTransfers` of
   *    the lowest-value ones. If the result is structurally invalid (wrong
   *    count, budget exceeded) the method returns null and the caller must
   *    surface an error rather than a corrupt plan.
   *
   * @param data - the processed FPL data.
   * @param opts - constrained optimisation options.
   *
   * @returns the best constrained squad, or null if no valid plan exists.
   */
  public optimizeWithTransferConstraint(
    data: ProcessedData,
    opts: ConstrainedOptimizeOptions
  ): ConstrainedOptimalSquad | null {
    const {
      currentSquadIds,
      sellingPriceTenths,
      budgetTenths,
      maxTransfers,
      horizon,
      benchWeight = DEFAULT_BENCH_WEIGHT,
      benchGkWeight = DEFAULT_BENCH_GK_WEIGHT,
    } = opts;

    const currentSet = new Set(currentSquadIds);

    // Build candidates — incumbents included regardless of status (Trap 2).
    const candidates = this.buildCandidatesForTransfer(
      data,
      horizon,
      currentSet,
      sellingPriceTenths
    );

    // Trap 1: protect every incumbent from dominance pruning.
    const pruned = this.pruneDominated(candidates, currentSquadIds);

    // Phase 1: maximise value under the transfer constraint.
    const phase1 = this.solveMilpConstrained(
      pruned,
      budgetTenths,
      benchWeight,
      benchGkWeight,
      currentSquadIds,
      maxTransfers,
      null
    );

    let result: Omit<
      OptimalSquad,
      'budget' | 'horizon' | 'optimal' | 'candidatesConsidered'
    > | null;
    let optimal: boolean;

    if (phase1 !== null) {
      // Trap 4: fix objective, re-solve maximising retained incumbents.
      const phase2 = this.solveMilpConstrained(
        pruned,
        budgetTenths,
        benchWeight,
        benchGkWeight,
        currentSquadIds,
        maxTransfers,
        phase1.totalValue
      );
      result = phase2 ?? phase1;
      optimal = true;
    } else {
      // Trap 5: use a constraint-aware validated fallback.
      result = this.solveGreedyConstrained(
        pruned,
        budgetTenths,
        benchWeight,
        benchGkWeight,
        currentSquadIds,
        maxTransfers
      );
      optimal = false;

      if (result === null) {
        return null;
      }
    }

    const transfersUsed = currentSquadIds.filter(
      (id) => !result!.picks.some((p) => p.player.generalInfo.id === id)
    ).length;

    return {
      ...result!,
      budget: budgetTenths / 10,
      horizon,
      optimal,
      candidatesConsidered: pruned.length,
      transfersUsed,
    };
  }

  /**
   * Reduce the player pool to viable, valued candidates.
   *
   * Excludes unavailable players and anyone whose value on the chosen horizon
   * is null (no fixtures in that window). Null must be excluded rather than
   * coerced to zero — a player with no fixtures is not a cheap zero-value
   * option, they are simply not selectable for that horizon.
   *
   * @param data - the processed FPL data.
   * @param horizon - the value horizon being optimised.
   * @param exclude - player IDs to omit.
   *
   * @returns the viable candidates.
   */
  private buildCandidates(
    data: ProcessedData,
    horizon: SquadHorizon,
    exclude: number[]
  ): Candidate[] {
    const excluded = new Set(exclude);

    return Object.values(data.players.byId)
      .filter((p) => p.generalInfo.status === 'a')
      .filter((p) => !excluded.has(p.generalInfo.id))
      .map((player) => {
        const value = player.playerValue[horizon];
        if (value === null) {
          return null;
        }
        return {
          id: player.generalInfo.id,
          position: player.generalInfo.element_type,
          club: player.generalInfo.team,
          price: Math.round(player.generalInfo.now_cost * 10),
          value,
          player,
        };
      })
      .filter((c): c is Candidate => c !== null);
  }

  /**
   * Build the candidate pool for transfer-constrained optimisation.
   *
   * Trap 2: incumbents are kept regardless of status (an injured player
   * already in the squad may be worth retaining). Non-incumbents with
   * `status !== 'a'` are excluded as normal.
   *
   * Trap 3: incumbent cost coefficients use the selling price map.
   *
   * Null-valued incumbents are intentionally excluded here; the caller
   * (`TransferPlannerService`) validates them beforehand and returns a clear
   * domain error rather than silently dropping them.
   *
   * @param data - the processed FPL data.
   * @param horizon - the value horizon.
   * @param currentSet - set of current squad player IDs.
   * @param sellingPriceTenths - selling price overrides for incumbents.
   *
   * @returns the candidate pool.
   */
  private buildCandidatesForTransfer(
    data: ProcessedData,
    horizon: SquadHorizon,
    currentSet: Set<number>,
    sellingPriceTenths: Map<number, number>
  ): Candidate[] {
    return Object.values(data.players.byId)
      .filter((p) => {
        const id = p.generalInfo.id;
        // Trap 2: incumbents always selectable; non-incumbents must be available.
        if (currentSet.has(id)) return true;
        return p.generalInfo.status === 'a';
      })
      .map((player) => {
        const id = player.generalInfo.id;
        const value = player.playerValue[horizon];
        // Null-valued players excluded — incumbents with null value are caught
        // by the caller; non-incumbents with no fixtures can't be signed.
        if (value === null) {
          return null;
        }
        // Trap 3: selling price for incumbents, current price for incoming.
        const price = currentSet.has(id)
          ? (sellingPriceTenths.get(id) ??
            Math.round(player.generalInfo.now_cost * 10))
          : Math.round(player.generalInfo.now_cost * 10);

        return {
          id,
          position: player.generalInfo.element_type,
          club: player.generalInfo.team,
          price,
          value,
          player,
        };
      })
      .filter((c): c is Candidate => c !== null);
  }

  /**
   * Remove strictly dominated candidates.
   *
   * Within a single (position, club) group, player A dominates player B when A
   * costs no more and is worth at least as much. Any feasible squad containing
   * B can swap B for A without breaking the position quota, the club limit or
   * the budget, and without lowering the objective — so B is never required
   * for an optimal solution and can be dropped safely.
   *
   * Restricting the comparison to the same club is what makes this sound: the
   * club limit is the only constraint that distinguishes otherwise
   * interchangeable players, so a same-club swap cannot make a squad
   * infeasible.
   *
   * Players in the `include` list are never pruned.
   *
   * @param candidates - the candidate pool.
   * @param include - player IDs that must survive pruning.
   *
   * @returns the pruned pool.
   */
  private pruneDominated(
    candidates: Candidate[],
    include: number[]
  ): Candidate[] {
    const required = new Set(include);
    const groups = new Map<string, Candidate[]>();

    for (const c of candidates) {
      const key = `${c.position}:${c.club}`;
      const group = groups.get(key);
      if (group) {
        group.push(c);
      } else {
        groups.set(key, [c]);
      }
    }

    const kept: Candidate[] = [];

    for (const group of groups.values()) {
      // Sort by price ascending, then value descending. Walking in this order
      // lets us keep only players that improve on the best value seen at any
      // lower or equal price.
      const sorted = [...group].sort(
        (a, b) => a.price - b.price || b.value - a.value
      );

      let bestValueSoFar = -Infinity;

      for (const c of sorted) {
        if (required.has(c.id) || c.value > bestValueSoFar) {
          kept.push(c);
          bestValueSoFar = Math.max(bestValueSoFar, c.value);
        }
      }
    }

    return kept;
  }

  /**
   * Solve the squad selection exactly using mixed-integer programming.
   *
   * Decision variables per candidate i:
   *   - `s_i` — player starts
   *   - `b_i` — player is on the bench
   *   - `c_i` — player is captain
   *
   * Objective: maximise `value_i * (s_i + c_i + benchWeight_i * b_i)`.
   * Because the captain variable is additive on top of the starting variable,
   * a captained player contributes 2x their value, matching FPL scoring.
   *
   * @param candidates - the pruned candidate pool.
   * @param budgetTenths - budget in tenths of a million.
   * @param benchWeight - weight for outfield bench players.
   * @param benchGkWeight - weight for the bench goalkeeper.
   * @param include - player IDs forced into the squad.
   *
   * @returns the solved squad, or null when no optimal solution was found.
   */
  private solveMilp(
    candidates: Candidate[],
    budgetTenths: number,
    benchWeight: number,
    benchGkWeight: number,
    include: number[]
  ): Omit<
    OptimalSquad,
    'budget' | 'horizon' | 'optimal' | 'candidatesConsidered'
  > | null {
    const model: Record<string, unknown> = {
      optimize: 'objective',
      opType: 'max',
    };

    const constraints: Record<string, Record<string, number>> = {
      budget: { max: budgetTenths },
      starters: { equal: STARTING_SIZE },
      bench: { equal: SQUAD_SIZE - STARTING_SIZE },
      captains: { equal: 1 },
    };

    for (const [pos, rule] of Object.entries(SQUAD_RULES)) {
      constraints[`squad_pos_${pos}`] = { equal: rule.squad };
      constraints[`start_pos_${pos}`] = {
        min: rule.minStart,
        max: rule.maxStart,
      };
    }

    const clubs = new Set(candidates.map((c) => c.club));
    for (const club of clubs) {
      constraints[`club_${club}`] = { max: MAX_PER_CLUB };
    }

    const required = new Set(include);
    for (const id of required) {
      constraints[`require_${id}`] = { equal: 1 };
    }

    const variables: Record<string, Record<string, number>> = {};
    const ints: Record<string, number> = {};

    for (const c of candidates) {
      const bench = c.position === 1 ? benchGkWeight : benchWeight;

      // Starting variable
      variables[`s_${c.id}`] = {
        objective: c.value,
        budget: c.price,
        starters: 1,
        [`squad_pos_${c.position}`]: 1,
        [`start_pos_${c.position}`]: 1,
        [`club_${c.club}`]: 1,
        [`slot_${c.id}`]: 1,
        [`cap_${c.id}`]: -1,
        ...(required.has(c.id) ? { [`require_${c.id}`]: 1 } : {}),
      };

      // Bench variable
      variables[`b_${c.id}`] = {
        objective: c.value * bench,
        budget: c.price,
        bench: 1,
        [`squad_pos_${c.position}`]: 1,
        [`club_${c.club}`]: 1,
        [`slot_${c.id}`]: 1,
        ...(required.has(c.id) ? { [`require_${c.id}`]: 1 } : {}),
      };

      // Captain variable — additive bonus on top of starting
      variables[`c_${c.id}`] = {
        objective: c.value,
        captains: 1,
        [`cap_${c.id}`]: 1,
      };

      // A player occupies at most one squad slot (start or bench, not both)
      constraints[`slot_${c.id}`] = { max: 1 };
      // Captain implies starting: c_i - s_i <= 0
      constraints[`cap_${c.id}`] = { max: 0 };

      ints[`s_${c.id}`] = 1;
      ints[`b_${c.id}`] = 1;
      ints[`c_${c.id}`] = 1;
    }

    model.constraints = constraints;
    model.variables = variables;
    model.ints = ints;

    let solution: Record<string, number> & { feasible?: boolean };
    try {
      // The bundled typings model an internal tableau representation rather
      // than the documented JSON model format, so the cast is required.
      solution = solver.Solve(model as never) as Record<string, number> & {
        feasible?: boolean;
      };
    } catch {
      return null;
    }

    if (!solution || solution.feasible === false) {
      return null;
    }

    const picks: SquadPick[] = [];

    for (const c of candidates) {
      const starting = Math.round(solution[`s_${c.id}`] ?? 0) === 1;
      const benched = Math.round(solution[`b_${c.id}`] ?? 0) === 1;

      if (!starting && !benched) {
        continue;
      }

      picks.push({
        player: c.player,
        starting,
        captain: Math.round(solution[`c_${c.id}`] ?? 0) === 1,
        value: c.value,
      });
    }

    // Guard against a solver returning a structurally invalid squad.
    if (picks.length !== SQUAD_SIZE) {
      return null;
    }
    if (picks.filter((p) => p.starting).length !== STARTING_SIZE) {
      return null;
    }
    if (picks.filter((p) => p.captain).length !== 1) {
      return null;
    }

    return this.summarise(picks, benchWeight, benchGkWeight);
  }

  /**
   * Solve the transfer-constrained squad selection.
   *
   * Adds one constraint on top of the base MILP:
   *   sum(s_i + b_i for i in currentSquadIds) >= 15 - maxTransfers
   *
   * This forces the solver to retain at least (15 - maxTransfers) incumbents.
   * Since both the old and new squads are 15 players, "not retained" is exactly
   * "transferred out" — no separate transfer decision variables are needed.
   *
   * When `fixedObjective` is non-null the objective is pinned and the solver
   * instead maximises the sum of retained incumbents, implementing the
   * lexicographic tie-break (Trap 4).
   *
   * @param candidates - the pruned pool.
   * @param budgetTenths - available funds in tenths of a million.
   * @param benchWeight - weight for outfield bench players.
   * @param benchGkWeight - weight for bench GK.
   * @param currentSquadIds - incumbents.
   * @param maxTransfers - upper bound on changes.
   * @param fixedObjective - when non-null, pin objective and maximise retention.
   *
   * @returns the solved squad summary or null on failure.
   */
  private solveMilpConstrained(
    candidates: Candidate[],
    budgetTenths: number,
    benchWeight: number,
    benchGkWeight: number,
    currentSquadIds: number[],
    maxTransfers: number,
    fixedObjective: number | null
  ): Omit<
    OptimalSquad,
    'budget' | 'horizon' | 'optimal' | 'candidatesConsidered'
  > | null {
    const currentSet = new Set(currentSquadIds);
    const minRetained = SQUAD_SIZE - maxTransfers;

    const model: Record<string, unknown> = {
      optimize: 'objective',
      opType: 'max',
    };

    const constraints: Record<string, Record<string, number>> = {
      budget: { max: budgetTenths },
      starters: { equal: STARTING_SIZE },
      bench: { equal: SQUAD_SIZE - STARTING_SIZE },
      captains: { equal: 1 },
      // THE transfer constraint: retain at least (15 - maxTransfers) incumbents.
      retained: { min: minRetained },
    };

    if (fixedObjective !== null) {
      // Pin the objective value so we can maximise retention instead.
      constraints.objective_pin = { min: fixedObjective };
    }

    for (const [pos, rule] of Object.entries(SQUAD_RULES)) {
      constraints[`squad_pos_${pos}`] = { equal: rule.squad };
      constraints[`start_pos_${pos}`] = {
        min: rule.minStart,
        max: rule.maxStart,
      };
    }

    const clubs = new Set(candidates.map((c) => c.club));
    for (const club of clubs) {
      constraints[`club_${club}`] = { max: MAX_PER_CLUB };
    }

    const variables: Record<string, Record<string, number>> = {};
    const ints: Record<string, number> = {};

    for (const c of candidates) {
      const bench = c.position === 1 ? benchGkWeight : benchWeight;
      const isIncumbent = currentSet.has(c.id);

      // Phase 2 (fixedObjective set): maximise retained count.
      // Phase 1: maximise weighted value.
      const startObjective =
        fixedObjective !== null ? (isIncumbent ? 1 : 0) : c.value;
      const benchObjective =
        fixedObjective !== null
          ? isIncumbent
            ? 1
            : 0
          : c.value * bench;

      variables[`s_${c.id}`] = {
        objective: startObjective,
        ...(fixedObjective !== null ? { objective_pin: c.value } : {}),
        budget: c.price,
        starters: 1,
        [`squad_pos_${c.position}`]: 1,
        [`start_pos_${c.position}`]: 1,
        [`club_${c.club}`]: 1,
        [`slot_${c.id}`]: 1,
        [`cap_${c.id}`]: -1,
        ...(isIncumbent ? { retained: 1 } : {}),
      };

      variables[`b_${c.id}`] = {
        objective: benchObjective,
        ...(fixedObjective !== null ? { objective_pin: c.value * bench } : {}),
        budget: c.price,
        bench: 1,
        [`squad_pos_${c.position}`]: 1,
        [`club_${c.club}`]: 1,
        [`slot_${c.id}`]: 1,
        ...(isIncumbent ? { retained: 1 } : {}),
      };

      variables[`c_${c.id}`] = {
        objective: fixedObjective !== null ? 0 : c.value,
        ...(fixedObjective !== null ? { objective_pin: c.value } : {}),
        captains: 1,
        [`cap_${c.id}`]: 1,
      };

      constraints[`slot_${c.id}`] = { max: 1 };
      constraints[`cap_${c.id}`] = { max: 0 };

      ints[`s_${c.id}`] = 1;
      ints[`b_${c.id}`] = 1;
      ints[`c_${c.id}`] = 1;
    }

    model.constraints = constraints;
    model.variables = variables;
    model.ints = ints;

    let solution: Record<string, number> & { feasible?: boolean };
    try {
      solution = solver.Solve(model as never) as Record<string, number> & {
        feasible?: boolean;
      };
    } catch {
      return null;
    }

    if (!solution || solution.feasible === false) {
      return null;
    }

    const picks: SquadPick[] = [];

    for (const c of candidates) {
      const starting = Math.round(solution[`s_${c.id}`] ?? 0) === 1;
      const benched = Math.round(solution[`b_${c.id}`] ?? 0) === 1;

      if (!starting && !benched) {
        continue;
      }

      picks.push({
        player: c.player,
        starting,
        captain: Math.round(solution[`c_${c.id}`] ?? 0) === 1,
        value: c.value,
      });
    }

    if (picks.length !== SQUAD_SIZE) {
      return null;
    }
    if (picks.filter((p) => p.starting).length !== STARTING_SIZE) {
      return null;
    }
    if (picks.filter((p) => p.captain).length !== 1) {
      return null;
    }

    return this.summarise(picks, benchWeight, benchGkWeight);
  }

  /**
   * Build a feasible squad greedily, then improve it with local search.
   *
   * Used as a fallback when the MILP solver fails, so the endpoint always
   * returns a usable squad. Results are flagged `optimal: false`.
   *
   * @param candidates - the pruned candidate pool.
   * @param budgetTenths - budget in tenths of a million.
   * @param benchWeight - weight for outfield bench players.
   * @param benchGkWeight - weight for the bench goalkeeper.
   * @param include - player IDs forced into the squad.
   *
   * @returns the best squad found.
   */
  private solveGreedy(
    candidates: Candidate[],
    budgetTenths: number,
    benchWeight: number,
    benchGkWeight: number,
    include: number[]
  ): Omit<
    OptimalSquad,
    'budget' | 'horizon' | 'optimal' | 'candidatesConsidered'
  > {
    const required = candidates.filter((c) => include.includes(c.id));
    const squad: Candidate[] = [...required];
    const clubCount = new Map<number, number>();
    const posCount = new Map<number, number>();
    let spend = 0;

    for (const c of squad) {
      clubCount.set(c.club, (clubCount.get(c.club) ?? 0) + 1);
      posCount.set(c.position, (posCount.get(c.position) ?? 0) + 1);
      spend += c.price;
    }

    // Greedily fill remaining slots by value density, respecting all limits.
    const pool = candidates
      .filter((c) => !squad.includes(c))
      .sort((a, b) => b.value / b.price - a.value / a.price);

    for (const c of pool) {
      if (squad.length >= SQUAD_SIZE) break;

      const rule = SQUAD_RULES[c.position];
      if (!rule) continue;
      if ((posCount.get(c.position) ?? 0) >= rule.squad) continue;
      if ((clubCount.get(c.club) ?? 0) >= MAX_PER_CLUB) continue;
      if (spend + c.price > budgetTenths) continue;

      squad.push(c);
      clubCount.set(c.club, (clubCount.get(c.club) ?? 0) + 1);
      posCount.set(c.position, (posCount.get(c.position) ?? 0) + 1);
      spend += c.price;
    }

    return this.summarise(this.pickLineup(squad), benchWeight, benchGkWeight);
  }

  /**
   * Transfer-constrained greedy fallback.
   *
   * Trap 5: unlike the base greedy, this fallback enforces the Hamming-distance
   * constraint. It locks in all incumbents first, then greedily replaces at most
   * `maxTransfers` of them (lowest-value first) with better-value alternatives.
   * If the resulting squad is structurally invalid or over budget, it returns
   * null — the caller must surface an error rather than a corrupt plan.
   *
   * @param candidates - the pruned pool.
   * @param budgetTenths - available funds.
   * @param benchWeight - weight for outfield bench players.
   * @param benchGkWeight - weight for bench GK.
   * @param currentSquadIds - incumbents.
   * @param maxTransfers - maximum changes.
   *
   * @returns valid squad or null.
   */
  private solveGreedyConstrained(
    candidates: Candidate[],
    budgetTenths: number,
    benchWeight: number,
    benchGkWeight: number,
    currentSquadIds: number[],
    maxTransfers: number
  ): Omit<
    OptimalSquad,
    'budget' | 'horizon' | 'optimal' | 'candidatesConsidered'
  > | null {
    const currentSet = new Set(currentSquadIds);
    const byId = new Map(candidates.map((c) => [c.id, c]));

    // Start with all incumbents that are in the candidate pool.
    const squad: Candidate[] = currentSquadIds
      .map((id) => byId.get(id))
      .filter((c): c is Candidate => c !== undefined);

    // If some incumbents were dropped (not in candidate pool), we can't build.
    if (squad.length !== SQUAD_SIZE) {
      return null;
    }

    let spend = squad.reduce((sum, c) => sum + c.price, 0);

    if (spend > budgetTenths) {
      return null;
    }

    // Rank incumbents by ascending value — swap out the worst ones first.
    const rankedIncumbents = [...squad].sort((a, b) => a.value - b.value);

    // Candidates not in the current squad, sorted by value descending.
    const newSignings = candidates
      .filter((c) => !currentSet.has(c.id))
      .sort((a, b) => b.value - a.value);

    let transfersUsed = 0;

    for (const incumbent of rankedIncumbents) {
      if (transfersUsed >= maxTransfers) break;

      // Find the best affordable same-position signing.
      const replacement = newSignings.find((c) => {
        if (c.position !== incumbent.position) return false;
        if (squad.some((s) => s.id === c.id)) return false;

        // Check club cap: would adding this signing exceed MAX_PER_CLUB?
        const clubCount = squad.filter(
          (s) => s.id !== incumbent.id && s.club === c.club
        ).length;
        if (clubCount >= MAX_PER_CLUB) return false;

        // Budget: remove incumbent selling price, add new cost.
        const newSpend = spend - incumbent.price + c.price;
        return newSpend <= budgetTenths;
      });

      if (!replacement || replacement.value <= incumbent.value) {
        // No improvement available; do not waste a transfer.
        continue;
      }

      // Swap.
      const idx = squad.findIndex((s) => s.id === incumbent.id);
      squad[idx] = replacement;
      spend = spend - incumbent.price + replacement.price;
      transfersUsed++;
    }

    // Structural validation — Trap 5: return null rather than a corrupt plan.
    if (squad.length !== SQUAD_SIZE) return null;

    const posCounts = new Map<number, number>();
    for (const c of squad) {
      posCounts.set(c.position, (posCounts.get(c.position) ?? 0) + 1);
    }
    for (const [pos, rule] of Object.entries(SQUAD_RULES)) {
      if ((posCounts.get(Number(pos)) ?? 0) !== rule.squad) return null;
    }

    const clubCounts = new Map<number, number>();
    for (const c of squad) {
      clubCounts.set(c.club, (clubCounts.get(c.club) ?? 0) + 1);
    }
    for (const count of clubCounts.values()) {
      if (count > MAX_PER_CLUB) return null;
    }

    if (spend > budgetTenths) return null;

    return this.summarise(this.pickLineup(squad), benchWeight, benchGkWeight);
  }

  /**
   * Choose the best legal starting XI from a 15-man squad.
   *
   * Enumerates every valid formation and picks the highest-scoring one. The
   * captain is always the most valuable starter, so it is assigned after the
   * lineup is fixed.
   *
   * @param squad - the 15 selected candidates.
   *
   * @returns the squad annotated with starting/captain flags.
   */
  private pickLineup(squad: Candidate[]): SquadPick[] {
    const byPosition = new Map<number, Candidate[]>();
    for (const c of squad) {
      const list = byPosition.get(c.position) ?? [];
      list.push(c);
      byPosition.set(c.position, list);
    }
    for (const list of byPosition.values()) {
      list.sort((a, b) => b.value - a.value);
    }

    let best: { starters: Set<number>; total: number } | null = null;

    const defRule = SQUAD_RULES[2];
    const midRule = SQUAD_RULES[3];
    const fwdRule = SQUAD_RULES[4];

    for (let def = defRule.minStart; def <= defRule.maxStart; def++) {
      for (let mid = midRule.minStart; mid <= midRule.maxStart; mid++) {
        const fwd = STARTING_SIZE - 1 - def - mid;
        if (fwd < fwdRule.minStart || fwd > fwdRule.maxStart) continue;

        const starters = new Set<number>();
        let total = 0;

        const take = (position: number, n: number): boolean => {
          const list = byPosition.get(position) ?? [];
          if (list.length < n) return false;
          for (let i = 0; i < n; i++) {
            starters.add(list[i].id);
            total += list[i].value;
          }
          return true;
        };

        if (!take(1, 1) || !take(2, def) || !take(3, mid) || !take(4, fwd)) {
          continue;
        }

        if (!best || total > best.total) {
          best = { starters, total };
        }
      }
    }

    const startingIds = best?.starters ?? new Set<number>();

    // Captain is the highest-value starter.
    let captainId = -1;
    let captainValue = -Infinity;
    for (const c of squad) {
      if (startingIds.has(c.id) && c.value > captainValue) {
        captainValue = c.value;
        captainId = c.id;
      }
    }

    return squad.map(({ player, id, value }) => ({
      player: player,
      starting: startingIds.has(id),
      captain: id === captainId,
      value: value,
    }));
  }

  /**
   * Compute cost, formation and objective score for a set of picks.
   *
   * @param picks - the selected players with starting/captain flags.
   * @param benchWeight - weight for outfield bench players.
   * @param benchGkWeight - weight for the bench goalkeeper.
   *
   * @returns the summarised squad.
   */
  private summarise(
    picks: SquadPick[],
    benchWeight: number,
    benchGkWeight: number
  ): Omit<
    OptimalSquad,
    'budget' | 'horizon' | 'optimal' | 'candidatesConsidered'
  > {
    const totalCost = picks.reduce(
      (sum, p) => sum + p.player.generalInfo.now_cost,
      0
    );

    const totalValue = picks.reduce((sum, p) => {
      if (p.starting) {
        return sum + p.value + (p.captain ? p.value : 0);
      }
      const weight =
        p.player.generalInfo.element_type === 1 ? benchGkWeight : benchWeight;
      return sum + p.value * weight;
    }, 0);

    const starters = picks.filter((p) => p.starting);
    const count = (position: number) =>
      starters.filter((p) => p.player.generalInfo.element_type === position)
        .length;

    return {
      picks,
      formation: `${count(2)}-${count(3)}-${count(4)}`,
      totalCost: Math.round(totalCost * 10) / 10,
      totalValue,
    };
  }
}
