import {
  ProcessedData,
  SquadHorizon,
  SQUAD_SIZE,
  SQUAD_RULES,
  MAX_PER_CLUB,
  TransferPlanRequest,
  TransferPlanSquadPlayer,
  TransferPlan,
  TransferPlanMove,
  TransferPlanPriceBasis,
} from '@fpl/contracts/fpl';
import { ApplicationService } from '../../app';
import {
  SquadOptimizerService,
  ConstrainedOptimizeOptions,
} from '../SquadOptimizerService';

/**
 * Thin orchestration layer for joint multi-transfer planning.
 *
 * Validates the request, computes financial capacity (all prices in integer
 * tenths), calls the constrained optimizer, then diffs old vs new squad to
 * produce an ordered, annotated list of moves.
 */
export class TransferPlannerService extends ApplicationService {
  /**
   * Compute the best joint transfer plan for up to N moves.
   *
   * @param data - the processed FPL data.
   * @param request - the validated transfer plan request.
   *
   * @returns the transfer plan.
   * @throws when the input is invalid or no feasible plan can be found.
   */
  public planTransfers(
    data: ProcessedData,
    request: TransferPlanRequest
  ): TransferPlan {
    const { squad, bank, freeTransfers, horizon = 'value5' } = request;

    // --- Validate squad shape ---
    this.validateSquadShape(data, squad);

    // --- Check for null-valued incumbents (Null trap: do not treat as 0) ---
    for (const entry of squad) {
      const player = data.players.byId[entry.playerId];
      if (!player) {
        throw new Error(`Player ${entry.playerId} not found`);
      }
      const value = player.playerValue[horizon];
      if (value === null) {
        throw new Error(
          `Incumbent player ${entry.playerId} (${player.generalInfo.web_name}) ` +
            `has no fixtures on horizon '${horizon}' and cannot be valued. ` +
            `Use a different horizon or remove this player from the squad.`
        );
      }
    }

    // --- Compute financial capacity (integer tenths throughout) ---
    const bankTenths = Math.round(bank * 10);
    const sellingPriceTenths = this.buildSellingPriceMap(data, squad);
    const totalSellingTenths = squad.reduce((sum, entry) => {
      return sum + (sellingPriceTenths.get(entry.playerId) ?? 0);
    }, 0);
    const budgetTenths = totalSellingTenths + bankTenths;

    // --- Determine price basis for transparency ---
    const priceBasis = this.computePriceBasis(data, squad);

    // --- Call constrained optimizer ---
    const currentSquadIds = squad.map((e) => e.playerId);
    const maxTransfers = freeTransfers; // No points-hit modelling; cap at freeTransfers.

    const opts: ConstrainedOptimizeOptions = {
      currentSquadIds,
      sellingPriceTenths,
      budgetTenths,
      maxTransfers,
      horizon,
    };

    const optimizer = new SquadOptimizerService();
    const result = optimizer.optimizeWithTransferConstraint(data, opts);

    if (result === null) {
      throw new Error(
        'No feasible transfer plan found. ' +
          'The solver could not construct a valid squad within the constraints. ' +
          'Try increasing freeTransfers or adjusting the squad.'
      );
    }

    // --- Diff old vs new squad ---
    const newIds = new Set(
      result.picks.map((p) => p.player.generalInfo.id)
    );
    const oldIds = new Set(currentSquadIds);

    const outgoingIds = currentSquadIds.filter((id) => !newIds.has(id));
    const incomingIds = result.picks
      .map((p) => p.player.generalInfo.id)
      .filter((id) => !oldIds.has(id));

    // Pair by position — within each position, pair best incoming with best
    // outgoing (by value). Financially releasing moves (costDelta < 0) appear
    // first so the ordering shows how money is freed before it is spent.
    const moves = this.pairMoves(
      data,
      outgoingIds,
      incomingIds,
      sellingPriceTenths,
      horizon
    );

    // --- Financial summary (integer tenths, then convert to millions) ---
    const netSpendTenths = moves.reduce(
      (sum, m) => sum + Math.round(m.costDelta * 10),
      0
    );
    const resultingBankTenths = bankTenths - netSpendTenths;

    // Current and resulting total value (sum of individual player values,
    // unweighted — this is a ranking signal, not a projected points total).
    const currentTotalValue = currentSquadIds.reduce((sum, id) => {
      const v = data.players.byId[id]?.playerValue[horizon];
      // All incumbents were validated as non-null above; cast is safe.
      return sum + (v as number);
    }, 0);

    const resultingTotalValue = result.picks.reduce(
      (sum, p) => sum + p.value,
      0
    );

    return {
      moves,
      transfersUsed: result.transfersUsed,
      freeTransfers,
      netSpend: Math.round(netSpendTenths) / 10,
      resultingBank: Math.round(resultingBankTenths) / 10,
      currentTotalValue,
      resultingTotalValue,
      totalValueGain: resultingTotalValue - currentTotalValue,
      resultingPicks: result.picks,
      resultingFormation: result.formation,
      horizon,
      optimal: result.optimal,
      candidatesConsidered: result.candidatesConsidered,
      priceBasis,
    };
  }

