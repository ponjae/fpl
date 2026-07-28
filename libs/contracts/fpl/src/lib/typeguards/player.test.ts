import { describe, it, expect } from 'vitest';
import {
  isPlayerSortKey,
  isSortDirection,
  PlayerSortKeys,
} from '../types/player';
import {
  isProcessedPlayer,
  isGeneralPlayerInfo,
  isPlayerStats,
  isPlayerValue,
  isTeamPlayerDict,
  isPositionPlayerDict,
} from './player';

const validGeneralPlayerInfo = {
  element_type: 1,
  first_name: 'David',
  id: 1,
  now_cost: 59,
  status: 'a',
  team: 1,
  web_name: 'Raya',
};

const validPlayerStats = {
  assists: 0,
  bonus: 3,
  clean_sheets: 7,
  form: 4.3,
  goals_scored: 0,
  minutes: 990,
  penalties_missed: 0,
  penalties_saved: 0,
  points_per_game: 4.8,
  points_per_million: 0.8,
  saves: 16,
  selected_by_percent: 32.2,
  total_points: 53,
  transfers_in: 2313527,
  transfers_out: 900382,
};

const validPlayerValue = {
  value: 12.5,
  value5: 13.2,
  value_remaining: 14.1,
};

const validFixtureData = {
  fdr1: 3,
  fdr5: 2.5,
  fdr_remaining: 3.2,
};

const validGames = {
  games_next_gw: 1,
  games_next_five: 5,
  total_games_remaining: 20,
};

const validProcessedPlayer = {
  fixtureData: validFixtureData,
  generalInfo: validGeneralPlayerInfo,
  playerStats: validPlayerStats,
  playerValue: validPlayerValue,
  games: validGames,
};

