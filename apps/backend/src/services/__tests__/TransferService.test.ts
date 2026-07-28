/**
 * Unit tests for TransferService.
 *
 * Covers:
 * - Suggestions match position, availability and affordability
 * - Ranking by value gain, and the limit
 * - Null-valued and unavailable candidates excluded
 * - Unknown player returns no suggestions
 * - Under-performer ranking, ordering and handling of unranked players
 */
import { ProcessedData, ProcessedPlayer } from '@fpl/contracts/fpl';
import { describe, it, expect } from 'vitest';
import { TransferService } from '../TransferService';

const makePlayer = (
  id: number,
  element_type: number,
  now_cost: number,
  value: number | null,
  status = 'a',
  team = 1
): ProcessedPlayer => ({
  generalInfo: {
    id,
    element_type,
    first_name: `Player${id}`,
    web_name: `P${id}`,
    now_cost,
    status,
    team,
  },
  playerStats: {
    form: 0,
    total_points: 0,
    goals_scored: 0,
    assists: 0,
    saves: 0,
    penalties_saved: 0,
    penalties_missed: 0,
    bonus: 0,
    clean_sheets: 0,
    transfers_in: 0,
    transfers_out: 0,
    minutes: 0,
    points_per_game: 0,
    points_per_million: 0,
    selected_by_percent: 0,
  },
  playerValue: { value, value5: value, value_remaining: value },
  fixtureData: { fdr1: 3, fdr5: 15, fdr_remaining: 60 },
  games: { games_next_gw: 1, games_next_five: 5, total_games_remaining: 20 },
});

const toData = (players: ProcessedPlayer[]): ProcessedData =>
  ({
    players: {
      byId: Object.fromEntries(players.map((p) => [p.generalInfo.id, p])),
      byTeam: {},
      byPosition: {
        Goalkeepers: [],
        Defenders: [],
        Midfielders: [],
        Forwards: [],
      },
    },
    gameweeks: {},
    fixtures: {},
    readableFixtures: {},
    teamData: {},
    idTeamDict: {},
    idPositionDict: {},
    currentGameweek: 10,
    lastUpdated: new Date(),
  } as unknown as ProcessedData);

const svc = () => new TransferService();

describe('TransferService', () => {
  describe('suggestTransfers', () => {
    const pool = () => [
      makePlayer(1, 3, 8.0, 10), // player out — midfielder, 8.0m
      makePlayer(2, 3, 8.0, 20), // same price, better
      makePlayer(3, 3, 9.0, 30), // affordable only with budget
      makePlayer(4, 3, 12.0, 99), // too expensive
      makePlayer(5, 2, 8.0, 50), // wrong position
      makePlayer(6, 3, 7.0, 15), // cheaper, better
      makePlayer(7, 3, 8.0, 40, 'i'), // injured
      makePlayer(8, 3, 8.0, null), // no fixtures
    ];

    it('should only suggest players in the same position', () => {
      const out = svc().suggestTransfers(toData(pool()), { playerOutId: 1 });
      out.forEach((s) =>
        expect(s.playerIn.generalInfo.element_type).toBe(3)
      );
    });

    it('should never suggest the outgoing player', () => {
      const out = svc().suggestTransfers(toData(pool()), { playerOutId: 1 });
      expect(out.map((s) => s.playerIn.generalInfo.id)).not.toContain(1);
    });

    it('should exclude players beyond the affordable budget', () => {
      const out = svc().suggestTransfers(toData(pool()), { playerOutId: 1 });
      expect(out.map((s) => s.playerIn.generalInfo.id)).not.toContain(4);
    });

    it('should include a pricier player once budget allows it', () => {
      const withBudget = svc().suggestTransfers(toData(pool()), {
        playerOutId: 1,
        budget: 5,
      });
      expect(withBudget.map((s) => s.playerIn.generalInfo.id)).toContain(4);
    });

    it('should exclude unavailable players', () => {
      const out = svc().suggestTransfers(toData(pool()), { playerOutId: 1 });
      expect(out.map((s) => s.playerIn.generalInfo.id)).not.toContain(7);
    });

    it('should exclude players with a null value', () => {
      const out = svc().suggestTransfers(toData(pool()), { playerOutId: 1 });
      expect(out.map((s) => s.playerIn.generalInfo.id)).not.toContain(8);
    });

    it('should rank by value gain, best first', () => {
      const out = svc().suggestTransfers(toData(pool()), { playerOutId: 1 });
      const gains = out.map((s) => s.valueGain);
      expect(gains).toEqual([...gains].sort((a, b) => b - a));
    });

    it('should compute value gain relative to the outgoing player', () => {
      const out = svc().suggestTransfers(toData(pool()), { playerOutId: 1 });
      const best = out[0];
      expect(best.valueGain).toBe(
        (best.playerIn.playerValue.value5 as number) - 10
      );
    });

    it('should compute the cost delta', () => {
      const out = svc().suggestTransfers(toData(pool()), { playerOutId: 1 });
      const cheaper = out.find((s) => s.playerIn.generalInfo.id === 6);
      expect(cheaper?.costDelta).toBe(-1);
    });

    it('should respect the limit', () => {
      const out = svc().suggestTransfers(toData(pool()), {
        playerOutId: 1,
        limit: 2,
      });
      expect(out).toHaveLength(2);
    });

    it('should return an empty list for an unknown player', () => {
      const out = svc().suggestTransfers(toData(pool()), {
        playerOutId: 9999,
      });
      expect(out).toEqual([]);
    });
  });

  describe('findUnderPerformers', () => {
    const pool = () => [
      makePlayer(1, 3, 8.0, 100), // best midfielder
      makePlayer(2, 3, 8.0, 50),
      makePlayer(3, 3, 8.0, 10), // worst midfielder
      makePlayer(4, 2, 6.0, 80), // best defender
      makePlayer(5, 2, 6.0, 20),
    ];

    it('should rank a player against others in the same position', () => {
      const out = svc().findUnderPerformers(toData(pool()), [1]);
      expect(out[0].positionRank).toBe(1);
      expect(out[0].positionCount).toBe(3);
    });

    it('should return the worst performer first', () => {
      const out = svc().findUnderPerformers(toData(pool()), [1, 2, 3]);
      expect(out.map((u) => u.player.generalInfo.id)).toEqual([3, 2, 1]);
    });

    it('should rank each position independently', () => {
      const out = svc().findUnderPerformers(toData(pool()), [4]);
      expect(out[0].positionRank).toBe(1);
      expect(out[0].positionCount).toBe(2);
    });

    it('should expose the value used for ranking', () => {
      const out = svc().findUnderPerformers(toData(pool()), [2]);
      expect(out[0].value).toBe(50);
    });

    it('should ignore unknown player IDs', () => {
      const out = svc().findUnderPerformers(toData(pool()), [1, 9999]);
      expect(out).toHaveLength(1);
    });

    it('should place unranked players last', () => {
      const players = pool();
      players.push(makePlayer(6, 3, 5.0, null));

      const out = svc().findUnderPerformers(toData(players), [1, 6]);
      expect(out[0].player.generalInfo.id).toBe(6);
      expect(out[0].value).toBeNull();
    });

    it('should return an empty list for an empty squad', () => {
      expect(svc().findUnderPerformers(toData(pool()), [])).toEqual([]);
    });
  });
});
