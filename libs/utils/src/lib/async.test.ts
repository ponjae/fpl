import { asyncForEach, asyncify, awaiter, wait } from './async';
import { isBoolean } from './typeguards';

const syncFn = () => Math.random() > 0.2;
const asyncFn = async () => syncFn();

describe('Utils - async', () => {
  describe('asyncify', () => {
    it('Test with sync function', async () => {
      const fn = asyncify(syncFn);

      const value = await fn();

      expect(isBoolean(value)).toBeTruthy();
    });

    it('Test with async function', async () => {
      const fn = asyncify(asyncFn);

      const value = await fn();

      expect(isBoolean(value)).toBeTruthy();
    });
  });
  describe('wait', () => {
    it('Test wait', async () => {
      const value = await wait(500, 'value');

      expect(value).toBe('value');
    });
  });

  describe('awaiter', () => {
    it('Test awaiter with async function', async () => {
      const value = await awaiter(200, asyncFn);

      expect(isBoolean(value)).toBeTruthy();
    });

    it('Test awaiter with sync function', async () => {
      const value = await awaiter(200, syncFn);

      expect(isBoolean(value)).toBeTruthy();
    });
  });

  describe('asyncForEach', () => {
    it('returns a promise that resolves to an empty array when given an empty array', async () => {
      const result = await asyncForEach([], async (item) => {
        return item;
      });
      expect(result).toEqual([]);
    });

    it('returns a promise that resolves to an array of all callback results', async () => {
      const result = await asyncForEach(['a', 'b', 'c'], async (item) => {
        return item.toUpperCase();
      });
      expect(result).toEqual(['A', 'B', 'C']);
    });

    it('handles errors in the callback', async () => {
      const error = new Error('Test error');
      await expect(
        asyncForEach(['a', 'b'], async (item) => {
          if (item === 'b') throw error;
        })
      ).rejects.toThrow(error);
    });
  });
});
