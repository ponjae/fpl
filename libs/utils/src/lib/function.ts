import { isDefined } from './typeguards';

/**
 * Identity function.
 *
 * @param value - the value.
 *
 * @returns the value given.
 */
export const identity = <T>(value: T) => value;

/**
 * Defaults a not defined value.
 *
 * @param value - the value.
 * @param defaultValue - the default value to set.
 *
 * @returns the value when defined, otherwise the default value.
 */
export const defaultTo = <T>(value: T | undefined | null, defaultValue: T) =>
  isDefined(value) ? value : defaultValue;
