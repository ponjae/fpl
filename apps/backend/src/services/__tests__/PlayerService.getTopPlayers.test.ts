/**
 * Unit tests for PlayerService.getTopPlayers.
 *
 * Covers:
 * - Correct descending / ascending sort on deeply-nested fields
 * - Null-last ordering in descending direction
 * - Null-first ordering in ascending direction
 * - All three PlayerValue fields (value, value5, value_remaining)
 * - Stats fields (form, total_points, goals_scored, etc.)
 * - GeneralInfo fields (now_cost)
 */
import { ProcessedData, ProcessedPlayer } from '@fpl/contracts/fpl';
import { describe, it, expect } from 'vitest';
import { PlayerService } from '../PlayerService';

// ---------- helpers ----------------------------------------------------------

const makePlayer = (
  id: number,
  overrides: {
    form?: number;
    total_points?: number;
    now_cost?: number;
    goals_scored?: number;
    assists?: number;
    saves?: number;
    penalties_saved?: number;
    transfers_in?: number;
    transfers_out?: number;
    minutes?: number;
    points_per_game?: number;
    points_per_million?: number;
    selected_by_percent?: number;
    value?: number | null;
    value5?: number | null;
    value_remaining?: number | null;
  } = {}
): ProcessedPlayer => ({
  generalInfo: {
    id,
    element_type: 1,
    first_name: `Player${id}`,
    web_name: `P${id}`,
    now_cost: overrides.now_cost ?? 50,
    status: 'a',
    team: 1,
  },
  playerStats: {
    form: overrides.form ?? 0,
    total_points: overrides.total_points ?? 0,
    goals_scored: overrides.goals_scored ?? 0,
    assists: overrides.assists ?? 0,
    saves: overrides.saves ?? 0,
    penalties_saved: overrides.penalties_saved ?? 0,
    transfers_in: overrides.transfers_in ?? 0,
    transfers_out: overrides.transfers_out ?? 0,
    minutes: overrides.minutes ?? 0,
    points_per_game: overrides.points_per_game ?? 0,
    points_per_million: overrides.points_per_million ?? 0,
    selected_by_percent: overrides.selected_by_percent ?? 0,
    bonus: 0,
    clean_sheets: 0,
    penalties_missed: 0,
  },
  playerValue: {
    value: overrides.value !== undefined ? overrides.value : null,
    value5: overrides.value5 !== undefined ? overrides.value5 : null,
    value_remaining:
      overrides.value_remaining !== undefined
        ? overrides.value_remaining
        : null,
  },
  fixtureData: {},
  games: {
    games_next_gw: 1,
    games_next_five: 5,
    total_games_remaining: 20,
  },
});

const makeData = (players: ProcessedPlayer[]): ProcessedData => {
  const byId: Record<number, ProcessedPlayer> = {};
  for (const p of players) byId[p.generalInfo.id] = p;
  return {
    players: {
      byTeam: {},
      byPosition: {
        Goalkeepers: [],
        Defenders: [],
        Midfielders: [],
        Forwards: [],
      },
      byId,
    },
    gameweeks: {},
    fixtures: {},
    readableFixtures: {},
    teamData: {},
    idTeamDict: {},
    idPositionDict: {},
    currentGameweek: 1,
    lastUpdated: new Date(),
  };
};

const ids = (players: ProcessedPlayer[]) =>
  players.map((p) => p.generalInfo.id);

// ---------- tests ------------------------------------------------------------

