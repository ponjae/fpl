/**
 * Player-related types used internally in the application
 */

export type ProcessedPlayer = {
  fixtureData: FixtureData;
  generalInfo: GeneralPlayerInfo;
  playerStats: PlayerStats;
  playerValue: PlayerValue;
  games: Games;
};

/**
 * Player info related data.
 */
export type GeneralPlayerInfo = {
  element_type: number;
  first_name: string;
  id: number;
  now_cost: number;
  status: string;
  team: number;
  web_name: string;
};

/**
 * Player stats related data.
 */
export type PlayerStats = {
  assists: number;
  bonus: number;
  clean_sheets: number;
  form: number;
  goals_scored: number;
  minutes: number;
  penalties_missed: number;
  penalties_saved: number;
  points_per_game: number;
  points_per_million: number;
  saves: number;
  selected_by_percent: number;
  total_points: number;
  transfers_in: number;
  transfers_out: number;
};

/**
 * Fixture difficulty related data.
 */
export type FixtureData = {
  fdr1?: number;
  fdr5?: number;
  fdr_remaining?: number;
};

/**
 * Games related data.
 */
export type Games = {
  games_next_gw: number;
  games_next_five: number;
  total_games_remaining: number;
};

/**
 * The calculated player value related data.
 */
export type PlayerValue = {
  value: number;
  value5: number;
  value_remaining: number;
};

/**
 * Dictionary types for processed players.
 */
export type TeamPlayerDict = Record<string, ProcessedPlayer[]>;

/**
 * Dictionary types for processed players by position.
 */
export type PositionPlayerDict = {
  Goalkeepers: ProcessedPlayer[];
  Defenders: ProcessedPlayer[];
  Midfielders: ProcessedPlayer[];
  Forwards: ProcessedPlayer[];
};
