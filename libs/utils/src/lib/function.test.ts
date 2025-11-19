import { defaultTo, identity } from './function';

describe('Utils - function', () => {
  describe('defaultTo', () => {
    it('should default to given value', () => {
      const defaultValue = 'default';

      expect(defaultTo(undefined, defaultValue)).toBe(defaultValue);
    });

    it('should return given value', () => {
      const defaultValue = 'default';

      expect(defaultTo('value', defaultValue)).toBe('value');
    });
  });

  describe('identity', () => {
    it('should return the same value', () => {
      const expected = 'value';
      const value = identity(expected);

      expect(value).toEqual(expected);
    });
  });
});
