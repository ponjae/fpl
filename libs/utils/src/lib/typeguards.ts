import { InferFn, Maybe } from './types';

/**
 * Represents an inclusive interval with a minimum and maximum value.
 */
type Interval = {
  min?: number;
  max?: number;
};

const DEFAULT_MIN = Number.MIN_SAFE_INTEGER;
const DEFAULT_MAX = Number.MAX_SAFE_INTEGER;

/**
 * Check if o is an object.
 *
 * @param o - the unknown variable to test.
 *
 * @returns true if o is an object.
 */
export const isObject = (o: unknown): o is Record<string, unknown> =>
  !(Array.isArray(o) || o === null) && typeof o === 'object';

/**
 * Check if n is a number.
 *
 * @param n - the number to check.
 * @param min - The minimum length of the string.
 * @param max - The maximum length of the string.
 *
 * @returns true if n is a number greater than or equal to minValue, otherwise false.
 */
export const isNumber = (
  n: unknown,
  { min = DEFAULT_MIN, max = DEFAULT_MAX }: Interval = {}
): n is number => typeof n === 'number' && n >= min && n <= max;

/**
 * Check if a number is an integer.
 *
 * @param n - the number to test.
 *
 * @returns true if the number is an integer, otherwise false.
 */
export const isInteger = (
  n: unknown,
  { min = DEFAULT_MIN, max = DEFAULT_MAX }: Interval = {}
): n is number => isNumber(n, { min, max }) && Math.floor(n) === n;

/**
 * Check if n is a natural (non-negative) number.
 *
 * @param n - the number to check.
 *
 * @returns true if n is a positive number.
 */
export const isNaturalNumber = (n: unknown, max = DEFAULT_MAX): n is number =>
  isInteger(n, { min: 0, max });

/**
 * Check if a s is a string.
 *
 * @param s - the string to check.
 * @param min - The minimum length of the string.
 * @param max - The maximum length of the string.
 *
 * @returns true if s is a string of a minimum length.
 */
export const isString = (
  s: unknown,
  { min = 0, max = DEFAULT_MAX }: Interval = {}
): s is string => typeof s === 'string' && min <= s.length && s.length <= max;

/**
 * Check if a string value is one of the values provided.
 *
 * @param s - the string to check.
 * @param values - the values s can be.
 *
 * @returns true when valid, otherwise false.
 */
export const isStringValue = <T extends string>(
  s: unknown,
  ...values: T[]
): s is T => isString(s) && values.includes(s as T);

/**
 * Check if a value exists in the values of a dictionary.
 *
 * @param s - the value to check.
 * @param dictionary - the dictionary.
 *
 * @returns true when valid, otherwise false.
 */
export const isStringMember = <T extends string>(
  s: unknown,
  dictionary: Record<string, T>
): s is T => isStringValue(s, ...Object.values(dictionary));

/**
 * Check if b is a boolean value.
 *
 * @param b - the boolean to check.
 *
 * @returns true if b is a boolean, otherwise false.
 */
export const isBoolean = (b: unknown): b is boolean => typeof b === 'boolean';

/**
 * Check if a value is defined.
 *
 * @param value - the value to check.
 *
 * @returns true if the value is defined, otherwise false.
 */
export const isDefined = <T>(value: Maybe<T>): value is T => value != null;

/**
 * Check if an array are of a certain type.
 *
 * @param array - the array to check.
 * @param typeguardFn - the validator function.
 * @param interval - the interval to check the length of the array.
 *
 * @returns true if the array is of the desired type, otherwise false.
 */
export const isArrayOfType = <T>(
  array: unknown,
  typeguardFn: InferFn<T>,
  { min = 0, max = DEFAULT_MAX }: Interval = {}
): array is T[] =>
  Array.isArray(array) &&
  array.every((value) => typeguardFn(value)) &&
  array.length >= min &&
  array.length <= max;

/**
 * Check if an array is a string array.
 *
 * @param array - the array to check.
 * @param minLength - the minimum length.
 *
 * @returns true if the array is an array of strings, otherwise false.
 */
export const isStringArray = (
  array: unknown,
  minLength = 0
): array is string[] => isArrayOfType(array, isString, { min: minLength });

/**
 * Check if an array is an array of numbers.
 *
 * @param array - the array to check.
 * @param minLength - the minimum length.
 *
 * @returns true if the array is an array of numbers, otherwise false.
 */
export const isNumberArray = (
  array: unknown,
  minLength = 0
): array is number[] => isArrayOfType(array, isNumber, { min: minLength });

/**
 * Check if a value is optionally defined.
 *
 * @param value - the value to test.
 * @param validateFn - the validate function.
 *
 * @returns true when value is undefined or when value is defined and validated, otherwise false.
 */
export const isOptionallyDefined = (
  value: unknown,
  validateFn: (value: unknown) => boolean
): boolean => (isDefined(value) ? validateFn(value) : true);

/**
 * Check if an object's entries consist of keys and values of the expected types.
 *
 * @param object - the object to test.
 * @param keyTypeGuard - a function that validates the type of keys.
 * @param valueTypeGuard - a function that validates the type of values.
 *
 * @returns true when the object consists of keys and values of the expected type, otherwise false.
 */
export const isObjectOfType = <KeyType extends PropertyKey, ValueType>(
  o: unknown,
  keyTypeGuard: InferFn<KeyType>,
  valueTypeGuard: InferFn<ValueType>
): o is Record<KeyType, ValueType> =>
  isObject(o) &&
  Object.entries(o).every(
    ([key, value]) => keyTypeGuard(key) && valueTypeGuard(value)
  );
