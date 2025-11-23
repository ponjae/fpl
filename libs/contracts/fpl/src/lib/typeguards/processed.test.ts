import { describe, it, expect } from 'vitest';
import { isPlayerDict, isProcessedData } from './processed';

const validProcessedPlayer = {
  fixtureData: {
    fdr1: 3,
    fdr5: 2.5,
    fdr_remaining: 3.2,
  },
  generalInfo: {
    element_type: 1,
    first_name: 'David',
    id: 1,
    now_cost: 59,
    status: 'a',
    team: 1,
    web_name: 'Raya',
  },
  playerStats: {
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
  },
  playerValue: {
    value: 12.5,
    value5: 13.2,
    value_remaining: 14.1,
  },
  games: {
    games_next_gw: 1,
    games_next_five: 5,
    total_games_remaining: 20,
  },
};

const validPlayerDict = {
  byTeam: {
    Arsenal: [validProcessedPlayer],
    Chelsea: [validProcessedPlayer],
  },
  byPosition: {
    Goalkeepers: [validProcessedPlayer],
    Defenders: [validProcessedPlayer],
    Midfielders: [validProcessedPlayer],
    Forwards: [validProcessedPlayer],
  },
  byId: {
    1: validProcessedPlayer,
    2: validProcessedPlayer,
  },
};

const validProcessedData = {
  players: validPlayerDict,
  gameweeks: {
    1: {
      id: 1,
      average_entry_score: 54,
      finished: true,
      highest_score: 127,
      top_element_info: { id: 531, points: 17 },
      most_captained: 381,
      chip_plays: [{ chip_name: 'bboost', num_played: 342779 }],
    },
  },
  fixtures: {
    1: [
      {
        finished: true,
        home_team: 1,
        away_team: 2,
        home_score: 2,
        away_score: 1,
        gw: 1,
      },
    ],
  },
  readableFixtures: {
    1: [
      {
        finished: true,
        home_team: 'Arsenal',
        away_team: 'Chelsea',
        home_score: 2,
        away_score: 1,
        gw: 1,
      },
    ],
  },
  teamData: {
    Arsenal: {
      name: 'Arsenal FC',
      nickname: 'The Gunners',
      city: 'London',
      arena: 'Emirates Stadium',
      coach: 'Mikel Arteta',
      pl_titles: '13',
    },
  },
  idTeamDict: {
    1: 'Arsenal',
    2: 'Chelsea',
  },
  idPositionDict: {
    1: 'Goalkeeper',
    2: 'Defender',
  },
  currentGameweek: 12,
  lastUpdated: new Date('2025-11-23'),
};

describe('Typeguards: Processed', () => {
  describe('isPlayerDict', () => {
    it('should return true for valid PlayerDict', () => {
      expect(isPlayerDict(validPlayerDict)).toBe(true);
    });

    it('should return false for invalid PlayerDict', () => {
      const invalidDict = {
        byTeam: {},
        byPosition: {},
      };
      expect(isPlayerDict(invalidDict)).toBe(false);
    });

    it('should return false when byTeam has invalid values', () => {
      const invalidDict = {
        byTeam: {
          Arsenal: 'not an array',
        },
        byPosition: validPlayerDict.byPosition,
        byId: validPlayerDict.byId,
      };
      expect(isPlayerDict(invalidDict)).toBe(false);
    });

    it('should return false when byPosition is missing required keys', () => {
      const invalidDict = {
        byTeam: validPlayerDict.byTeam,
        byPosition: {
          Goalkeepers: [],
        },
        byId: validPlayerDict.byId,
      };
      expect(isPlayerDict(invalidDict)).toBe(false);
    });
  });

  describe('isProcessedData', () => {
    it('should return true for valid ProcessedData', () => {
      expect(isProcessedData(validProcessedData)).toBe(true);
    });

    it('should return false for invalid ProcessedData', () => {
      const invalidData = {
        players: validPlayerDict,
        gameweeks: {},
      };
      expect(isProcessedData(invalidData)).toBe(false);
    });

    it('should return false when lastUpdated is not a Date', () => {
      const invalidData = {
        ...validProcessedData,
        lastUpdated: '2025-11-23',
      };
      expect(isProcessedData(invalidData)).toBe(false);
    });

    it('should return false when currentGameweek is not a number', () => {
      const invalidData = {
        ...validProcessedData,
        currentGameweek: '12',
      };
      expect(isProcessedData(invalidData)).toBe(false);
    });

    it('should return false when players is invalid', () => {
      const invalidData = {
        ...validProcessedData,
        players: {
          byTeam: {},
        },
      };
      expect(isProcessedData(invalidData)).toBe(false);
    });
  });
});
