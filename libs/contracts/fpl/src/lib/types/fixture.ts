import { TopElementInfo, ChipPlay } from './api';

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
 * Fixture difficulty rating dictionary type.
 */
export type FDRDict = Record<number, Record<number, number[]>>;

/**
 * Gameweek data entry.
 */
export type GameweekDataEntry = {
  id: number;
  average_entry_score: number;
  finished: boolean;
  highest_score: number;
  top_element_info: TopElementInfo;
  most_captained: number;
  chip_plays: ChipPlay[];
};

/**
 * Gameweek data dictionary type.
 */
export type GameweekData = Record<number, GameweekDataEntry>;

/**
 * Fixture entry with team IDs.
 */
export type FixtureEntry = {
  finished: boolean;
  home_team: number;
  away_team: number;
  home_score?: number;
  away_score?: number;
  gw: number;
};

/**
 * Fixtures organized by gameweek.
 */
export type FixturesByGameweek = Record<number, FixtureEntry[]>;

/**
 * Fixture entry with team names.
 */
export type ReadableFixtureEntry = {
  finished: boolean;
  home_team: string;
  away_team: string;
  home_score?: number;
  away_score?: number;
  gw: number;
};

/**
 * Human-readable fixtures organized by gameweek.
 */
export type ReadableFixture = Record<number, ReadableFixtureEntry[]>;
