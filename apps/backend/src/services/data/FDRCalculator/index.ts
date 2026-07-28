import { Fixture, FDRDict } from '@fpl/contracts/fpl';
import { ApplicationService } from '../../../app';

export class FDRCalculator extends ApplicationService {
  /**
   * Create the FDR dictionary from the list of fixtures.
   *
   * @param fixtures - the fixtures to calculate the FDR dictionary from.
   *
   * @returns - the FDR dictionary.
   */
  public calculateFDRDict(fixtures: Fixture[]): FDRDict {
    const fdrDict: FDRDict = {};

    const addTeamDifficulty = (
      event: number,
      teamId: number,
      difficulty: number
    ) => {
      fdrDict[event] ??= {};
      fdrDict[event][teamId] ??= [];
      fdrDict[event][teamId].push(difficulty);
    };

    for (const fixture of fixtures) {
      const { event, team_h, team_a, team_h_difficulty, team_a_difficulty } =
        fixture;
      addTeamDifficulty(event, team_h, team_h_difficulty);
      addTeamDifficulty(event, team_a, team_a_difficulty);
    }

    return fdrDict;
  }

  /**
   * Calculate the sum of FDR values for a team over a given number of game weeks starting from a given game week.
   *
   * Returns the raw sum (not average) across all actual fixtures in the window.
   * For example, a double gameweek contributes two difficulties to the sum.
   * When there are no fixtures in the window, returns 0.
   *
   * @param teamId - the ID of the team to calculate the FDR for.
   * @param fdrDict - the FDR dictionary to use for the calculation.
   * @param startGw - the game week to start the calculation from.
   * @param gameWeeks - the number of game weeks to calculate the FDR for.
   *
   * @returns - the sum of FDR difficulties for the team over the specified game weeks.
   */
  public calculateTeamFDR(
    teamId: number,
    fdrDict: FDRDict,
    startGw: number,
    gameWeeks: number
  ): number {
    let totalDifficulty = 0;

    for (let gw = startGw; gw < startGw + gameWeeks; gw++) {
      const teamDifficulties = fdrDict[gw]?.[teamId] ?? [];
      totalDifficulty += teamDifficulties.reduce((a, b) => a + b, 0);
    }

    return totalDifficulty;
  }

  /**
   * Calculate the total number of remaining games for a team over a given number of game weeks starting from a given game week.
   *
   * @param teamId - the ID of the team to calculate the remaining games for.
   * @param fdrDict - the FDR dictionary to use for the calculation.
   * @param startGw - the game week to start the calculation from.
   * @param gameWeeks - the number of game weeks to calculate the remaining games for.
   *
   * @returns - the total number of remaining games for the team over the specified game weeks.
   */
  public calculateRemainingGames(
    teamId: number,
    fdrDict: FDRDict,
    startGw: number,
    gameWeeks?: number
  ): number {
    let remainingGames = 0;
    const maxGw = gameWeeks
      ? startGw + gameWeeks - 1
      : Math.max(...Object.keys(fdrDict).map(Number));

    for (let gw = startGw; gw <= maxGw; gw++) {
      const teamDifficulties = fdrDict[gw]?.[teamId] ?? [];
      remainingGames += teamDifficulties.length;
    }

    return remainingGames;
  }
}
