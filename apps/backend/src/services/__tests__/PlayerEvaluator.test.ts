/**
 * Unit tests for PlayerEvaluator.
 *
 * Regression coverage for the preseason scaling bug: `gameweeksLapsed` is the
 * divisor for historyValue, so passing a too-small value inflates every player
 * by roughly a full season. See FPLDataService.getGameweeksLapsed.
 */
import { ProcessedPlayer } from '@fpl/contracts/fpl';
import { describe, it, expect } from 'vitest';
import { PlayerEvaluator } from '../data/PlayerEvaluator';

const makePlayer = (overrides: {
  form?: number;
  total_points?: number;
  element_type?: number;
  fdr1?: number;
  fdr5?: number;
  fdr_remaining?: number;
  games_next_gw?: number;
  games_next_five?: number;
  total_games_remaining?: number;
}): ProcessedPlayer =>
  ({
    generalInfo: {
      id: 1,
      element_type: overrides.element_type ?? 3,
      first_name: 'Test',
      web_name: 'Test',
      now_cost: 10,
      status: 'a',
      team: 1,
    },
    playerStats: {
      form: overrides.form ?? 0,
      total_points: overrides.total_points ?? 0,
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
    playerValue: { value: null, value5: null, value_remaining: null },
    fixtureData: {
      fdr1: overrides.fdr1 ?? 3,
      fdr5: overrides.fdr5 ?? 15,
      fdr_remaining: overrides.fdr_remaining ?? 60,
    },
    games: {
      games_next_gw: overrides.games_next_gw ?? 1,
      games_next_five: overrides.games_next_five ?? 5,
      total_games_remaining: overrides.total_games_remaining ?? 20,
    },
  } as ProcessedPlayer);

const svc = () => new PlayerEvaluator();

describe('PlayerEvaluator', () => {
  describe('historyValue scaling', () => {
    it('should divide total points by gameweeks lapsed', () => {
      // form = 0 removes the form term, isolating historyValue.
      const player = makePlayer({ total_points: 380, form: 0 });
      const result = svc().calculatePlayerValue(player, 38);
      expect(result.value).toBeCloseTo(10, 6);
    });

    it('should not inflate values when a full season has lapsed', () => {
      const player = makePlayer({ total_points: 239, form: 0 });
      const result = svc().calculatePlayerValue(player, 38);
      // Should approximate FPL's own points_per_game, not the raw season total.
      expect(result.value).toBeCloseTo(6.29, 1);
      expect(result.value).not.toBe(239);
    });

    it('should scale linearly as the season progresses', () => {
      const player = makePlayer({ total_points: 100, form: 0 });
      const early = svc().calculatePlayerValue(player, 10);
      const late = svc().calculatePlayerValue(player, 20);
      expect(early.value).toBeCloseTo(10, 6);
      expect(late.value).toBeCloseTo(5, 6);
    });

    it('should clamp gameweeksLapsed to at least 1', () => {
      const player = makePlayer({ total_points: 50, form: 0 });
      expect(svc().calculatePlayerValue(player, 0).value).toBeCloseTo(50, 6);
      expect(svc().calculatePlayerValue(player, -5).value).toBeCloseTo(50, 6);
    });
  });

  describe('horizons', () => {
    it('should return identical horizons when form is zero', () => {
      // Preseason: form resets to 0, so only the horizon-independent
      // historyValue survives. Identical columns are expected, not a bug.
      const player = makePlayer({ total_points: 190, form: 0 });
      const r = svc().calculatePlayerValue(player, 38);
      expect(r.value).toBe(r.value5);
      expect(r.value5).toBe(r.value_remaining);
    });

    it('should differentiate horizons once form is non-zero', () => {
      const player = makePlayer({
        total_points: 100,
        form: 5,
        fdr1: 2,
        fdr5: 20,
      });
      const r = svc().calculatePlayerValue(player, 10);
      expect(r.value).not.toBe(r.value5);
    });

    it('should reward easier fixtures with a higher value', () => {
      const easy = makePlayer({ total_points: 100, form: 5, fdr5: 10 });
      const hard = makePlayer({ total_points: 100, form: 5, fdr5: 25 });
      const e = svc().calculatePlayerValue(easy, 10);
      const h = svc().calculatePlayerValue(hard, 10);
      expect(e.value5 as number).toBeGreaterThan(h.value5 as number);
    });
  });

  describe('no fixtures', () => {
    it('should return null rather than a negative sentinel', () => {
      const player = makePlayer({
        total_points: 100,
        form: 5,
        games_next_gw: 0,
      });
      expect(svc().calculatePlayerValue(player, 10).value).toBeNull();
    });

    it('should return null independently per horizon', () => {
      const player = makePlayer({
        total_points: 100,
        form: 5,
        games_next_gw: 0,
        games_next_five: 3,
      });
      const r = svc().calculatePlayerValue(player, 10);
      expect(r.value).toBeNull();
      expect(r.value5).not.toBeNull();
    });
  });

  describe('gameweek congestion multiplier', () => {
    it('should double the value for a double gameweek', () => {
      const single = makePlayer({ total_points: 100, form: 0, games_next_gw: 1 });
      const double = makePlayer({ total_points: 100, form: 0, games_next_gw: 2 });
      const s = svc().calculatePlayerValue(single, 10).value as number;
      const d = svc().calculatePlayerValue(double, 10).value as number;
      expect(d).toBeCloseTo(s * 2, 6);
    });

    it('should halve the value for a blank-adjacent shortfall', () => {
      const normal = makePlayer({
        total_points: 100,
        form: 0,
        games_next_five: 5,
      });
      const short = makePlayer({
        total_points: 100,
        form: 0,
        games_next_five: 4,
      });
      const n = svc().calculatePlayerValue(normal, 10).value5 as number;
      const sh = svc().calculatePlayerValue(short, 10).value5 as number;
      expect(sh).toBeCloseTo(n * 0.5, 6);
    });
  });

  describe('division safety', () => {
    it('should not divide by zero when FDR is zero', () => {
      const player = makePlayer({ total_points: 100, form: 5, fdr1: 0 });
      const result = svc().calculatePlayerValue(player, 10);
      expect(Number.isFinite(result.value as number)).toBe(true);
    });
  });
});
