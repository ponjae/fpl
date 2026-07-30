import { describe, it, expect } from 'vitest';
import {
  isFixtureData,
  isGames,
  isGameweekDataEntry,
  isGameweekData,
  isFixtureEntry,
  isFixturesByGameweek,
  isReadableFixtureEntry,
  isReadableFixture,
  isFDRDict,
} from './fixture';

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

const validGameweekDataEntry = {
  id: 1,
  average_entry_score: 54,
  finished: true,
  highest_score: 127,
  top_element_info: { id: 531, points: 17 },
  most_captained: 381,
  chip_plays: [
    { chip_name: 'bboost', num_played: 342779 },
    { chip_name: '3xc', num_played: 272642 },
  ],
};

const validFixtureEntry = {
  finished: true,
  home_team: 1,
  away_team: 2,
  home_score: 2,
  away_score: 1,
  gw: 1,
  kickoff_time: '2025-08-16T14:00:00Z',
};

const validReadableFixtureEntry = {
  finished: true,
  home_team: 'Arsenal',
  away_team: 'Chelsea',
  home_score: 2,
  away_score: 1,
  gw: 1,
  kickoff_time: '2025-08-16T14:00:00Z',
};

describe('Typeguards: Fixture', () => {
  describe('isFixtureData', () => {
    it('should return true for valid FixtureData', () => {
      expect(isFixtureData(validFixtureData)).toBe(true);
    });

    it('should return true for FixtureData with optional fields missing', () => {
      expect(isFixtureData({})).toBe(true);
      expect(isFixtureData({ fdr1: 3 })).toBe(true);
    });

    it('should return false for invalid FixtureData', () => {
      const invalidData = {
        fdr1: '3',
        fdr5: 2.5,
      };
      expect(isFixtureData(invalidData)).toBe(false);
    });
  });

  describe('isGames', () => {
    it('should return true for valid Games', () => {
      expect(isGames(validGames)).toBe(true);
    });

    it('should return false for invalid Games', () => {
      const invalidGames = {
        games_next_gw: 1,
        games_next_five: 5,
      };
      expect(isGames(invalidGames)).toBe(false);
    });
  });

  describe('isGameweekDataEntry', () => {
    it('should return true for valid GameweekDataEntry', () => {
      expect(isGameweekDataEntry(validGameweekDataEntry)).toBe(true);
    });

    it('should return false for invalid GameweekDataEntry', () => {
      const invalidEntry = {
        id: 1,
        average_entry_score: 54,
      };
      expect(isGameweekDataEntry(invalidEntry)).toBe(false);
    });
  });

  describe('isGameweekData', () => {
    it('should return true for valid GameweekData', () => {
      const validData: Record<number, typeof validGameweekDataEntry> = {};
      validData[1] = validGameweekDataEntry;
      validData[2] = validGameweekDataEntry;
      expect(isGameweekData(validData)).toBe(true);
    });

    it('should return false for invalid GameweekData', () => {
      const invalidData = {
        1: validGameweekDataEntry,
        invalid: 'not a valid entry',
      };
      expect(isGameweekData(invalidData)).toBe(false);
    });
  });

  describe('isFixtureEntry', () => {
    it('should return true for valid FixtureEntry', () => {
      expect(isFixtureEntry(validFixtureEntry)).toBe(true);
    });

    it('should return true for FixtureEntry with optional scores missing', () => {
      const entryWithoutScores = {
        finished: false,
        home_team: 1,
        away_team: 2,
        gw: 1,
        kickoff_time: '2025-08-16T14:00:00Z',
      };
      expect(isFixtureEntry(entryWithoutScores)).toBe(true);
    });

    it('should return true for FixtureEntry with null kickoff_time', () => {
      const entryNullKickoff = {
        finished: false,
        home_team: 1,
        away_team: 2,
        gw: 1,
        kickoff_time: null,
      };
      expect(isFixtureEntry(entryNullKickoff)).toBe(true);
    });

    it('should return false for invalid FixtureEntry', () => {
      const invalidEntry = {
        finished: true,
        home_team: 1,
      };
      expect(isFixtureEntry(invalidEntry)).toBe(false);
    });
  });

  describe('isFixturesByGameweek', () => {
    it('should return true for valid FixturesByGameweek', () => {
      const validFixtures: Record<number, (typeof validFixtureEntry)[]> = {};
      validFixtures[1] = [validFixtureEntry];
      validFixtures[2] = [validFixtureEntry, validFixtureEntry];
      expect(isFixturesByGameweek(validFixtures)).toBe(true);
    });

    it('should return false for invalid FixturesByGameweek', () => {
      const invalidFixtures = {
        1: [validFixtureEntry],
        2: 'not an array',
      };
      expect(isFixturesByGameweek(invalidFixtures)).toBe(false);
    });
  });

  describe('isReadableFixtureEntry', () => {
    it('should return true for valid ReadableFixtureEntry', () => {
      expect(isReadableFixtureEntry(validReadableFixtureEntry)).toBe(true);
    });

    it('should return true for ReadableFixtureEntry with optional scores missing', () => {
      const entryWithoutScores = {
        finished: false,
        home_team: 'Arsenal',
        away_team: 'Chelsea',
        gw: 1,
        kickoff_time: '2025-08-16T14:00:00Z',
      };
      expect(isReadableFixtureEntry(entryWithoutScores)).toBe(true);
    });

    it('should return true for ReadableFixtureEntry with null kickoff_time', () => {
      const entryNullKickoff = {
        finished: false,
        home_team: 'Arsenal',
        away_team: 'Chelsea',
        gw: 1,
        kickoff_time: null,
      };
      expect(isReadableFixtureEntry(entryNullKickoff)).toBe(true);
    });

    it('should return false for invalid ReadableFixtureEntry', () => {
      const invalidEntry = {
        finished: true,
        home_team: 'Arsenal',
      };
      expect(isReadableFixtureEntry(invalidEntry)).toBe(false);
    });
  });

  describe('isReadableFixture', () => {
    it('should return true for valid ReadableFixture', () => {
      const validFixtures: Record<
        number,
        (typeof validReadableFixtureEntry)[]
      > = {};
      validFixtures[1] = [validReadableFixtureEntry];
      validFixtures[2] = [validReadableFixtureEntry, validReadableFixtureEntry];
      expect(isReadableFixture(validFixtures)).toBe(true);
    });

    it('should return false for invalid ReadableFixture', () => {
      const invalidFixtures = {
        1: [validReadableFixtureEntry],
        2: [validFixtureEntry],
      };
      expect(isReadableFixture(invalidFixtures)).toBe(false);
    });
  });

  describe('isFDRDict', () => {
    it('should return true for valid FDRDict', () => {
      const validFDR: Record<number, Record<number, number[]>> = {};
      validFDR[1] = {};
      validFDR[1][1] = [2, 3, 4, 3, 2];
      validFDR[1][2] = [3, 4, 2, 3, 4];
      validFDR[2] = {};
      validFDR[2][1] = [1, 2, 3, 2, 1];
      expect(isFDRDict(validFDR)).toBe(true);
    });

    it('should return false for invalid FDRDict', () => {
      const invalidFDR = {
        1: {
          1: [2, 3, 4],
          2: 'not an array',
        },
      };
      expect(isFDRDict(invalidFDR)).toBe(false);
    });
  });
});
