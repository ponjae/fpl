import { describe, it, expect } from 'vitest';
import {
  isAllData,
  isRawPlayer,
  isRawTeam,
  isEvent,
  isElementType,
  isFixture,
  isChipPlay,
  isTopElementInfo,
} from './api';

const validFixture = {
  event: 1,
  id: 1,
  kickoff_time: '2025-08-15T17:30:00Z',
  team_a: 2,
  team_a_score: 1,
  team_h: 1,
  team_h_score: 2,
  team_h_difficulty: 3,
  team_a_difficulty: 4,
};

const validPlayer = {
  assists: 0,
  birth_date: '1995-09-15',
  bonus: 3,
  bps: 210,
  can_select: true,
  clean_sheets: 7,
  code: 154561,
  creativity: '10.2',
  creativity_rank: 346,
  creativity_rank_type: 3,
  defensive_contribution: 0,
  defensive_contribution_per_90: 0.0,
  dreamteam_count: 1,
  element_type: 1,
  ep_next: '5.3',
  ep_this: '5.3',
  event_points: 1,
  expected_assists: '0.04',
  expected_assists_per_90: 0.0,
  expected_goal_involvements: '0.04',
  expected_goal_involvements_per_90: 0.0,
  expected_goals: '0.00',
  expected_goals_conceded: '6.17',
  expected_goals_conceded_per_90: 0.56,
  expected_goals_per_90: 0.0,
  first_name: 'David',
  form: '4.3',
  goals_conceded: 5,
  goals_conceded_per_90: 0.45,
  goals_scored: 0,
  ict_index: '17.0',
  ict_index_rank: 250,
  ict_index_rank_type: 16,
  id: 1,
  in_dreamteam: false,
  influence: '159.8',
  influence_rank: 116,
  influence_rank_type: 15,
  minutes: 990,
  now_cost: 59,
  now_cost_rank: 94,
  own_goals: 0,
  penalties_missed: 0,
  penalties_saved: 0,
  points_per_game: '4.8',
  points_per_game_rank: 39,
  points_per_game_rank_type: 2,
  recoveries: 87,
  red_cards: 0,
  saves: 16,
  saves_per_90: 1.45,
  second_name: 'Raya Martín',
  selected_by_percent: '32.2',
  starts: 11,
  status: 'a',
  tackles: 0,
  team: 1,
  team_code: 3,
  threat: '0.0',
  threat_rank: 739,
  total_points: 53,
  transfers_in: 2313527,
  transfers_in_event: 39746,
  transfers_out: 900382,
  transfers_out_event: 44483,
  value_form: '0.7',
  value_season: '9.0',
  web_name: 'Raya',
  yellow_cards: 1,
};

const validTeam = {
  code: 3,
  id: 1,
  name: 'Arsenal',
  short_name: 'ARS',
  strength: 5,
  strength_attack_away: 1400,
  strength_attack_home: 1340,
  strength_defence_away: 1350,
  strength_defence_home: 1260,
  strength_overall_away: 1375,
  strength_overall_home: 1300,
};

const validEvent = {
  average_entry_score: 54,
  chip_plays: [
    { chip_name: 'bboost', num_played: 342779 },
    { chip_name: '3xc', num_played: 272642 },
  ],
  finished: true,
  highest_score: 127,
  id: 1,
  most_captained: 381,
  name: 'Gameweek 1',
  top_element: 531,
  top_element_info: { id: 531, points: 17 },
  transfers_made: 0,
};

const validElementType = {
  id: 1,
  plural_name: 'Goalkeepers',
  plural_name_short: 'GKP',
  singular_name: 'Goalkeeper',
  singular_name_short: 'GKP',
};

describe('Typeguards: API', () => {
  describe('isAllData', () => {
    it('should return true for valid AllData', () => {
      const validData = {
        events: [validEvent],
        teams: [validTeam],
        elements: [validPlayer],
        element_types: [validElementType],
      };
      expect(isAllData(validData)).toBe(true);
    });

    it('should return false for invalid AllData', () => {
      const invalidData = {
        events: [],
        teams: [],
      };
      expect(isAllData(invalidData)).toBe(false);
    });
  });

  describe('isRawPlayer', () => {
    it('should return true for valid RawPlayer', () => {
      expect(isRawPlayer(validPlayer)).toBe(true);
    });

    it('should return false for invalid RawPlayer', () => {
      const invalidPlayer = {
        id: 1,
        web_name: 'Raya',
      };
      expect(isRawPlayer(invalidPlayer)).toBe(false);
    });
  });

  describe('isRawTeam', () => {
    it('should return true for valid RawTeam', () => {
      expect(isRawTeam(validTeam)).toBe(true);
    });

    it('should return false for invalid RawTeam', () => {
      const invalidTeam = {
        id: 1,
        name: 'Arsenal',
        // missing required fields
      };
      expect(isRawTeam(invalidTeam)).toBe(false);
    });
  });

  describe('isEvent', () => {
    it('should return true for valid Event', () => {
      expect(isEvent(validEvent)).toBe(true);
    });

    it('should return false for invalid Event', () => {
      const invalidEvent = {
        id: 1,
        name: 'Gameweek 1',
        // missing required fields
      };
      expect(isEvent(invalidEvent)).toBe(false);
    });
  });

  describe('isElementType', () => {
    it('should return true for valid ElementType', () => {
      expect(isElementType(validElementType)).toBe(true);
    });

    it('should return false for invalid ElementType', () => {
      const invalidElementType = {
        id: 1,
        plural_name: 'Goalkeepers',
        // missing required fields
      };
      expect(isElementType(invalidElementType)).toBe(false);
    });
  });

  describe('isFixture', () => {
    it('should return true for valid Fixture', () => {
      expect(isFixture(validFixture)).toBe(true);
    });

    it('should return false for invalid Fixture', () => {
      const invalidFixture = {
        id: 1,
        event: 1,
        // missing required fields
      };
      expect(isFixture(invalidFixture)).toBe(false);
    });
  });

  describe('isTopElementInfo', () => {
    it('should return true for valid TopElementInfo', () => {
      const validTopElementInfo = { id: 531, points: 17 };
      expect(isTopElementInfo(validTopElementInfo)).toBe(true);
    });

    it('should return false for invalid TopElementInfo', () => {
      const invalidTopElementInfo = { id: '531', points: 17 };
      expect(isTopElementInfo(invalidTopElementInfo)).toBe(false);
    });
  });

  describe('isChipPlay', () => {
    it('should return true for valid ChipPlay', () => {
      const validChipPlay = { chip_name: 'bboost', num_played: 342779 };
      expect(isChipPlay(validChipPlay)).toBe(true);
    });

    it('should return false for invalid ChipPlay', () => {
      const invalidChipPlay = { chip_name: 'bboost', num_played: '342779' };
      expect(isChipPlay(invalidChipPlay)).toBe(false);
    });
  });
});
