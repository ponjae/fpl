import {
  ProcessedData,
  ProcessedPlayer,
  PlayerSortKey,
  SortDirection,
} from '@fpl/contracts/fpl';
import { ApplicationService } from '../../app';

/**
 * Grouped players organized by team, position, and ID.
 */
export type GroupedPlayers = {
  byTeam: Record<string, ProcessedPlayer[]>;
  byPosition: Record<string, ProcessedPlayer[]>;
  byId: Record<number, ProcessedPlayer>;
  lastUpdated: Date;
};

/**
 * Accessor map from PlayerSortKey to a function that extracts the numeric
 * (or null) value from a ProcessedPlayer. Centralised here so getTopPlayers
 * and future ranking logic share the same traversal without string-splitting.
 */
const SORT_KEY_ACCESSOR: Record<
  PlayerSortKey,
  (p: ProcessedPlayer) => number | null
> = {
  form: ({ playerStats }) => playerStats.form,
  now_cost: ({ generalInfo }) => generalInfo.now_cost,
  points_per_game: ({ playerStats }) => playerStats.points_per_game,
  selected_by_percent: ({ playerStats }) => playerStats.selected_by_percent,
  total_points: ({ playerStats }) => playerStats.total_points,
  transfers_in: ({ playerStats }) => playerStats.transfers_in,
  transfers_out: ({ playerStats }) => playerStats.transfers_out,
  minutes: ({ playerStats }) => playerStats.minutes,
  goals_scored: ({ playerStats }) => playerStats.goals_scored,
  assists: ({ playerStats }) => playerStats.assists,
  saves: ({ playerStats }) => playerStats.saves,
  penalties_saved: ({ playerStats }) => playerStats.penalties_saved,
  points_per_million: ({ playerStats }) => playerStats.points_per_million,
  value: ({ playerValue }) => playerValue.value,
  value5: ({ playerValue }) => playerValue.value5,
  value_remaining: ({ playerValue }) => playerValue.value_remaining,
};

export class PlayerService extends ApplicationService {
  /**
   * Get all players grouped by team and position.
   *
   * @param data - the processed FPL data.
   */
  public async getPlayers(data: ProcessedData): Promise<GroupedPlayers> {
    return {
      byTeam: data.players.byTeam,
      byPosition: data.players.byPosition,
      byId: data.players.byId,
      lastUpdated: data.lastUpdated,
    };
  }

  /**
   * Get all players for a specific position.
   *
   * @param data - the processed FPL data.
   * @param position - the position name.
   */
  public async getPlayersByPosition(
    data: ProcessedData,
    position: string
  ): Promise<ProcessedPlayer[]> {
    return data.players.byPosition[position];
  }

  /**
   * Get a specific player by ID.
   *
   * @param data - the processed FPL data.
   * @param id - the player ID.
   */
  public async getPlayer(
    data: ProcessedData,
    id: number
  ): Promise<ProcessedPlayer> {
    return data.players.byId[id];
  }

  /**
   * Get top N players sorted by a numeric leaf field.
   *
   * Nulls (players with no fixtures in the relevant horizon) always sort LAST
   * in descending order and FIRST in ascending order — i.e. they are treated as
   * "no value" rather than as zero.
   *
   * NOTE: this method is not yet exposed on any route. The other lane (controllers)
   * must add a route to PlayerController to expose it.
   *
   * @param data - the processed FPL data.
   * @param sortKey - the field to sort by (see PlayerSortKey).
   * @param limit - the maximum number of players to return.
   * @param direction - sort direction; defaults to 'desc'.
   */
  public async getTopPlayers(
    data: ProcessedData,
    sortKey: PlayerSortKey,
    limit = 10,
    direction: SortDirection = 'desc'
  ): Promise<ProcessedPlayer[]> {
    const accessor = SORT_KEY_ACCESSOR[sortKey];
    const allPlayers = Object.values(data.players.byId);

    return allPlayers
      .slice()
      .sort((a, b) => {
        const aVal = accessor(a);
        const bVal = accessor(b);

        // Nulls sort last in descending, first in ascending
        if (aVal === null && bVal === null) return 0;
        if (aVal === null) return direction === 'desc' ? 1 : -1;
        if (bVal === null) return direction === 'desc' ? -1 : 1;

        return direction === 'desc' ? bVal - aVal : aVal - bVal;
      })
      .slice(0, limit);
  }
}
