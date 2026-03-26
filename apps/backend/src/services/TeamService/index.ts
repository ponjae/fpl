import {
  ProcessedData,
  ProcessedPlayer,
  TeamData,
  TeamDataDict,
} from '@fpl/contracts/fpl';
import { ApplicationService } from '../../app';

export class TeamService extends ApplicationService {
  /**
   * Get all teams from the processed data.
   *
   * @param data - the complete processed data structure.
   *
   * @returns - a dictionary of all teams.
   */
  public async getAllTeams(data: ProcessedData): Promise<TeamDataDict> {
    return data.teamData;
  }

  /**
   * Get a team by its ID from the processed data.
   *
   * @param data - the complete processed data structure.
   * @param teamId - the ID of the team to retrieve.
   *
   * @returns - the team data for the specified team ID, or undefined if not found.
   */
  public async getTeam(
    data: ProcessedData,
    teamId: number
  ): Promise<TeamData | undefined> {
    const teamName = data.idTeamDict[teamId];
    if (!teamName) {
      return undefined;
    }
    return data.teamData[teamName];
  }

  /**
   * Get players by team ID from the processed data.
   *
   * @param data - the complete processed data structure.
   * @param teamId - the ID of the team to retrieve players for.
   *
   * @returns - an array of processed players belonging to the specified team ID.
   */
  public async getPlayersByTeam(
    data: ProcessedData,
    teamId: number
  ): Promise<ProcessedPlayer[]> {
    const teamName = data.idTeamDict[teamId];
    if (!teamName) {
      return [];
    }
    return data.players.byTeam[teamName] || [];
  }
}
