import {
  isArrayOfType,
  isBoolean,
  isDefined,
  isNaturalNumber,
  isNumber,
  isNumberArray,
  isObject,
  isObjectOfType,
  isOptionallyDefined,
  isString,
  isStringArray,
  isStringValue,
  isInteger,
} from './typeguards';

describe('utils - TypeGuards', () => {
  describe('isObject', () => {
    it('should return true for an empty object', () => {
      expect(isObject({})).toBe(true);
    });

    it('should return true for a class', () => {
      class A {}
      const instance = new A();

      expect(isObject(instance)).toBeTruthy();
    });

    it('should return true for an object with properties', () => {
      expect(isObject({ key: 'value' })).toBe(true);
      expect(isObject({ a: 1, b: 'two', c: true })).toBe(true);
    });

    it('should return false for non-object values', () => {
      expect(isObject('string')).toBe(false);
      expect(isObject(123)).toBe(false);
      expect(isObject(true)).toBe(false);
      expect(isObject(undefined)).toBe(false);
      expect(isObject(null)).toBe(false);
      expect(isObject([])).toBe(false);
    });
  });

  describe('isDefined', () => {
    it('should return true for defined values', () => {
      expect(isDefined(0)).toBe(true);
      expect(isDefined('')).toBe(true);
      expect(isDefined(false)).toBe(true);
      expect(isDefined([])).toBe(true);
      expect(isDefined({})).toBe(true);
    });

    it('should return false for undefined and null values', () => {
      expect(isDefined(undefined)).toBe(false);
      expect(isDefined(null)).toBe(false);
    });
  });

  describe('isNumber', () => {
    it('should return true for valid numbers within default range', () => {
      expect(isNumber(5)).toBe(true);
      expect(isNumber(0)).toBe(true);
      expect(isNumber(-100)).toBe(true);
      expect(isNumber(3.14)).toBe(true);
    });

    it('should return false for non-numbers', () => {
      expect(isNumber('5')).toBe(false);
      expect(isNumber(true)).toBe(false);
      expect(isNumber(undefined)).toBe(false);
      expect(isNumber(null)).toBe(false);
      expect(isNumber({})).toBe(false);
      expect(isNumber([])).toBe(false);
    });

    it('should return true for valid numbers within specified range', () => {
      expect(isNumber(5, { min: 0, max: 10 })).toBe(true);
      expect(isNumber(10, { min: 0, max: 10 })).toBe(true);
      expect(isNumber(0, { min: 0, max: 10 })).toBe(true);
    });

    it('should return false for numbers outside specified range', () => {
      expect(isNumber(15, { min: 0, max: 10 })).toBe(false);
      expect(isNumber(-5, { min: 0, max: 10 })).toBe(false);
    });
  });

  describe('isNaturalNumber', () => {
    it('should return true for natural numbers', () => {
      expect(isNaturalNumber(0)).toBe(true);
      expect(isNaturalNumber(1)).toBe(true);
      expect(isNaturalNumber(123)).toBe(true);
    });

    it('should return false for negative numbers', () => {
      expect(isNaturalNumber(-1)).toBe(false);
      expect(isNaturalNumber(-10)).toBe(false);
      expect(isNaturalNumber(-123)).toBe(false);
    });

    it('should return false for non-integer numbers', () => {
      expect(isNaturalNumber(1.5)).toBe(false);
      expect(isNaturalNumber(3.14)).toBe(false);
    });

    it('should return false for non-number values', () => {
      expect(isNaturalNumber('string')).toBe(false);
      expect(isNaturalNumber(true)).toBe(false);
      expect(isNaturalNumber([])).toBe(false);
      expect(isNaturalNumber({})).toBe(false);
      expect(isNaturalNumber(undefined)).toBe(false);
      expect(isNaturalNumber(null)).toBe(false);
    });

    it('should return false for floating point number', () => {
      expect(isNaturalNumber(1.5)).toBe(false);
      expect(isNaturalNumber(3.14)).toBe(false);
    });

    it('should return true for zero when max is explicitly defined', () => {
      expect(isNaturalNumber(0, 0)).toBe(true);
    });
  });

  describe('isString', () => {
    it('should return true for strings within length range', () => {
      expect(isString('hello')).toBe(true);
      expect(isString('world')).toBe(true);
    });

    it('should return true for strings with minimum length specified', () => {
      expect(isString('hello', { min: 5 })).toBe(true);
      expect(isString('world', { min: 5 })).toBe(true);
    });

    it('should return true for strings with maximum length specified', () => {
      expect(isString('hello', { max: 5 })).toBe(true);
      expect(isString('world', { max: 5 })).toBe(true);
    });

    it('should return false for strings exceeding maximum length', () => {
      expect(isString('hello', { max: 3 })).toBe(false);
      expect(isString('world', { max: 3 })).toBe(false);
    });

    it('should return false for strings shorter than minimum length', () => {
      expect(isString('hi', { min: 5 })).toBe(false);
      expect(isString('yo', { min: 5 })).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(isString(123)).toBe(false);
      expect(isString(true)).toBe(false);
      expect(isString([])).toBe(false);
      expect(isString({})).toBe(false);
      expect(isString(undefined)).toBe(false);
      expect(isString(null)).toBe(false);
    });
  });

  describe('isStringValue', () => {
    it('should return true when string is one of the values provided', () => {
      expect(isStringValue('a', 'a', 'b', 'c')).toBeTruthy();
    });

    it('should return false when string is not one of the values provided', () => {
      expect(isStringValue('a', 'c', 'd', 'e')).toBeFalsy();
    });
  });

  describe('isBoolean', () => {
    it('should return true for boolean values', () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
    });

    it('should return false for non-boolean values', () => {
      expect(isBoolean(0)).toBe(false);
      expect(isBoolean(1)).toBe(false);
      expect(isBoolean('true')).toBe(false);
      expect(isBoolean('false')).toBe(false);
      expect(isBoolean([])).toBe(false);
      expect(isBoolean({})).toBe(false);
      expect(isBoolean(undefined)).toBe(false);
      expect(isBoolean(null)).toBe(false);
    });
  });

  describe('isArrayOfType', () => {
    it('should return true for arrays of numbers', () => {
      expect(isArrayOfType([1, 2, 3], isNumber)).toBe(true);
      expect(isArrayOfType([], isNumber)).toBe(true);
    });

    it('should return false for arrays with non-matching elements', () => {
      expect(isArrayOfType(['a', 'b', 'c'], isNumber)).toBe(false);
      expect(isArrayOfType([1, 2, 'three'], isNumber)).toBe(false);
      expect(isArrayOfType([], isNumber)).toBe(true);
    });

    it('should return true for arrays of strings', () => {
      expect(isArrayOfType(['apple', 'banana', 'cherry'], isString)).toBe(true);
      expect(isArrayOfType([], isString)).toBe(true);
    });

    it('should return false for arrays with non-string elements', () => {
      expect(isArrayOfType([1, 2, 3], isString)).toBe(false);
      expect(isArrayOfType([true, false], isString)).toBe(false);
      expect(isArrayOfType([], isString)).toBe(true);
    });

    it('should return true for arrays with custom minimum length', () => {
      expect(isArrayOfType([1, 2, 3], isNumber, { min: 3 })).toBe(true);
      expect(isArrayOfType([1, 2, 3], isNumber, { min: 2 })).toBe(true);
      expect(isArrayOfType([1, 2, 3], isNumber, { min: 4 })).toBe(false);
    });

    it('should return true for array with custom maximum length', () => {
      expect(isArrayOfType([1, 2, 3], isNumber, { max: 3 })).toBe(true);
      expect(isArrayOfType([1, 2, 3], isNumber, { max: 2 })).toBe(false);
      expect(isArrayOfType([1, 2, 3], isNumber, { min: 0, max: 4 })).toBe(true);
    });

    it('should return false for non-arrays', () => {
      expect(isArrayOfType('not an array', isNumber)).toBe(false);
      expect(isArrayOfType(123, isNumber)).toBe(false);
      expect(isArrayOfType({}, isNumber)).toBe(false);
      expect(isArrayOfType(null, isNumber)).toBe(false);
      expect(isArrayOfType(undefined, isNumber)).toBe(false);
    });
  });

  describe('isStringArray', () => {
    it('should return true for arrays of strings', () => {
      expect(isStringArray(['apple', 'banana', 'cherry'])).toBe(true);
      expect(isStringArray([])).toBe(true);
    });

    it('should return false for arrays with non-string elements', () => {
      expect(isStringArray([1, 2, 3])).toBe(false);
      expect(isStringArray([true, false])).toBe(false);
      expect(isStringArray([{}, {}])).toBe(false);
    });

    it('should return true for arrays with custom minimum length', () => {
      expect(isStringArray(['apple', 'banana', 'cherry'], 3)).toBe(true);
      expect(isStringArray(['apple', 'banana', 'cherry'], 2)).toBe(true);
      expect(isStringArray(['apple', 'banana', 'cherry'], 4)).toBe(false);
    });

    it('should return false for non-arrays', () => {
      expect(isStringArray('not an array')).toBe(false);
      expect(isStringArray(123)).toBe(false);
      expect(isStringArray({})).toBe(false);
      expect(isStringArray(null)).toBe(false);
      expect(isStringArray(undefined)).toBe(false);
    });
  });

  describe('isNumberArray', () => {
    it('should return true for arrays of numbers', () => {
      expect(isNumberArray([1, 2, 3])).toBe(true);
      expect(isNumberArray([])).toBe(true);
    });

    it('should return false for arrays with non-number elements', () => {
      expect(isNumberArray(['1', '2', '3'])).toBe(false);
      expect(isNumberArray([true, false])).toBe(false);
      expect(isNumberArray([{}, {}])).toBe(false);
    });

    it('should return true for arrays with custom minimum length', () => {
      expect(isNumberArray([1, 2, 3], 3)).toBe(true);
      expect(isNumberArray([1, 2, 3], 2)).toBe(true);
      expect(isNumberArray([1, 2, 3], 4)).toBe(false);
    });

    it('should return false for non-arrays', () => {
      expect(isNumberArray('not an array')).toBe(false);
      expect(isNumberArray(123)).toBe(false);
      expect(isNumberArray({})).toBe(false);
      expect(isNumberArray(null)).toBe(false);
      expect(isNumberArray(undefined)).toBe(false);
    });
  });

  describe('isOptionallyDefined', () => {
    it('should return true for defined values', () => {
      expect(isOptionallyDefined('test', isString)).toBe(true);
      expect(isOptionallyDefined(123, isNumber)).toBe(true);
      expect(isOptionallyDefined(true, isBoolean)).toBe(true);
      expect(isOptionallyDefined({}, isObject)).toBe(true);
    });

    it('should return true for undefined values', () => {
      expect(isOptionallyDefined(undefined, isString)).toBe(true);
      expect(isOptionallyDefined(undefined, isNumber)).toBe(true);
      expect(isOptionallyDefined(undefined, isBoolean)).toBe(true);
      expect(isOptionallyDefined(undefined, isObject)).toBe(true);
    });

    it('should return true for null values', () => {
      expect(isOptionallyDefined(null, isString)).toBe(true);
      expect(isOptionallyDefined(null, isNumber)).toBe(true);
      expect(isOptionallyDefined(null, isBoolean)).toBe(true);
      expect(isOptionallyDefined(null, isObject)).toBe(true);
    });
  });

  describe('isObjectOfType', () => {
    it('should return true for objects with expected keys and values', () => {
      const obj = { key1: 1, key2: 2, key3: 3 };
      expect(isObjectOfType(obj, isString, isNumber)).toBe(true);
    });

    it('should return false for objects with invalid keys', () => {
      const obj1 = { key1: 1, key2: 'two', key3: true };
      expect(isObjectOfType(obj1, isString, isNumber)).toBe(false);

      const obj2 = { key1: 1, key2: 'two', key3: true };
      expect(isObjectOfType(obj2, isString, isBoolean)).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(isObjectOfType(['foo', 'bar'], isString, isString)).toBe(false);
      expect(isObjectOfType([1, 2], isString, isString)).toBe(false);
      expect(isObjectOfType('not an object', isString, isNumber)).toBe(false);
      expect(isObjectOfType(123, isString, isNumber)).toBe(false);
      expect(isObjectOfType(undefined, isString, isNumber)).toBe(false);
      expect(isObjectOfType(null, isString, isNumber)).toBe(false);
    });
  });

  describe('isInteger', () => {
    it('should return true for integer values', () => {
      const validIntegers = [0, 1, 100, -100, 100000, -10000];
      validIntegers.forEach((num) => {
        expect(isInteger(num)).toBe(true);
      });
    });

    it('should return false for non-integer values', () => {
      const invalidIntegers = [1.5, -1.5, 'hejsan'];

      invalidIntegers.forEach((num) => {
        expect(isInteger(num)).toBe(false);
      });
    });

    it('should return when the number is within the specified interval', () => {
      const withinInterval = [0, 10, 5];

      withinInterval.forEach((num) => {
        expect(isInteger(num, { min: 0, max: 10 })).toBe(true);
      });
    });

    it('should return false when the number is outside the specified interval', () => {
      const outsideInterval = [-1, 11, 1000];

      outsideInterval.forEach((num) => {
        expect(isInteger(num, { min: 0, max: 10 })).toBe(false);
      });
    });
  });
});
