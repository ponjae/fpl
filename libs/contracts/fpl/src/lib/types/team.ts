/**
 * Team-related types used internally in the application
 */

/**
 * Team data type.
 */
export type TeamData = {
  name: string;
  nickname: string;
  city: string;
  arena: string;
  coach: string;
  pl_titles: string;
};

/**
 * Dictionary type for team data.
 */
export type TeamDataDict = Record<string, TeamData>;

/**
 * Dictionary mapping team id (number) to team name (string).
 *
 * Keyed by the numeric FPL team id, as used in `FixtureEntry.home_team` /
 * `away_team`. Enables the frontend to resolve fixture team ids to names
 * without deriving the mapping from the full player payload.
 */
export type TeamNamesById = Record<number, string>;
