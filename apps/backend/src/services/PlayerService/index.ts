import { ProcessedData, ProcessedPlayer } from '@fpl/contracts/fpl';
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
   * Get all players for a specific team.
   *
   * @param data - the processed FPL data.
   * @param teamName - the team name.
   */
  public async getPlayersByTeam(
    data: ProcessedData,
    teamName: string
  ): Promise<ProcessedPlayer[]> {
    return data.players.byTeam[teamName];
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
   * Get top N players sorted by an attribute.
   *
   * @param data - the processed FPL data.
   * @param attribute - the attribute to sort by.
   * @param limit - the maximum number of players to return.
   */
  public async getTopPlayers(
    data: ProcessedData,
    attribute: keyof ProcessedPlayer,
    limit = 10
  ): Promise<ProcessedPlayer[]> {
    const allPlayers = Object.values(data.players.byId);

    return allPlayers
      .sort((a, b) => {
        const aVal = a[attribute];
        const bVal = b[attribute];
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return bVal - aVal; // Descending
        }
        return 0;
      })
      .slice(0, limit);
  }
}
