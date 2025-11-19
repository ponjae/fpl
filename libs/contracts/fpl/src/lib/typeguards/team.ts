import { isObject, isString, isObjectOfType } from '@fpl/utils';
import { TeamData, TeamDataDict } from '../types';

/**
 * Checks if the given value is a TeamDataDict.
 *
 * @param t - The value to check.
 *
 * @returns true if t is a TeamDataDict, false otherwise.
 */
export const isTeamData = (t: unknown): t is TeamData =>
  isObject(t) &&
  isString(t.name) &&
  isString(t.nickname) &&
  isString(t.city) &&
  isString(t.arena) &&
  isString(t.coach) &&
  isString(t.pl_titles);

/**
 * Checks if the given value is a TeamDataDict.
 *
 * @param t - The value to check.
 *
 * @returns true if t is a TeamDataDict, false otherwise.
 */
export const isTeamDataDict = (t: unknown): t is TeamDataDict =>
  isObjectOfType(t, isString, isTeamData);
