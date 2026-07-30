import {
  isObject,
  isString,
  isObjectOfType,
  isNumber,
  isArrayOfType,
  isOptionallyDefined,
  isBoolean,
} from '@fpl/utils';
import {
  FixtureData,
  Games,
  FDRDict,
  GameweekData,
  GameweekDataEntry,
  FixturesByGameweek,
  FixtureEntry,
  ReadableFixture,
  ReadableFixtureEntry,
} from '../types';
import { isTopElementInfo, isChipPlay } from './api';

/**
 * Check if the value is a FixtureData.
 *
 * @param f - the value to check.
 *
 * @returns true if f is a FixtureData, false otherwise.
 */
export const isFixtureData = (f: unknown): f is FixtureData =>
  isObject(f) &&
  isOptionallyDefined(f.fdr1, isNumber) &&
  isOptionallyDefined(f.fdr5, isNumber) &&
  isOptionallyDefined(f.fdr_remaining, isNumber);

/**
 * Check if the value is a Games.
 *
 * @param g - the value to check.
 *
 * @returns true if g is a Games, false otherwise.
 */
export const isGames = (g: unknown): g is Games =>
  isObject(g) &&
  isNumber(g.games_next_gw) &&
  isNumber(g.games_next_five) &&
  isNumber(g.total_games_remaining);

/**
 * Check if the value is a GameweekDataEntry.
 *
 * @param g - the value to check.
 *
 * @returns true if g is a GameweekDataEntry, false otherwise.
 */
export const isGameweekDataEntry = (g: unknown): g is GameweekDataEntry =>
  isObject(g) &&
  isNumber(g.id) &&
  isNumber(g.average_entry_score) &&
  isBoolean(g.finished) &&
  isNumber(g.highest_score) &&
  isTopElementInfo(g.top_element_info) &&
  isNumber(g.most_captained) &&
  isArrayOfType(g.chip_plays, isChipPlay);

/**
 * Check if the value is a GameweekData.
 *
 * @param g - the value to check.
 *
 * @returns true if g is a GameweekData, false otherwise.
 */
export const isGameweekData = (g: unknown): g is GameweekData =>
  isObjectOfType(g, isNumber, isGameweekDataEntry);

/**
 * Check if the value is a FixtureEntry.
 *
 * @param f - the value to check.
 *
 * @returns true if f is a FixtureEntry, false otherwise.
 */
export const isFixtureEntry = (f: unknown): f is FixtureEntry =>
  isObject(f) &&
  isBoolean(f.finished) &&
  isNumber(f.home_team) &&
  isNumber(f.away_team) &&
  isOptionallyDefined(f.home_score, isNumber) &&
  isOptionallyDefined(f.away_score, isNumber) &&
  isNumber(f.gw) &&
  (isString(f.kickoff_time) || f.kickoff_time === null);

const isFixtureEntryArray = (arr: unknown): arr is FixtureEntry[] =>
  isArrayOfType(arr, isFixtureEntry);

/**
 * Check if f is a FixturesByGameweek.
 *
 * @param f - the value to check.
 *
 * @returns true if f is a FixturesByGameweek, false otherwise.
 */
export const isFixturesByGameweek = (f: unknown): f is FixturesByGameweek =>
  isObjectOfType(f, isNumber, isFixtureEntryArray);

/**
 * Check if the value is a ReadableFixtureEntry.
 *
 * @param r - the value to check.
 *
 * @returns true if r is a ReadableFixtureEntry, false otherwise.
 */
export const isReadableFixtureEntry = (r: unknown): r is ReadableFixtureEntry =>
  isObject(r) &&
  isBoolean(r.finished) &&
  isString(r.home_team) &&
  isString(r.away_team) &&
  isOptionallyDefined(r.home_score, isNumber) &&
  isOptionallyDefined(r.away_score, isNumber) &&
  isNumber(r.gw) &&
  (isString(r.kickoff_time) || r.kickoff_time === null);

const isReadableFixtureEntryArray = (
  arr: unknown
): arr is ReadableFixtureEntry[] => isArrayOfType(arr, isReadableFixtureEntry);

/**
 * Check if r is a ReadableFixture.
 *
 * @param r - the value to check.
 *
 * @returns true if r is a ReadableFixture, false otherwise.
 */
export const isReadableFixture = (r: unknown): r is ReadableFixture =>
  isObjectOfType(r, isNumber, isReadableFixtureEntryArray);

const isNumberArray = (arr: unknown): arr is number[] =>
  isArrayOfType(arr, isNumber);

const isFDRInnerDict = (obj: unknown): obj is Record<number, number[]> =>
  isObjectOfType(obj, isNumber, isNumberArray);

/**
 * Check if f is a FDRDict.
 *
 * @param f - the value to check.
 *
 * @returns true if f is a FDRDict, false otherwise.
 */
export const isFDRDict = (f: unknown): f is FDRDict =>
  isObjectOfType(f, isNumber, isFDRInnerDict);