  /**
   * Validate that the submitted squad has exactly 15 distinct known players,
   * matches FPL position quotas, and respects the 3-per-club rule.
   */
  private validateSquadShape(
    data: ProcessedData,
    squad: TransferPlanSquadPlayer[]
  ): void {
    if (squad.length !== SQUAD_SIZE) {
      throw new Error(
        `Squad must contain exactly ${SQUAD_SIZE} players, got ${squad.length}`
      );
    }

    const ids = squad.map((e) => e.playerId);
    const uniqueIds = new Set(ids);
    if (uniqueIds.size !== SQUAD_SIZE) {
      throw new Error('Squad contains duplicate player IDs');
    }

    const posCounts = new Map<number, number>();
    const clubCounts = new Map<number, number>();

    for (const entry of squad) {
      const player = data.players.byId[entry.playerId];
      if (!player) {
        throw new Error(`Player with id ${entry.playerId} not found`);
      }

      if (entry.sellingPrice !== undefined) {
        if (
          !Number.isFinite(entry.sellingPrice) ||
          entry.sellingPrice <= 0
        ) {
          throw new Error(
            `Selling price for player ${entry.playerId} must be a positive finite number`
          );
        }
      }

      const pos = player.generalInfo.element_type;
      posCounts.set(pos, (posCounts.get(pos) ?? 0) + 1);

      const club = player.generalInfo.team;
      clubCounts.set(club, (clubCounts.get(club) ?? 0) + 1);
    }

    for (const [pos, rule] of Object.entries(SQUAD_RULES)) {
      const count = posCounts.get(Number(pos)) ?? 0;
      if (count !== rule.squad) {
        throw new Error(
          `Position ${pos} requires exactly ${rule.squad} players, got ${count}`
        );
      }
    }

    for (const [club, count] of clubCounts) {
      if (count > MAX_PER_CLUB) {
        throw new Error(
          `Club ${club} has ${count} players in the squad, exceeding the maximum of ${MAX_PER_CLUB}`
        );
      }
    }
  }

  /**
   * Build a map of incumbent selling prices in integer tenths.
   *
   * Uses the provided sellingPrice when available, otherwise falls back to
   * the player's current FPL price.
   */
  private buildSellingPriceMap(
    data: ProcessedData,
    squad: TransferPlanSquadPlayer[]
  ): Map<number, number> {
    const map = new Map<number, number>();

    for (const entry of squad) {
      const player = data.players.byId[entry.playerId];
      if (!player) continue;

      const price =
        entry.sellingPrice !== undefined
          ? Math.round(entry.sellingPrice * 10)
          : Math.round(player.generalInfo.now_cost * 10);

      map.set(entry.playerId, price);
    }

    return map;
  }

  /**
   * Determine how transfer prices were sourced.
   */
  private computePriceBasis(
    data: ProcessedData,
    squad: TransferPlanSquadPlayer[]
  ): TransferPlanPriceBasis {
    let provided = 0;
    let fallback = 0;

    for (const entry of squad) {
      const player = data.players.byId[entry.playerId];
      if (!player) continue;

      if (entry.sellingPrice !== undefined) {
        // Check whether the provided price differs from current (truly overriding)
        const currentTenths = Math.round(player.generalInfo.now_cost * 10);
        const providedTenths = Math.round(entry.sellingPrice * 10);
        if (providedTenths !== currentTenths) {
          provided++;
        } else {
          fallback++;
        }
      } else {
        fallback++;
      }
    }

    if (provided === 0) return 'current_price';
    if (fallback === 0) return 'provided_selling_price';
    return 'mixed';
  }

  /**
   * Pair outgoing and incoming players by position, order them with
   * financially-releasing moves first, and annotate each with prices.
   */
  private pairMoves(
    data: ProcessedData,
    outgoingIds: number[],
    incomingIds: number[],
    sellingPriceTenths: Map<number, number>,
    horizon: SquadHorizon
  ): TransferPlanMove[] {
    // Group outgoing and incoming by position.
    const outByPos = new Map<number, number[]>();
    for (const id of outgoingIds) {
      const pos = data.players.byId[id]?.generalInfo.element_type;
      if (pos === undefined) continue;
      const arr = outByPos.get(pos) ?? [];
      arr.push(id);
      outByPos.set(pos, arr);
    }

    const inByPos = new Map<number, number[]>();
    for (const id of incomingIds) {
      const pos = data.players.byId[id]?.generalInfo.element_type;
      if (pos === undefined) continue;
      const arr = inByPos.get(pos) ?? [];
      arr.push(id);
      inByPos.set(pos, arr);
    }

    const unpaired: TransferPlanMove[] = [];

    for (const [pos, outIds] of outByPos) {
      const inIds = inByPos.get(pos) ?? [];

      for (let i = 0; i < outIds.length && i < inIds.length; i++) {
        const outId = outIds[i];
        const inId = inIds[i];

        const playerOut = data.players.byId[outId];
        const playerIn = data.players.byId[inId];

        if (!playerOut || !playerIn) continue;

        const sellingPrice =
          (sellingPriceTenths.get(outId) ?? Math.round(playerOut.generalInfo.now_cost * 10)) / 10;
        const purchasePrice = playerIn.generalInfo.now_cost;
        const costDelta = Math.round((purchasePrice - sellingPrice) * 10) / 10;

        const outValue = playerOut.playerValue[horizon] as number;
        const inValue = playerIn.playerValue[horizon] as number;

        unpaired.push({
          order: 0, // assigned below
          playerOut: playerOut,
          playerIn: playerIn,
          sellingPrice,
          purchasePrice,
          costDelta,
          valueGain: inValue - outValue,
        });
      }
    }

    // Order: financially-releasing moves (costDelta < 0) first, then by
    // value gain descending.
    unpaired.sort((a, b) => {
      if (a.costDelta < 0 && b.costDelta >= 0) return -1;
      if (a.costDelta >= 0 && b.costDelta < 0) return 1;
      return b.valueGain - a.valueGain;
    });

    return unpaired.map((m, i) => ({ ...m, order: i + 1 }));
  }
}
