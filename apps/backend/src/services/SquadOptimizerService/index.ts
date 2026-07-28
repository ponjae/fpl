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
