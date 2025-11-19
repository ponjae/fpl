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
