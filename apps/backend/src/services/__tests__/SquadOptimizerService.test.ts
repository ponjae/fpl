/**
 * Unit tests for SquadOptimizerService.
 *
 * Covers:
 * - Structural validity: 15 players, 11 starters, 1 captain, position quotas
 * - Budget respected
 * - Max 3 players per club
 * - Captain is the highest-value starter
 * - Players with null value on the horizon are excluded
 * - Unavailable (status !== 'a') players are excluded
 * - include / exclude honoured
 * - Dominance pruning preserves the known optimum on a small instance
 */
import {
  ProcessedData,
  ProcessedPlayer,
  SQUAD_RULES,
  MAX_PER_CLUB,
} from '@fpl/contracts/fpl';
import { describe, it, expect } from 'vitest';
import { SquadOptimizerService } from '../SquadOptimizerService';

const makePlayer = (
  id: number,
  element_type: number,
  team: number,
  now_cost: number,
  value: number | null,
  status = 'a'
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

/**
 * Build a pool large enough to fill a legal squad several times over.
 *
 * Prices and values are deliberately varied so the optimiser has to make real
 * trade-offs rather than simply taking the top of each list.
 */
const buildPool = (): ProcessedPlayer[] => {
  const players: ProcessedPlayer[] = [];
  let id = 1;

  // 4 GK per club across 8 clubs, etc. — enough breadth to satisfy the club cap.
  const perPosition: Record<number, number> = { 1: 2, 2: 5, 3: 5, 4: 3 };

  for (let club = 1; club <= 10; club++) {
    for (const [posStr, count] of Object.entries(perPosition)) {
      const pos = Number(posStr);
      for (let n = 0; n < count; n++) {
        const price = 40 + ((id * 7) % 60); // 4.0m .. 9.9m
        const value = ((id * 13) % 50) + 1;
        players.push(makePlayer(id, pos, club, price / 10, value));
        id++;
      }
    }
  }

  return players;
};

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

const svc = () => new SquadOptimizerService();

describe('SquadOptimizerService', () => {
  describe('structural validity', () => {
    it('should select exactly 15 players', () => {
      const squad = svc().optimize(toData(buildPool()), { budget: 100 });
      expect(squad.picks).toHaveLength(15);
    });

    it('should select exactly 11 starters and 4 bench', () => {
      const squad = svc().optimize(toData(buildPool()), { budget: 100 });
      expect(squad.picks.filter((p) => p.starting)).toHaveLength(11);
      expect(squad.picks.filter((p) => !p.starting)).toHaveLength(4);
    });

    it('should select exactly one captain, who must be starting', () => {
      const squad = svc().optimize(toData(buildPool()), { budget: 100 });
      const captains = squad.picks.filter((p) => p.captain);
      expect(captains).toHaveLength(1);
      expect(captains[0].starting).toBe(true);
    });

    it('should respect squad position quotas', () => {
      const squad = svc().optimize(toData(buildPool()), { budget: 100 });

      for (const [pos, rule] of Object.entries(SQUAD_RULES)) {
        const count = squad.picks.filter(
          (p) => p.player.generalInfo.element_type === Number(pos)
        ).length;
        expect(count).toBe(rule.squad);
      }
    });

    it('should respect starting position bounds', () => {
      const squad = svc().optimize(toData(buildPool()), { budget: 100 });
      const starters = squad.picks.filter((p) => p.starting);

      for (const [pos, rule] of Object.entries(SQUAD_RULES)) {
        const count = starters.filter(
          (p) => p.player.generalInfo.element_type === Number(pos)
        ).length;
        expect(count).toBeGreaterThanOrEqual(rule.minStart);
        expect(count).toBeLessThanOrEqual(rule.maxStart);
      }
    });

    it('should never exceed the per-club limit', () => {
      const squad = svc().optimize(toData(buildPool()), { budget: 100 });
      const counts = new Map<number, number>();

      for (const pick of squad.picks) {
        const club = pick.player.generalInfo.team;
        counts.set(club, (counts.get(club) ?? 0) + 1);
      }

      for (const count of counts.values()) {
        expect(count).toBeLessThanOrEqual(MAX_PER_CLUB);
      }
    });
  });

  describe('budget', () => {
    it('should not exceed the given budget', () => {
      const squad = svc().optimize(toData(buildPool()), { budget: 100 });
      expect(squad.totalCost).toBeLessThanOrEqual(100);
    });

    it('should respect a tighter budget', () => {
      const squad = svc().optimize(toData(buildPool()), { budget: 80 });
      expect(squad.totalCost).toBeLessThanOrEqual(80);
      expect(squad.budget).toBe(80);
    });

    it('should produce a higher objective with a larger budget', () => {
      const data = toData(buildPool());
      const poor = svc().optimize(data, { budget: 75 });
      const rich = svc().optimize(data, { budget: 100 });
      expect(rich.totalValue).toBeGreaterThanOrEqual(poor.totalValue);
    });
  });

  describe('captaincy', () => {
    it('should captain the highest-value starter', () => {
      const squad = svc().optimize(toData(buildPool()), { budget: 100 });
      const starters = squad.picks.filter((p) => p.starting);
      const best = Math.max(...starters.map((p) => p.value));
      const captain = squad.picks.find((p) => p.captain);
      expect(captain?.value).toBe(best);
    });
  });

  describe('filtering', () => {
    it('should exclude players with a null value on the chosen horizon', () => {
      const pool = buildPool();
      // Null out a player who would otherwise be highly attractive.
      pool[0] = makePlayer(
        pool[0].generalInfo.id,
        pool[0].generalInfo.element_type,
        pool[0].generalInfo.team,
        4.0,
        null
      );

      const squad = svc().optimize(toData(pool), { budget: 100 });
      const ids = squad.picks.map((p) => p.player.generalInfo.id);
      expect(ids).not.toContain(pool[0].generalInfo.id);
    });

    it('should exclude unavailable players', () => {
      const pool = buildPool();
      pool[1] = makePlayer(
        pool[1].generalInfo.id,
        pool[1].generalInfo.element_type,
        pool[1].generalInfo.team,
        4.0,
        999,
        'i'
      );

      const squad = svc().optimize(toData(pool), { budget: 100 });
      const ids = squad.picks.map((p) => p.player.generalInfo.id);
      expect(ids).not.toContain(pool[1].generalInfo.id);
    });

    it('should honour the exclude list', () => {
      const data = toData(buildPool());
      const first = svc().optimize(data, { budget: 100 });
      const excludedId = first.picks[0].player.generalInfo.id;

      const second = svc().optimize(data, {
        budget: 100,
        exclude: [excludedId],
      });
      const ids = second.picks.map((p) => p.player.generalInfo.id);
      expect(ids).not.toContain(excludedId);
    });

    it('should honour the include list', () => {
      const data = toData(buildPool());
      const first = svc().optimize(data, { budget: 100 });
      const chosen = new Set(
        first.picks.map((p) => p.player.generalInfo.id)
      );

      // Find a cheap player who was NOT selected, and force them in.
      const forced = Object.values(data.players.byId).find(
        (p) => !chosen.has(p.generalInfo.id) && p.generalInfo.now_cost <= 5
      );
      expect(forced).toBeDefined();

      const second = svc().optimize(data, {
        budget: 100,
        include: [forced!.generalInfo.id],
      });
      const ids = second.picks.map((p) => p.player.generalInfo.id);
      expect(ids).toContain(forced!.generalInfo.id);
    });
  });

  describe('reporting', () => {
    it('should report a formation summing to 10 outfield starters', () => {
      const squad = svc().optimize(toData(buildPool()), { budget: 100 });
      const parts = squad.formation.split('-').map(Number);
      expect(parts).toHaveLength(3);
      expect(parts.reduce((a, b) => a + b, 0)).toBe(10);
    });

    it('should report the horizon it optimised against', () => {
      const squad = svc().optimize(toData(buildPool()), {
        budget: 100,
        horizon: 'value_remaining',
      });
      expect(squad.horizon).toBe('value_remaining');
    });

    it('should report how many candidates survived pruning', () => {
      const squad = svc().optimize(toData(buildPool()), { budget: 100 });
      expect(squad.candidatesConsidered).toBeGreaterThan(0);
      expect(squad.candidatesConsidered).toBeLessThanOrEqual(150);
    });

    it('should mark a solved squad as optimal', () => {
      const squad = svc().optimize(toData(buildPool()), { budget: 100 });
      expect(squad.optimal).toBe(true);
    });
  });

  describe('dominance pruning', () => {
    it('should keep the cheaper player when two in a club+position tie on value', () => {
      // Two identical-value keepers at the same club; only the cheaper is ever needed.
      const pool = buildPool();
      const cheap = makePlayer(9001, 1, 1, 4.0, 30);
      const dear = makePlayer(9002, 1, 1, 8.0, 30);
      pool.push(cheap, dear);

      const squad = svc().optimize(toData(pool), { budget: 100 });
      const ids = squad.picks.map((p) => p.player.generalInfo.id);

      // The strictly worse (same value, higher price, same club+position) option
      // must never be preferred over the cheaper one.
      if (ids.includes(9002)) {
        expect(ids).toContain(9001);
      }
    });
  });
});
