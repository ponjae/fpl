import { Fn } from './types';

/**
 * Make a function async.
 *
 * @param fn - the function.
 *
 * @returns the async version of the function.
 */
export const asyncify =
  <T extends Fn>(fn: T) =>
  (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    try {
      return Promise.resolve(fn(...args));
    } catch (error) {
      return Promise.reject(error);
    }
  };

/**
 * Wait for a value.
 *
 * @param timeout - the timeout.
 * @param value - the value to return when timeout expires.
 *
 * @returns the result.
 */
export const wait = <T>(timeout: number, value: T) =>
  new Promise<T>((resolve) => {
    setTimeout(() => resolve(value), timeout);
  });

/**
 * Wait for a certain timeout before execution starts.
 *
 * @param timeout - the timeout in milliseconds before execution starts.
 * @param fn - the function to run.
 * @param args - the arguments of the function.
 *
 * @returns the result.
 */
export const awaiter = <T extends Fn>(
  timeout: number,
  fn: T,
  ...args: Parameters<T>
) =>
  new Promise<Awaited<ReturnType<T>>>((resolve, reject) => {
    setTimeout(() => {
      asyncify(fn)(...args)
        .then(resolve)
        .catch(reject);
    }, timeout);
  });

/**
 * Asynchronously iterate over an array and apply a callback to each item.
 *
 * The items are processed in order, and the callback is awaited for each item.
 *
 * @param array - the array to iterate over.
 * @param callback - the callback function to run for each item in the array.
 * @param throttleDelay - the delay marking the delay between each callback (default 0).
 *
 * @returns A promise that resolves to an array of results from the callback.
 */
export const asyncForEach = async <T, U>(
  array: T[],
  callback: (item: T, index: number, array: T[]) => Promise<U>,
  throttleDelay = 0
): Promise<U[]> => {
  const results: U[] = [];
  for (let i = 0; i < array.length; i++) {
    results.push(await awaiter(throttleDelay, callback, array[i], i, array));
  }
  return results;
};
