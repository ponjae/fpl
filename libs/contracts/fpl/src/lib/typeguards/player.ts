import {
  isObject,
  isString,
  isObjectOfType,
  isNumber,
  isArrayOfType,
} from '@fpl/utils';
import {
  ProcessedPlayer,
  GeneralPlayerInfo,
  PlayerValue,
  TeamPlayerDict,
  PositionPlayerDict,
  PlayerStats,
} from '../types';
import { isFixtureData, isGames } from './fixture';

/**
 * Checks if the given value is a PlayerStats.
 *
 * @param p - The value to check.
 *
 * @returns true if p is a PlayerStats, false otherwise.
 */
export const isProcessedPlayer = (p: unknown): p is ProcessedPlayer =>
  isObject(p) &&
  isFixtureData(p.fixtureData) &&
  isGeneralPlayerInfo(p.generalInfo) &&
  isPlayerStats(p.playerStats) &&
  isPlayerValue(p.playerValue) &&
  isGames(p.games);

/**
 * Checks if the given value is a ProcessedPlayer.
 *
 * @param p - The value to check.
 *
 * @returns true if p is a ProcessedPlayer, false otherwise.
 */
export const isGeneralPlayerInfo = (p: unknown): p is GeneralPlayerInfo =>
  isObject(p) &&
  isNumber(p.element_type) &&
  isString(p.first_name) &&
  isNumber(p.id) &&
  isNumber(p.now_cost) &&
  isString(p.status) &&
  isNumber(p.team) &&
  isString(p.web_name);

/**
 * Checks if the given value is a PlayerStats.
 *
 * @param p - The value to check.
 *
 * @returns true if p is a PlayerStats, false otherwise.
 */
export const isPlayerStats = (p: unknown): p is PlayerStats =>
  isObject(p) &&
  isNumber(p.assists) &&
  isNumber(p.bonus) &&
  isNumber(p.clean_sheets) &&
  isNumber(p.form) &&
  isNumber(p.goals_scored) &&
  isNumber(p.minutes) &&
  isNumber(p.penalties_missed) &&
  isNumber(p.penalties_saved) &&
  isNumber(p.points_per_game) &&
  isNumber(p.points_per_million) &&
  isNumber(p.saves) &&
  isNumber(p.selected_by_percent) &&
  isNumber(p.total_points) &&
  isNumber(p.transfers_in) &&
  isNumber(p.transfers_out);

/**
 * Checks if the given value is a PlayerValue.
 *
 * @param p - The value to check.
 *
 * @returns true if p is a PlayerValue, false otherwise.
 */
export const isPlayerValue = (p: unknown): p is PlayerValue =>
  isObject(p) &&
  isNumber(p.value) &&
  isNumber(p.value5) &&
  isNumber(p.value_remaining);

/**
 * Checks if the array is an array of ProcessedPlayer.
 *
 * @param arr - The array to check.
 *
 * @returns true if arr is an array of ProcessedPlayer, false otherwise.
 */
const isProcessedPlayerArray = (arr: unknown): arr is ProcessedPlayer[] =>
  isArrayOfType(arr, isProcessedPlayer);

/**
 * Checks if the given value is a TeamPlayerDict.
 *
 * @param t - The value to check.
 *
 * @returns true if t is a TeamPlayerDict, false otherwise.
 */
export const isTeamPlayerDict = (t: unknown): t is TeamPlayerDict =>
  isObjectOfType(t, isString, isProcessedPlayerArray);

/**
 * Checks if the given value is a PositionPlayerDict.
 *
 * @param p - The value to check.
 *
 * @returns true if p is a PositionPlayerDict, false otherwise.
 */
export const isPositionPlayerDict = (p: unknown): p is PositionPlayerDict =>
  isObject(p) &&
  isArrayOfType(p.Goalkeepers, isProcessedPlayer) &&
  isArrayOfType(p.Defenders, isProcessedPlayer) &&
  isArrayOfType(p.Midfielders, isProcessedPlayer) &&
  isArrayOfType(p.Forwards, isProcessedPlayer);
