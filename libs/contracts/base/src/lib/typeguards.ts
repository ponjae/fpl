import { isNumber, isObject, isString } from '@fpl/utils';
import { ErrorBody } from './types';

/**
 * Check if the body is an error body.
 *
 * @param body - the body to test.
 *
 * @returns true if the body is an error body.
 */
export const isErrorBody = (b: unknown): b is ErrorBody =>
  isObject(b) &&
  isNumber(b.status, { min: 0 }) &&
  isString(b.method) &&
  isString(b.path) &&
  isString(b.type);