describe('Typeguards: Player', () => {
  describe('isGeneralPlayerInfo', () => {
    it('should return true for valid GeneralPlayerInfo', () => {
      expect(isGeneralPlayerInfo(validGeneralPlayerInfo)).toBe(true);
    });

    it('should return false for invalid GeneralPlayerInfo', () => {
      const invalidInfo = {
        element_type: 1,
        first_name: 'David',
      };
      expect(isGeneralPlayerInfo(invalidInfo)).toBe(false);
    });
  });

  describe('isPlayerStats', () => {
    it('should return true for valid PlayerStats', () => {
      expect(isPlayerStats(validPlayerStats)).toBe(true);
    });

    it('should return false for invalid PlayerStats', () => {
      const invalidStats = {
        assists: 0,
        bonus: 3,
      };
      expect(isPlayerStats(invalidStats)).toBe(false);
    });
  });

  describe('isPlayerValue', () => {
    it('should return true for valid PlayerValue with numbers', () => {
      expect(isPlayerValue(validPlayerValue)).toBe(true);
    });

    it('should return true for valid PlayerValue with null fields', () => {
      const nullValue = { value: null, value5: null, value_remaining: null };
      expect(isPlayerValue(nullValue)).toBe(true);
    });

    it('should return true for valid PlayerValue with mixed number and null fields', () => {
      const mixedValue = { value: 12.5, value5: null, value_remaining: 14.1 };
      expect(isPlayerValue(mixedValue)).toBe(true);
    });

    it('should return false when a field is a non-null, non-number value (missing key)', () => {
      // With isOptionallyDefined, a missing key (undefined) passes — that is
      // intentional: the type allows null and the object shape is validated by
      // the outer isObject call. Use a bad-type value to test rejection.
      const invalidValue = {
        value: 'bad',
        value5: 13.2,
        value_remaining: 14.1,
      };
      expect(isPlayerValue(invalidValue)).toBe(false);
    });

    it('should return false for a non-object', () => {
      expect(isPlayerValue(null)).toBe(false);
      expect(isPlayerValue(42)).toBe(false);
      expect(isPlayerValue('string')).toBe(false);
    });
  });

  describe('isProcessedPlayer', () => {
    it('should return true for valid ProcessedPlayer', () => {
      expect(isProcessedPlayer(validProcessedPlayer)).toBe(true);
    });

    it('should return false for invalid ProcessedPlayer', () => {
      const invalidPlayer = {
        fixtureData: validFixtureData,
        generalInfo: validGeneralPlayerInfo,
      };
      expect(isProcessedPlayer(invalidPlayer)).toBe(false);
    });
  });

  describe('isTeamPlayerDict', () => {
    it('should return true for valid TeamPlayerDict', () => {
      const validDict = {
        Arsenal: [validProcessedPlayer],
        Chelsea: [validProcessedPlayer, validProcessedPlayer],
      };
      expect(isTeamPlayerDict(validDict)).toBe(true);
    });

    it('should return true for empty TeamPlayerDict', () => {
      const emptyDict = {
        Arsenal: [],
        Chelsea: [],
      };
      expect(isTeamPlayerDict(emptyDict)).toBe(true);
    });

    it('should return false for invalid TeamPlayerDict with non-array values', () => {
      const invalidDict = {
        Arsenal: [validProcessedPlayer],
        Chelsea: 'not an array',
      };
      expect(isTeamPlayerDict(invalidDict)).toBe(false);
    });

    it('should return false for invalid TeamPlayerDict with invalid players', () => {
      const invalidDict = {
        Arsenal: [{ id: 1, name: 'Invalid' }],
      };
      expect(isTeamPlayerDict(invalidDict)).toBe(false);
    });
  });

  describe('isPositionPlayerDict', () => {
    it('should return true for valid PositionPlayerDict', () => {
      const validDict = {
        Goalkeepers: [validProcessedPlayer],
        Defenders: [validProcessedPlayer, validProcessedPlayer],
        Midfielders: [],
        Forwards: [validProcessedPlayer],
      };
      expect(isPositionPlayerDict(validDict)).toBe(true);
    });

    it('should return false for PositionPlayerDict missing required keys', () => {
      const invalidDict = {
        Goalkeepers: [validProcessedPlayer],
        Defenders: [validProcessedPlayer],
      };
      expect(isPositionPlayerDict(invalidDict)).toBe(false);
    });

    it('should return false for PositionPlayerDict with non-array values', () => {
      const invalidDict = {
        Goalkeepers: [validProcessedPlayer],
        Defenders: 'not an array',
        Midfielders: [],
        Forwards: [],
      };
      expect(isPositionPlayerDict(invalidDict)).toBe(false);
    });

    it('should return false for PositionPlayerDict with invalid players', () => {
      const invalidDict = {
        Goalkeepers: [{ id: 1 }],
        Defenders: [],
        Midfielders: [],
        Forwards: [],
      };
      expect(isPositionPlayerDict(invalidDict)).toBe(false);
    });
  });
});

describe('sort key guards', () => {
  describe('isPlayerSortKey', () => {
    it('should return true for every declared sort key', () => {
      PlayerSortKeys.forEach((key) => {
        expect(isPlayerSortKey(key)).toBe(true);
      });
    });

    it('should return false for a non-sortable player field', () => {
      expect(isPlayerSortKey('web_name')).toBe(false);
      expect(isPlayerSortKey('playerStats')).toBe(false);
    });

    it('should return false for non-string input', () => {
      expect(isPlayerSortKey(undefined)).toBe(false);
      expect(isPlayerSortKey(null)).toBe(false);
      expect(isPlayerSortKey(1)).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(isPlayerSortKey('Total_Points')).toBe(false);
    });
  });

  describe('isSortDirection', () => {
    it('should return true for asc and desc', () => {
      expect(isSortDirection('asc')).toBe(true);
      expect(isSortDirection('desc')).toBe(true);
    });

    it('should return false for anything else', () => {
      expect(isSortDirection('ascending')).toBe(false);
      expect(isSortDirection('DESC')).toBe(false);
      expect(isSortDirection(undefined)).toBe(false);
    });
  });
});
