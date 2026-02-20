import {
  RawPlayer,
  ProcessedPlayer,
  FDRDict,
  RawTeam,
  ElementType,
  PositionPlayerDict,
  TeamPlayerDict,
} from '@fpl/contracts/fpl';
import { ApplicationService } from '../../../app';
import { FDRCalculator } from '../FDRCalculator';
import { PlayerEvaluator } from '../PlayerEvaluator';

export class DataProcessor extends ApplicationService {
  /**
   * Processes a raw player and returns a processed player.
   *
   * @param rawPlayer - the raw player data.
   * @param fdrDict - the FDR dictionary.
   * @param nextGw - the next game week.
   * @param fdrCalculator - the FDR calculator service.
   * @param playerEvaluator - the player evaluator service.
   *
   * @returns the processed player.
   */
  public processPlayer(
    rawPlayer: RawPlayer,
    fdrDict: FDRDict,
    nextGw: number,
    fdrCalculator: FDRCalculator,
    playerEvaluator: PlayerEvaluator
  ): ProcessedPlayer {
    const {
      first_name,
      web_name,
      form,
      id,
      points_per_game,
      element_type,
      selected_by_percent,
      team,
      now_cost,
      total_points,
      transfers_in,
      transfers_out,
      minutes,
      goals_scored,
      assists,
      clean_sheets,
      penalties_saved,
      penalties_missed,
      saves,
      bonus,
      status,
    } = rawPlayer;

    const cost = now_cost / 10;
    const pointsPerMillion = total_points / cost;
    const playerTeam = team;

    const fdr1 = fdrCalculator.calculateTeamFDR(playerTeam, fdrDict, nextGw, 1);
    const fdr5 = fdrCalculator.calculateTeamFDR(playerTeam, fdrDict, nextGw, 5);
    const fdrRemaining = this.calculateRemainingFDR(
      playerTeam,
      fdrDict,
      nextGw,
      fdrCalculator
    );

    const gamesNextGw = fdrCalculator.calculateRemainingGames(
      playerTeam,
      fdrDict,
      nextGw,
      1
    );
    const gamesNextFive = fdrCalculator.calculateRemainingGames(
      playerTeam,
      fdrDict,
      nextGw,
      5
    );
    const totalGamesRemaining = this.calculateAllRemainingGames(
      playerTeam,
      fdrDict,
      nextGw,
      fdrCalculator
    );

    const processedPlayer: ProcessedPlayer = {
      fixtureData: {
        fdr1,
        fdr5,
        fdr_remaining: fdrRemaining,
      },
      generalInfo: {
        element_type,
        first_name,
        id,
        now_cost: cost,
        status,
        team,
        web_name,
      },
      playerStats: {
        assists,
        bonus,
        clean_sheets,
        form: Number(form),
        goals_scored,
        minutes,
        penalties_missed,
        penalties_saved,
        points_per_game: Number(points_per_game),
        points_per_million: pointsPerMillion,
        saves,
        selected_by_percent: Number(selected_by_percent),
        total_points,
        transfers_in,
        transfers_out,
      },
      playerValue: {
        value: 0,
        value5: 0,
        value_remaining: 0,
      },
      games: {
        games_next_gw: gamesNextGw,
        games_next_five: gamesNextFive,
        total_games_remaining: totalGamesRemaining,
      },
    };

    // Calculate player value using the evaluator
    processedPlayer.playerValue =
      playerEvaluator.calculatePlayerValue(processedPlayer);

    return processedPlayer;
  }

  /**
   * Group players by team name.
   *
   * @param players - the processed players to group.
   * @param teams - the raw team data for ID to name mapping.
   *
   * @returns a dictionary with team names as keys and arrays of players as values.
   */
  public groupByTeam(
    players: ProcessedPlayer[],
    teams: RawTeam[]
  ): TeamPlayerDict {
    const teamIdToName = new Map<number, string>();
    teams.forEach(({ id, name }) => teamIdToName.set(id, name));

    const teamPlayerDict: TeamPlayerDict = {};

    for (const player of players) {
      const teamId = player.generalInfo.team;
      const teamName = teamIdToName.get(teamId);

      if (!teamName) continue;

      if (!teamPlayerDict[teamName]) {
        teamPlayerDict[teamName] = [];
      }
      teamPlayerDict[teamName].push(player);
    }

    return teamPlayerDict;
  }

  /**
   * Group players by position.
   *
   * @param players - the processed players to group.
   * @param elementTypes - the element type data for ID to position mapping.
   *
   * @returns a dictionary with position names as keys and arrays of players as values.
   */
  public groupByPosition(
    players: ProcessedPlayer[],
    elementTypes: ElementType[]
  ): PositionPlayerDict {
    const positionIdToName = new Map<number, string>();
    elementTypes.forEach(({ id, plural_name }) =>
      positionIdToName.set(id, plural_name)
    );

    const positionPlayerDict: PositionPlayerDict = {
      Goalkeepers: [],
      Defenders: [],
      Midfielders: [],
      Forwards: [],
    };

    for (const player of players) {
      const positionId = player.generalInfo.element_type;
      const positionName = positionIdToName.get(
        positionId
      ) as keyof PositionPlayerDict;

      if (positionName && positionPlayerDict[positionName]) {
        positionPlayerDict[positionName].push(player);
      }
    }

    return positionPlayerDict;
  }

  /**
   * Create player ID lookup dictionary.
   *
   * @param players - the processed players to index.
   *
   * @returns a dictionary with player IDs as keys and player objects as values.
   */
  public createPlayerDict(
    players: ProcessedPlayer[]
  ): Record<number, ProcessedPlayer> {
    const playerDict: Record<number, ProcessedPlayer> = {};

    for (const player of players) {
      playerDict[player.generalInfo.id] = player;
    }

    return playerDict;
  }

  /**
   * Calculate the average FDR for a team over all remaining game weeks starting from the next game week.
   *
   * @param teamId - the ID of the team.
   * @param fdrDict - a dictionary containing FDR values for each team by game week.
   * @param nextGw - the next game week number.
   * @param fdrCalculator - the FDR calculator service.
   *
   * @returns the average FDR for the team over the remaining game weeks.
   */
  private calculateRemainingFDR(
    teamId: number,
    fdrDict: FDRDict,
    nextGw: number,
    fdrCalculator: FDRCalculator
  ): number {
    const maxGw = Math.max(...Object.keys(fdrDict).map(Number));
    const remainingGws = maxGw - nextGw + 1;
    return fdrCalculator.calculateTeamFDR(
      teamId,
      fdrDict,
      nextGw,
      remainingGws
    );
  }

  /**
   * Calculate the total number of remaining games for a team over all remaining game weeks starting from the next game week.
   *
   * @param teamId - the ID of the team.
   * @param fdrDict - a dictionary containing FDR values for each team by game week.
   * @param nextGw - the next game week number.
   * @param fdrCalculator - the FDR calculator service.
   *
   * @returns the total number of remaining games for the team over the remaining game weeks.
   */
  private calculateAllRemainingGames(
    teamId: number,
    fdrDict: FDRDict,
    nextGw: number,
    fdrCalculator: FDRCalculator
  ): number {
    const maxGw = Math.max(...Object.keys(fdrDict).map(Number));
    const remainingGws = maxGw - nextGw + 1;
    return fdrCalculator.calculateRemainingGames(
      teamId,
      fdrDict,
      nextGw,
      remainingGws
    );
  }
}
