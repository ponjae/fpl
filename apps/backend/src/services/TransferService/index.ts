import {
  ProcessedData,
  ProcessedPlayer,
  SquadHorizon,
  TransferSuggestion,
  TransferSuggestionOptions,
  UnderPerformer,
} from '@fpl/contracts/fpl';
import { ApplicationService } from '../../app';

export class TransferService extends ApplicationService {
  /**
   * Suggest replacements for a player being transferred out.
   *
   * Candidates must play the same position, be available, and fit within the
   * affordable budget (money in the bank plus the outgoing player's sale
   * price). Results are ranked by value on the chosen horizon.
   *
   * Players with a null value on that horizon (no fixtures) are excluded
   * rather than ranked last, since they cannot be meaningfully compared.
   *
   * @param data - the processed FPL data.
   * @param options - the outgoing player, budget, horizon and limit.
   *
   * @returns the ranked suggestions, best first.
   */
  public suggestTransfers(
    data: ProcessedData,
    options: TransferSuggestionOptions
  ): TransferSuggestion[] {
    const {
      playerOutId,
      budget = 0,
      horizon = 'value5',
      limit = 5,
    } = options;

    const playerOut = data.players.byId[playerOutId];
    if (!playerOut) {
      return [];
    }

    const affordable = playerOut.generalInfo.now_cost + budget;
    const outValue = playerOut.playerValue[horizon];

    return Object.values(data.players.byId)
      .filter(
        (p) =>
          p.generalInfo.id !== playerOutId &&
          p.generalInfo.element_type === playerOut.generalInfo.element_type &&
          p.generalInfo.status === 'a' &&
          p.generalInfo.now_cost <= affordable &&
          p.playerValue[horizon] !== null
      )
      .map((playerIn) => ({
        playerOut,
        playerIn,
        valueGain: (playerIn.playerValue[horizon] as number) - (outValue ?? 0),
        costDelta:
          Math.round(
            (playerIn.generalInfo.now_cost - playerOut.generalInfo.now_cost) *
              10
          ) / 10,
      }))
      .sort((a, b) => b.valueGain - a.valueGain)
      .slice(0, limit);
  }

  /**
   * Identify underperformers among a set of players.
   *
   * Each player is ranked against every available player in the same position
   * on the chosen horizon. A low rank means many cheaper or better-valued
   * alternatives exist, which is the signal the old app surfaced as an
   * "under performer".
   *
   * Results are returned worst-first so the most urgent problems appear first.
   *
   * @param data - the processed FPL data.
   * @param playerIds - the user's squad.
   * @param horizon - the value horizon to judge against.
   *
   * @returns the players annotated with their position rank, worst first.
   */
  public findUnderPerformers(
    data: ProcessedData,
    playerIds: number[],
    horizon: SquadHorizon = 'value5'
  ): UnderPerformer[] {
    const rankings = this.buildPositionRankings(data, horizon);

    return playerIds
      .map((id) => data.players.byId[id])
      .filter((p): p is ProcessedPlayer => Boolean(p))
      .map((player) => {
        const position = player.generalInfo.element_type;
        const ranked = rankings.get(position) ?? [];
        const index = ranked.indexOf(player.generalInfo.id);

        return {
          player,
          value: player.playerValue[horizon],
          // Unranked players (null value / unavailable) sort to the very back.
          positionRank: index === -1 ? ranked.length + 1 : index + 1,
          positionCount: ranked.length,
        };
      })
      .sort((a, b) => b.positionRank - a.positionRank);
  }

  /**
   * Rank every available player within their position by value.
   *
   * @param data - the processed FPL data.
   * @param horizon - the value horizon to rank on.
   *
   * @returns a map of element_type to ordered player IDs, best first.
   */
  private buildPositionRankings(
    data: ProcessedData,
    horizon: SquadHorizon
  ): Map<number, number[]> {
    const byPosition = new Map<number, ProcessedPlayer[]>();

    for (const player of Object.values(data.players.byId)) {
      if (player.generalInfo.status !== 'a') continue;
      if (player.playerValue[horizon] === null) continue;

      const position = player.generalInfo.element_type;
      const list = byPosition.get(position) ?? [];
      list.push(player);
      byPosition.set(position, list);
    }

    const rankings = new Map<number, number[]>();

    for (const [position, players] of byPosition) {
      rankings.set(
        position,
        players
          .sort(
            (a, b) =>
              (b.playerValue[horizon] as number) -
              (a.playerValue[horizon] as number)
          )
          .map((p) => p.generalInfo.id)
      );
    }

    return rankings;
  }
}
