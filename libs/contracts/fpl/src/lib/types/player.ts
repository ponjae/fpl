import { FixtureData, Games } from './fixture';

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
 * The calculated player value related data.
 * Fields are null when no fixtures are scheduled in the respective horizon.
 */
export type PlayerValue = {
  value: number | null;
  value5: number | null;
  value_remaining: number | null;
};

/**
 * Sortable numeric leaf fields on ProcessedPlayer.
 *
 * These are the fields the UI uses for ranking. They are all numeric (or
 * number | null for value fields). Shared here so the frontend, ranking
 * endpoints, and service layer all reference the same union without duplication.
 */
export const PlayerSortKeys = [
  'form',
  'now_cost',
  'points_per_game',
  'selected_by_percent',
  'total_points',
  'transfers_in',
  'transfers_out',
  'minutes',
  'goals_scored',
  'assists',
  'saves',
  'penalties_saved',
  'points_per_million',
  'value',
  'value5',
  'value_remaining',
] as const;

export type PlayerSortKey = (typeof PlayerSortKeys)[number];

/**
 * Runtime check that a string is a valid PlayerSortKey.
 *
 * @param value - the candidate value, typically from a query string.
 *
 * @returns true when the value is a supported sort key.
 */
export const isPlayerSortKey = (value: unknown): value is PlayerSortKey =>
  typeof value === 'string' &&
  (PlayerSortKeys as readonly string[]).includes(value);

/**
 * Valid sort directions.
 */
export const SortDirections = ['asc', 'desc'] as const;

/**
 * Direction for sorting players.
 */
export type SortDirection = (typeof SortDirections)[number];

/**
 * Runtime check that a string is a valid SortDirection.
 *
 * @param value - the candidate value, typically from a query string.
 *
 * @returns true when the value is a supported sort direction.
 */
export const isSortDirection = (value: unknown): value is SortDirection =>
  typeof value === 'string' &&
  (SortDirections as readonly string[]).includes(value);

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
