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
  /** Null for players whose date of birth FPL does not publish. */
  birth_date: string | null;
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
  /**
   * Expected points for the next gameweek.
   *
   * Null outside the season (e.g. pre-season) when FPL has not yet computed
   * expected points.
   */
  ep_next: string | null;
  /**
   * Expected points for the current gameweek.
   *
   * Null outside the season (e.g. pre-season) when FPL has not yet computed
   * expected points.
   */
  ep_this: string | null;
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
  /** Null before the season starts, when FPL has not yet rated the club. */
  strength: number | null;
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
  /** Null before the gameweek has been played. */
  highest_score: number | null;
  id: number;
  /** Player id. Null before the gameweek has been played. */
  most_captained: number | null;
  name: string;
  /** Player id. Null before the gameweek has been played. */
  top_element: number | null;
  /** Null before the gameweek has been played. */
  top_element_info: TopElementInfo | null;
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
 *
 * `finished` is the authoritative "match is fully concluded" flag from the FPL API.
 * `finished_provisional` becomes true slightly before `finished` (once scores are
 * confirmed but live bonus points may still adjust), so we use `finished` to avoid
 * mis-marking a match as done while bonus points are still being processed.
 */
export type Fixture = {
  event: number;
  finished: boolean;
  finished_provisional: boolean;
  id: number;
  /** Null for unscheduled fixtures (e.g. pre-season or postponed matches). */
  kickoff_time: string | null;
  team_a: number;
  team_a_score: number | null;
  team_h: number;
  team_h_score: number | null;
  team_h_difficulty: number;
  team_a_difficulty: number;
};
