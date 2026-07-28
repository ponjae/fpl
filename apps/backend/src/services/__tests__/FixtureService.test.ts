/**
 * Unit tests for FixtureService.
 *
 * Covers:
 * - getUpcomingFixtures uses the API finished flag (not score nullability)
 * - getUpcomingFixtures derives max gameweek from data instead of hardcoding 38
 */
import { ProcessedData, FixtureEntry } from '@fpl/contracts/fpl';
import { describe, it, expect } from 'vitest';
import { FixtureService } from '../FixtureService';

// ---------- helpers ----------------------------------------------------------

const makeFixture = (
  gw: number,
  homeTeam: number,
  awayTeam: number,
  finished: boolean
): FixtureEntry => ({
  finished,
  home_team: homeTeam,
  away_team: awayTeam,
  home_score: finished ? 1 : undefined,
  away_score: finished ? 0 : undefined,
  gw,
});

const makeData = (
  currentGameweek: number,
  fixtures: Record<number, FixtureEntry[]>
): ProcessedData =>
  ({
    currentGameweek,
    fixtures,
    players: {
      byTeam: {},
      byPosition: {
        Goalkeepers: [],
        Defenders: [],
        Midfielders: [],
        Forwards: [],
      },
      byId: {},
    },
    gameweeks: {},
    readableFixtures: {},
    teamData: {},
    idTeamDict: {},
    idPositionDict: {},
    lastUpdated: new Date(),
  } as ProcessedData);

// ---------- tests ------------------------------------------------------------

describe('FixtureService', () => {
  const service = new FixtureService();

  describe('getUpcomingFixtures', () => {
    it('uses the API finished flag — a fixture with null scores but finished=false is returned', () => {
      // Matches the scenario where fixture has no score yet but hasn't been
      // marked finished (e.g. postponed or not kicked off). Old code would
      // treat team_h_score === null as finished=false (correct), but this
      // tests that we rely on the boolean, not score presence.
      const data = makeData(1, {
        1: [makeFixture(1, 10, 20, false)], // unfinished, no scores
      });

      const result = service.getUpcomingFixtures(data, 10, 5);
      expect(result).toHaveLength(1);
      expect(result[0].finished).toBe(false);
    });

    it('excludes fixtures whose finished flag is true even when in the current GW', () => {
      const data = makeData(1, {
        1: [
          makeFixture(1, 10, 20, true), // finished — should be excluded
          makeFixture(1, 10, 30, false), // unfinished — should be included
        ],
      });

      const result = service.getUpcomingFixtures(data, 10, 5);
      expect(result).toHaveLength(1);
      expect(result[0].away_team).toBe(30);
    });

    it('derives max gameweek from data — does not stop at 38', () => {
      // A 40-GW season or a future API extension
      const fixtures: Record<number, FixtureEntry[]> = {};
      for (let gw = 1; gw <= 40; gw++) {
        fixtures[gw] = [makeFixture(gw, 10, 20, false)];
      }
      const data = makeData(38, fixtures);

      // With old code (gw <= 38), only GW38 would be searched
      // With new code, GWs 38, 39, 40 are scanned
      const result = service.getUpcomingFixtures(data, 10, 3);
      expect(result).toHaveLength(3);
      expect(result.map((f) => f.gw)).toEqual([38, 39, 40]);
    });

    it('stops at the actual last gameweek in the data (not at 38 when fewer GWs exist)', () => {
      const data = makeData(1, {
        1: [makeFixture(1, 10, 20, false)],
        2: [makeFixture(2, 10, 30, false)],
        // only 2 GWs of data
      });

      const result = service.getUpcomingFixtures(data, 10, 10);
      expect(result).toHaveLength(2);
    });

    it('returns only fixtures for the requested team', () => {
      const data = makeData(1, {
        1: [
          makeFixture(1, 10, 20, false),
          makeFixture(1, 11, 12, false), // different teams
        ],
        2: [makeFixture(2, 20, 10, false)],
      });

      const result = service.getUpcomingFixtures(data, 10, 5);
      expect(result).toHaveLength(2);
      result.forEach((f) => {
        expect(f.home_team === 10 || f.away_team === 10).toBe(true);
      });
    });

    it('respects the count limit', () => {
      const fixtures: Record<number, FixtureEntry[]> = {};
      for (let gw = 1; gw <= 10; gw++) {
        fixtures[gw] = [makeFixture(gw, 10, gw + 20, false)];
      }
      const data = makeData(1, fixtures);

      const result = service.getUpcomingFixtures(data, 10, 3);
      expect(result).toHaveLength(3);
    });

    it('returns empty array when no upcoming fixtures exist for team', () => {
      const data = makeData(1, {
        1: [makeFixture(1, 11, 12, false)], // different teams
      });

      const result = service.getUpcomingFixtures(data, 10, 5);
      expect(result).toHaveLength(0);
    });
  });
});
