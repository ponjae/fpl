import { describe, it, expect } from 'vitest';
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
    it('should return true for valid PlayerValue', () => {
      expect(isPlayerValue(validPlayerValue)).toBe(true);
    });

    it('should return false for invalid PlayerValue', () => {
      const invalidValue = {
        value: 12.5,
        value5: 13.2,
      };
      expect(isPlayerValue(invalidValue)).toBe(false);
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
