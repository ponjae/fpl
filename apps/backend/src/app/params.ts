import { toAppError } from './index';

/**
 * Parse a URL parameter as a positive integer.
 *
 * Throws a 400 `ApplicationError` if the value is not a valid numeric string.
 *
 * @param value - the raw string extracted from the URL.
 * @param paramName - the name of the param (used in the error message).
 *
 * @returns the parsed integer.
 */
export const parseIntParam = (value: string, paramName: string): number => {
  const trimmed = value.trim();
  const parsed = Number(trimmed);

  if (trimmed === '' || !Number.isInteger(parsed) || isNaN(parsed)) {
    throw toAppError(
      `Parameter '${paramName}' must be a valid integer, got '${value}'`,
      400,
      'validation'
    );
  }

  return parsed;
};
