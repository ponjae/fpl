import { TopElementInfo, ChipPlay } from './api';

/**
 * Fixture difficulty rating dictionary type.
 */
export type FDRDict = Record<number, Record<number, number[]>>;

/**
 * Gameweek data dictionary type.
 */
export type GameweekData = {
  [gameweek: number]: {
    id: number;
    average_entry_score: number;
    finished: boolean;
    highest_score: number;
    top_element_info: TopElementInfo;
    most_captained: number;
    chip_plays: ChipPlay[];
  };
};

/**
 * Fixtures organized by gameweek.
 */
export type FixturesByGameweek = {
  [gameweek: number]: Array<{
    finished: boolean;
    home_team: number;
    away_team: number;
    home_score?: number;
    away_score?: number;
    gw: number;
  }>;
};

/**
 * Human-readable fixtures organized by gameweek.
 */
export type ReadableFixture = {
  [gameweek: number]: Array<{
    finished: boolean;
    home_team: string;
    away_team: string;
    home_score?: number;
    away_score?: number;
    gw: number;
  }>;
};
