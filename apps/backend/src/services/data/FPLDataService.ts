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

/**
 * Module-level cache store for processed FPL data.
 *
 * Rationale: FPLDataService instances are managed by ApplicationContext's pool
 * (up to MAX_POOLSIZE = 10). If each instance held its own cache, concurrent
 * requests could be served by different instances, each with its own
 * lastFetchTime, meaning POST /data/refresh only invalidates one of up to ten
 * independent caches. By storing the cache at module scope, all pooled
 * instances share one authoritative cache and one refresh invalidates it for
 * every subsequent request.
 *
 * DataService has the same pooling issue for its raw-data layer, so its cache
 * is also stored here (see RawDataCache in DataService).
 */
type ProcessedCache = {
  data: ProcessedData;
  lastFetchTime: number;
};

let processedCache: ProcessedCache | null = null;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

export class FPLDataService extends ApplicationService {
  /**
   * Get complete processed data (from module-level cache or fetch).
   *
   * All pooled instances of FPLDataService read and write the same module-level
   * cache, so every request sees consistent data regardless of which pool
   * instance handles it.
   */
  public async getData(): Promise<ProcessedData> {
    if (this.shouldRefresh()) {
      await this.refresh();
    }
    return processedCache!.data;
  }

  /**
   * Force refresh from FPL API.
   *
   * Writes to the shared module-level cache so the next call to getData() from
   * any pooled instance (or from a subsequent request) sees the updated data.
   */
  public async refresh(): Promise<void> {
    // Obtain a DataService instance from the shared raw-data layer.
    // DataService.getSharedData() uses its own module-level cache so we never
    // bypass the context pool or call _init from application code.
    const rawData = await DataService.getSharedData(this.getContext());

    // Instantiate pure-data-transform services (no context needed)
    const fdrCalculator = new FDRCalculator();
    const dataProcessor = new DataProcessor();
    const playerEvaluator = new PlayerEvaluator();

    const { allData, fixtures } = rawData;

    // 2. Calculate FDR dict
    const fdrDict = fdrCalculator.calculateFDRDict(fixtures);

    // 3. Find current gameweek and season progress
    const currentGameweek = this.getCurrentGameweek(allData.events);
    const gameweeksLapsed = this.getGameweeksLapsed(allData.events);

    // 4. Process all players (passing services as parameters)
    const processedPlayers = allData.elements.map((rawPlayer) =>
      dataProcessor.processPlayer(
        rawPlayer,
        fdrDict,
        currentGameweek,
        gameweeksLapsed,
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

    // 8. Create id→name mappings
    const idTeamDict = this.createIdTeamDict(allData.teams);
    const idPositionDict = this.createIdPositionDict(allData.element_types);

    // 9. Write to shared module-level cache
    processedCache = {
      data: {
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
      },
      lastFetchTime: Date.now(),
    };
  }

  /**
   * Invalidate the module-level processed cache.
   *
   * Exposed for testing; also called implicitly by refresh().
   * After invalidation, the next getData() call triggers a full re-fetch.
   */
  public static invalidateCache(): void {
    processedCache = null;
  }

  /**
   * Check if the module-level cache should be refreshed.
   */
  private shouldRefresh(): boolean {
    return (
      !processedCache ||
      Date.now() - processedCache.lastFetchTime > CACHE_DURATION_MS
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
   * Determine how many gameweeks have actually been played this season.
   *
   * This is the divisor for `historyValue` (totalPoints / gameweeksLapsed), so
   * it must reflect real scoring opportunities rather than calendar position.
   *
   * Preseason case: before any gameweek has finished, the FPL API has not yet
   * reset `total_points`, so it still holds the *previous* season's totals. If
   * we divided those by 1 we would report a whole season's points as a single
   * gameweek's rate — inflating every player by roughly 38x. Falling back to
   * the full season length yields a per-gameweek rate consistent with the
   * API's own `points_per_game`.
   *
   * @param events - the list of gameweek events from FPL API.
   *
   * @returns the number of finished gameweeks, or the season length in preseason.
   */
  private getGameweeksLapsed(events: Event[]): number {
    const finished = events.filter(({ finished }) => finished).length;
    return finished > 0 ? finished : events.length || 38;
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
   * Uses the API's own `finished` flag (a match is fully concluded, including
   * bonus-point processing) rather than inferring completion from score nullability.
   * `finished_provisional` becomes true slightly before `finished` (scores confirmed
   * but bonus points may still shift), so `finished` is the correct field to use here.
   *
   * @param fixtures - the list of fixtures from FPL API.
   *
   * @returns a dictionary of fixtures keyed by gameweek ID.
   */
  private organizeFixturesByGameweek(fixtures: Fixture[]): FixturesByGameweek {
    const fixturesByGw: FixturesByGameweek = {};

    for (const {
      event,
      finished,
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
        finished,
        home_team: team_h,
        away_team: team_a,
        home_score: team_h_score ?? undefined,
        away_score: team_a_score ?? undefined,
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