describe('PlayerService.getTopPlayers', () => {
  const service = new PlayerService();

  describe('sorting by stats fields', () => {
    it('sorts by total_points descending by default', async () => {
      const data = makeData([
        makePlayer(1, { total_points: 50 }),
        makePlayer(2, { total_points: 100 }),
        makePlayer(3, { total_points: 75 }),
      ]);
      const result = await service.getTopPlayers(data, 'total_points', 3);
      expect(ids(result)).toEqual([2, 3, 1]);
    });

    it('sorts by total_points ascending', async () => {
      const data = makeData([
        makePlayer(1, { total_points: 50 }),
        makePlayer(2, { total_points: 100 }),
        makePlayer(3, { total_points: 75 }),
      ]);
      const result = await service.getTopPlayers(
        data,
        'total_points',
        3,
        'asc'
      );
      expect(ids(result)).toEqual([1, 3, 2]);
    });

    it('sorts by form descending', async () => {
      const data = makeData([
        makePlayer(1, { form: 2.5 }),
        makePlayer(2, { form: 8.0 }),
        makePlayer(3, { form: 5.5 }),
      ]);
      const result = await service.getTopPlayers(data, 'form', 3);
      expect(ids(result)).toEqual([2, 3, 1]);
    });

    it('sorts by now_cost (generalInfo field) descending', async () => {
      const data = makeData([
        makePlayer(1, { now_cost: 60 }),
        makePlayer(2, { now_cost: 130 }),
        makePlayer(3, { now_cost: 90 }),
      ]);
      const result = await service.getTopPlayers(data, 'now_cost', 3);
      expect(ids(result)).toEqual([2, 3, 1]);
    });

    it('respects the limit parameter', async () => {
      const data = makeData([
        makePlayer(1, { total_points: 10 }),
        makePlayer(2, { total_points: 20 }),
        makePlayer(3, { total_points: 30 }),
        makePlayer(4, { total_points: 40 }),
      ]);
      const result = await service.getTopPlayers(data, 'total_points', 2);
      expect(result).toHaveLength(2);
      expect(ids(result)).toEqual([4, 3]);
    });
  });

  describe('sorting by PlayerValue fields (number | null)', () => {
    it('sorts by value descending, nulls last', async () => {
      const data = makeData([
        makePlayer(1, { value: 10 }),
        makePlayer(2, { value: null }),
        makePlayer(3, { value: 20 }),
        makePlayer(4, { value: null }),
      ]);
      const result = await service.getTopPlayers(data, 'value', 4);
      // Non-null values first (descending), then nulls
      expect(ids(result)).toEqual([3, 1, 2, 4]);
    });

    it('sorts by value ascending, nulls first', async () => {
      const data = makeData([
        makePlayer(1, { value: 10 }),
        makePlayer(2, { value: null }),
        makePlayer(3, { value: 20 }),
        makePlayer(4, { value: null }),
      ]);
      const result = await service.getTopPlayers(data, 'value', 4, 'asc');
      // Nulls first in ascending, then smallest to largest
      expect(ids(result)).toEqual([2, 4, 1, 3]);
    });

    it('sorts by value5 descending, nulls last', async () => {
      const data = makeData([
        makePlayer(1, { value5: null }),
        makePlayer(2, { value5: 15 }),
        makePlayer(3, { value5: 5 }),
      ]);
      const result = await service.getTopPlayers(data, 'value5', 3);
      expect(ids(result)).toEqual([2, 3, 1]);
    });

    it('sorts by value_remaining descending, nulls last', async () => {
      const data = makeData([
        makePlayer(1, { value_remaining: 100 }),
        makePlayer(2, { value_remaining: null }),
        makePlayer(3, { value_remaining: 200 }),
      ]);
      const result = await service.getTopPlayers(data, 'value_remaining', 3);
      expect(ids(result)).toEqual([3, 1, 2]);
    });

    it('all-null values: order is stable (equal nulls return 0)', async () => {
      const data = makeData([
        makePlayer(1, { value: null }),
        makePlayer(2, { value: null }),
        makePlayer(3, { value: null }),
      ]);
      const result = await service.getTopPlayers(data, 'value', 3);
      // All nulls — order is undefined but no crash and correct length
      expect(result).toHaveLength(3);
    });

    it('does not mutate the original byId values', async () => {
      const p1 = makePlayer(1, { total_points: 10 });
      const p2 = makePlayer(2, { total_points: 20 });
      const data = makeData([p1, p2]);
      const originalValues = Object.values(data.players.byId);

      await service.getTopPlayers(data, 'total_points', 2);
      // The order of byId should be unchanged
      expect(Object.values(data.players.byId)).toEqual(originalValues);
    });
  });

  describe('all sortable keys work without throwing', () => {
    const keys = [
      'form',
      'now_cost',
      'points_per_game',
      'selected_by_percent',
      'total_points',
      'transfers_in',
      'transfers_out',
      'minutes',
      'goals_scored',
      'assists',
      'saves',
      'penalties_saved',
      'points_per_million',
      'value',
      'value5',
      'value_remaining',
    ] as const;

    for (const key of keys) {
      it(`sorts by '${key}' without error`, async () => {
        const data = makeData([
          makePlayer(1, {
            [key]:
              key === 'value' || key === 'value5' || key === 'value_remaining'
                ? 10
                : 10,
          }),
          makePlayer(2, { [key]: null as unknown as number }),
        ]);
        await expect(
          service.getTopPlayers(data, key, 2)
        ).resolves.not.toThrow();
      });
    }
  });
});
