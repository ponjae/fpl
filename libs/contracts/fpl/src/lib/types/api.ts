/********************************************************************
 * Raw types as received from the FPL API
 ********************************************************************/

/**
 * The complete raw data as received from the FPL API.
 */
export type AllData = {
  events: Event[];
  teams: RawTeam[];
  elements: RawPlayer[];
  element_types: ElementType[];
};

/**
 * The raw player data as received from the FPL API.
 */
export type RawPlayer = {
  assists: number;
  birth_date: string;
  bonus: number;
  bps: number;
  can_select: boolean;
  clean_sheets: number;
  code: number;
  creativity: string;
  creativity_rank: number;
  creativity_rank_type: number;
  defensive_contribution: number;
  defensive_contribution_per_90: number;
  dreamteam_count: number;
  element_type: number;
  ep_next: string;
  ep_this: string;
  event_points: number;
  expected_assists: string;
  expected_assists_per_90: number;
  expected_goal_involvements: string;
  expected_goal_involvements_per_90: number;
  expected_goals: string;
  expected_goals_conceded: string;
  expected_goals_conceded_per_90: number;
  expected_goals_per_90: number;
  first_name: string;
  form: string;
  goals_conceded: number;
  goals_conceded_per_90: number;
  goals_scored: number;
  ict_index: string;
  ict_index_rank: number;
  ict_index_rank_type: number;
  id: number;
  in_dreamteam: boolean;
  influence: string;
  influence_rank: number;
  influence_rank_type: number;
  minutes: number;
  now_cost: number;
  now_cost_rank: number;
  own_goals: number;
  penalties_missed: number;
  penalties_saved: number;
  points_per_game: string;
  points_per_game_rank: number;
  points_per_game_rank_type: number;
  recoveries: number;
  red_cards: number;
  saves: number;
  saves_per_90: number;
  second_name: string;
  selected_by_percent: string;
  starts: number;
  status: string;
  tackles: number;
  team: number;
  team_code: number;
  threat: string;
  threat_rank: number;
  total_points: number;
  transfers_in: number;
  transfers_in_event: number;
  transfers_out: number;
  transfers_out_event: number;
  value_form: string;
  value_season: string;
  web_name: string;
  yellow_cards: number;
};

/**
 * The raw team type data as received from the FPL API.
 */
export type RawTeam = {
  code: number;
  id: number;
  name: string;
  short_name: string;
  strength: number;
  strength_attack_away: number;
  strength_attack_home: number;
  strength_defence_away: number;
  strength_defence_home: number;
  strength_overall_away: number;
  strength_overall_home: number;
};

/**
 * The chip data (bench boost, free hit, triple captain, wildcard) played in an event.
 */
export type ChipPlay = {
  chip_name: string;
  num_played: number;
};

/**
 * Information about the top element (player) in an event.
 */
export type TopElementInfo = {
  id: number;
  points: number;
};

/**
 * The raw event (game week) data as received from the FPL API.
 */
export type Event = {
  average_entry_score: number;
  chip_plays: ChipPlay[];
  finished: boolean;
  highest_score: number;
  id: number;
  most_captained: number;
  name: string;
  top_element: 531;
  top_element_info: TopElementInfo;
  transfers_made: number;
};

/**
 * The raw element type (position) data as received from the FPL API.
 */
export type ElementType = {
  id: number;
  plural_name: string;
  plural_name_short: string;
  singular_name: string;
  singular_name_short: string;
};

/**
 * The raw fixture data as received from the FPL API.
 */
export type Fixture = {
  event: number;
  id: number;
  kickoff_time: string;
  team_a: number;
  team_a_score: number;
  team_h: number;
  team_h_score: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
};
