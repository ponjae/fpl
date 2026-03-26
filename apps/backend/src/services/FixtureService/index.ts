import { ProcessedData, FixtureEntry } from '@fpl/contracts/fpl';
import { ApplicationService } from '../../app';

export class FixtureService extends ApplicationService {
  /**
   * Get all fixtures across all gameweeks.
   *
   * @param data - the processed FPL data.
   */
  public getAllFixtures(data: ProcessedData): FixtureEntry[] {
    const allFixtures: FixtureEntry[] = [];

    for (const gw in data.fixtures) {
      allFixtures.push(...data.fixtures[gw]);
    }

    return allFixtures;
  }

  /**
   * Get fixtures for a specific gameweek.
   *
   * @param data - the processed FPL data.
   * @param gameweek - the gameweek number.
   */
  public getFixturesByGameweek(
    data: ProcessedData,
    gameweek: number
  ): FixtureEntry[] {
    return data.fixtures[gameweek] || [];
  }

  /**
   * Get upcoming fixtures for a team.
   *
   * @param data - the processed FPL data.
   * @param teamId - the team ID.
   * @param count - the number of fixtures to return.
   */
  public getUpcomingFixtures(
    data: ProcessedData,
    teamId: number,
    count = 5
  ): FixtureEntry[] {
    const upcomingFixtures: FixtureEntry[] = [];
    const currentGameweek = data.currentGameweek;

    // Start from current gameweek and collect unfinished fixtures
    for (
      let gw = currentGameweek;
      gw <= 38 && upcomingFixtures.length < count;
      gw++
    ) {
      const gameweekFixtures = data.fixtures[gw] || [];

      for (const fixture of gameweekFixtures) {
        if (
          !fixture.finished &&
          (fixture.home_team === teamId || fixture.away_team === teamId)
        ) {
          upcomingFixtures.push(fixture);

          if (upcomingFixtures.length >= count) {
            break;
          }
        }
      }
    }

    return upcomingFixtures;
  }
}
