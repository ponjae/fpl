import {
  ProcessedData,
  GameweekData,
  FixturesByGameweek,
  ReadableFixture,
  Fixture,
  Event,
  RawTeam,
  ElementType,
} from '@fpl/contracts/fpl';
import { ApplicationService } from '../../app';
import { TEAM_DATA_DICT } from '../../config/teams';
import { DataProcessor } from './DataProcessor';
import { DataService } from './DataService';
import { FDRCalculator } from './FDRCalculator';
import { PlayerEvaluator } from './PlayerEvaluator';

export class FPLDataService extends ApplicationService {
  private cachedData: ProcessedData | null = null;
  private lastFetchTime: number | null = null;
  private cacheDuration: number = 60 * 60 * 1000; // 1 hour

  /**
   * Get complete processed data (from cache or fetch).
   */
  public async getData(): Promise<ProcessedData> {
    if (this.shouldRefresh()) {
      await this.refresh();
    }
    return this.cachedData!;
  }

  /**
   * Force refresh from FPL API.
   */
  public async refresh(): Promise<void> {
    // Instantiate services (no constructor dependencies)
    const dataService = new DataService();
    const fdrCalculator = new FDRCalculator();
    const dataProcessor = new DataProcessor();
    const playerEvaluator = new PlayerEvaluator();

    // 1. Fetch raw data and fixtures
    const { allData, fixtures } = await dataService.getData();

    // 2. Calculate FDR dict
    const fdrDict = fdrCalculator.calculateFDRDict(fixtures);

    // 3. Find current gameweek
    const currentGameweek = this.getCurrentGameweek(allData.events);

    // 4. Process all players (passing services as parameters)
    const processedPlayers = allData.elements.map((rawPlayer) =>
      dataProcessor.processPlayer(
        rawPlayer,
        fdrDict,
        currentGameweek,
        fdrCalculator,
        playerEvaluator
      )
    );

    // 5. Group players by team/position/id
    const byTeam = dataProcessor.groupByTeam(processedPlayers, allData.teams);
    const byPosition = dataProcessor.groupByPosition(
      processedPlayers,
      allData.element_types
    );
    const byId = dataProcessor.createPlayerDict(processedPlayers);

    // 6. Extract gameweek data
    const gameweeks = this.extractGameweekData(allData.events);

    // 7. Process fixtures into structured format
    const fixturesByGameweek = this.organizeFixturesByGameweek(fixtures);
    const readableFixtures = this.createReadableFixtures(
      fixturesByGameweek,
      allData.teams
    );

    // 9. Create id→name mappings
    const idTeamDict = this.createIdTeamDict(allData.teams);
    const idPositionDict = this.createIdPositionDict(allData.element_types);

    // 10. Store in cache
    this.cachedData = {
      players: {
        byTeam,
        byPosition,
        byId,
      },
      gameweeks,
      fixtures: fixturesByGameweek,
      readableFixtures,
      teamData: TEAM_DATA_DICT,
      idTeamDict,
      idPositionDict,
      currentGameweek,
      lastUpdated: new Date(),
    };

    this.lastFetchTime = Date.now();
  }

  /**
   * Check if cache should be refreshed.
   */
  private shouldRefresh(): boolean {
    return (
      !this.cachedData ||
      !this.lastFetchTime ||
      Date.now() - this.lastFetchTime > this.cacheDuration
    );
  }

  /**
   * Find the current gameweek based on events data.
   *
   * @param events - the list of gameweek events from FPL API.
   *
   * @returns the ID of the current gameweek.
   */
  private getCurrentGameweek(events: Event[]): number {
    // Find the first unfinished gameweek, or the last one if all are finished
    const currentEvent = events.find(({ finished }) => !finished);
    return currentEvent ? currentEvent.id : events[events.length - 1]?.id || 1;
  }

  /**
   * Extract gameweek data into a dictionary for easy access.
   *
   * @param events - the list of gameweek events from FPL API.
   *
   * @returns a dictionary of gameweek data keyed by gameweek ID.
   */
  private extractGameweekData(events: Event[]): GameweekData {
    const gameweeks: GameweekData = {};

    for (const {
      id,
      average_entry_score,
      finished,
      highest_score,
      top_element_info,
      most_captained,
      chip_plays,
    } of events) {
      gameweeks[id] = {
        id,
        average_entry_score,
        finished,
        highest_score,
        top_element_info,
        most_captained,
        chip_plays,
      };
    }

    return gameweeks;
  }

  /**
   * Organize fixtures by gameweek for easier access.
   *
   * @param fixtures - the list of fixtures from FPL API.
   *
   * @returns a dictionary of fixtures keyed by gameweek ID.
   */
  private organizeFixturesByGameweek(fixtures: Fixture[]): FixturesByGameweek {
    const fixturesByGw: FixturesByGameweek = {};

    for (const {
      event,
      team_h,
      team_a,
      team_h_score,
      team_a_score,
    } of fixtures) {
      const gw = event;
      if (!gw) {
        continue;
      }

      if (!fixturesByGw[gw]) {
        fixturesByGw[gw] = [];
      }

      fixturesByGw[gw].push({
        finished: team_h_score !== null,
        home_team: team_h,
        away_team: team_a,
        home_score: team_h_score,
        away_score: team_a_score,
        gw,
      });
    }

    return fixturesByGw;
  }

  /**
   * Create human-readable fixtures with team names.
   *
   * @param fixturesByGw - the dictionary of fixtures keyed by gameweek ID.
   * @param teams - the list of teams from FPL API.
   *
   * @returns a dictionary of human-readable fixtures keyed by gameweek ID.
   */
  private createReadableFixtures(
    fixturesByGw: FixturesByGameweek,
    teams: RawTeam[]
  ): ReadableFixture {
    const teamIdToName = new Map(teams.map(({ id, name }) => [id, name]));
    const readableFixtures: ReadableFixture = {};

    for (const [gw, fixtures] of Object.entries(fixturesByGw)) {
      readableFixtures[Number(gw)] = fixtures.map(
        ({ finished, home_team, away_team, home_score, away_score, gw }) => ({
          finished,
          home_team: teamIdToName.get(home_team) || '',
          away_team: teamIdToName.get(away_team) || '',
          home_score,
          away_score,
          gw,
        })
      );
    }

    return readableFixtures;
  }

  /**
   * Create ID to team name mapping.
   *
   * @param teams - the list of teams from FPL API.
   *
   * @returns a dictionary mapping team IDs to team names.
   */
  private createIdTeamDict(teams: RawTeam[]): Record<number, string> {
    const dict: Record<number, string> = {};
    for (const { id, name } of teams) {
      dict[id] = name;
    }
    return dict;
  }

  /**
   * Create ID to position name mapping.
   *
   * @param elementTypes - the list of element types from FPL API.
   *
   * @returns a dictionary mapping position IDs to position names.
   */
  private createIdPositionDict(
    elementTypes: ElementType[]
  ): Record<number, string> {
    const dict: Record<number, string> = {};
    for (const { id, singular_name } of elementTypes) {
      dict[id] = singular_name;
    }
    return dict;
  }
}
