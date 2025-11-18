import { isDefined } from './typeguards';
import { Collection, CompareFn, TransformFn, UniqueFn } from './types';

/**
 * Identity function.
 *
 * @param value - the value.
 *
 * @returns the value given.
 */
export const identity = <T>(value: T) => value;

/**
 * Transform to array.
 * Please note that when maps and sets are used order is not guaranteed.
 *
 * @param collection - the collection.
 * @param collections - the other collections to merge.
 *
 * @returns an array of the values stored.
 */
export const toArray = <T>(
  collection: Collection<T>,
  ...collections: Collection<T>[]
) =>
  concat([collection], collections).reduce<T[]>(
    (acc, c) =>
      acc.concat(
        ...(c instanceof Map || c instanceof Set ? Array.from(c.values()) : c)
      ),
    []
  );

/**
 * Pick value from a collection with the highest or lowest score.
 *
 * @param collection - the collection.
 * @param cb - the score transform function.
 * @param max - flag for if max value should be selected, when false lowest value will be selected.
 */
export const pickBy = <T>(
  collection: Collection<T>,
  cb: TransformFn<T, number>,
  max = true
) => {
  const array = toArray(collection);

  if (array.length === 0) {
    return undefined;
  } else {
    return array.reduce((value, current) =>
      cb(value) > cb(current) ? (max ? value : current) : max ? current : value
    );
  }
};

/**
 * Get the first element in the array.
 *
 * @param array - the array to test.
 *
 * @returns the first element or undefined when array is empty.
 */
export const head = <T>(array: T[]): T | undefined => array[0];

/**
 * Repeat something n times.
 *
 * @param times - the number of times.
 * @param cb - the callback.
 *
 * @returns an array of the results from the callback.
 */
export const repeats = <T>(times: number, cb: (index: number) => T) =>
  Array.from({ length: Math.max(times, 0) }, (_, index) => cb(index));

/**
 * Filter out duplicates from a collection.
 *
 * @param collection - the collection to remove duplicates from.
 * @param fn - the optional value iteration function.
 *
 * @returns the array with unique values.
 */
export const unique = <T>(
  collection: Collection<T>,
  fn: UniqueFn<T> = identity
) =>
  toArray(collection).filter(
    (value, index, self) =>
      self.findIndex((candidate) => fn(candidate) === fn(value)) === index
  );

/**
 * The difference by two sets.
 *
 * @param a - the first set.
 * @param b - the second set.
 * @param fn - the optional value iteration function defining the uniqueness of the item.
 *
 * @returns the elements that exists in a but not in b.
 */
export const difference = <T>(
  a: Collection<T>,
  b: Collection<T>,
  fn: UniqueFn<T> = identity
) => {
  const uniqueB = unique(b, fn);
  return unique(a, fn).filter((member) =>
    uniqueB.every((m) => fn(member) !== fn(m))
  );
};

/**
 * The intersection of two sets.
 *
 * @param a - the first set.
 * @param b - the second set.
 * @param fn - the optional value iteration function defining the uniqueness of the item.
 *
 * @returns all elements included in both a and b.
 */
export const intersection = <T>(
  a: Collection<T>,
  b: Collection<T>,
  fn: UniqueFn<T> = identity
) => {
  const uniqueB = unique(b, fn);
  return unique(a, fn).filter((member) =>
    uniqueB.some((m) => fn(m) === fn(member))
  );
};

/**
 * The union of two sets.
 *
 * @param a - the first set.
 * @param b - the second set.
 * @param fn - the optional value iteration function defining the uniqueness of the item.
 * @returns all elements included in a and b. If element is available in a and b it will
 *          select the element in a as the set member.
 */
export const union = <T>(
  a: Collection<T>,
  b: Collection<T>,
  fn?: UniqueFn<T>
) => unique(concat(toArray(a), toArray(b)), fn);

/**
 * Check if two collections intersects.
 *
 * @param a - the first set.
 * @param b - the second set.
 * @param fn - the optional value iteration function defining the uniqueness of the item.
 *
 * @returns true when elements in a exists in b, otherwise false.
 */
export const intersects = <T>(
  a: Collection<T>,
  b: Collection<T>,
  fn?: UniqueFn<T>
) => intersection(a, b, fn).length > 0;

/**
 * Check if two arrays contains the same elements.
 *
 * @param a - the first set.
 * @param b - the second set.
 * @param fn - the optional value iteration function defining the uniqueness of the item.
 *
 * @returns true when they contain the same elements, otherwise false.
 */
export const isEqualSet = <T>(a: T[], b: T[], fn?: UniqueFn<T>) =>
  unique(a, fn).length === unique(b, fn).length &&
  difference(a, b, fn).length === 0;

/**
 * Check if a set is a subset of a superset.
 *
 * @param a - the set to test.
 * @param b - the super set.
 * @param fn - the optional value iteration function defining the uniqueness of the item.
 *
 * @returns true when a is a subset of b, otherwise false.
 */
export const subset = <T>(
  a: Collection<T>,
  b: Collection<T>,
  fn?: UniqueFn<T>
) => isEqualSet(intersection(b, a, fn), unique(a, fn));

/**
 * Group values by an identifier.
 *
 * @param collection - the collection to group.
 * @param fn - the transform function.
 *
 * @returns the grouped array.
 */
export const groupBy = <T>(
  collection: Collection<T>,
  fn: TransformFn<T, string | number>
) =>
  toArray(collection).reduce<Record<string, T[]>>((acc, current) => {
    const key = fn(current);

    return {
      ...acc,
      [key]: append(acc[key], current),
    };
  }, {});

/**
 * Group by with the addition that each element will be compared to all other elements
 * and if accepted it will be added to that group.
 *
 * @param collection - the collection to group.
 * @param fn - the group key function.
 * @param compareFn - the compare function.
 *
 * @returns a record with the grouped keys and the elements that pass the comparison.
 */
export const groupByCompare = <T>(
  collection: Collection<T>,
  fn: TransformFn<T, string | number>,
  compareFn: CompareFn<T, boolean>
) =>
  toArray(collection).reduce<Record<string, T[]>>((acc, current, _, array) => {
    const key = fn(current);
    const values = array
      .filter((candidate) => candidate !== current)
      .filter((candidate) => compareFn(candidate, current));

    return {
      ...acc,
      [key]: concat(acc[key], values),
    };
  }, {});

/**
 * Async version of group by with the addition that each element will be compared to all other elements
 * and if accepted it will be added to the group.
 *
 * @param collection - the collection to group.
 * @param fn - the group key function.
 * @param compareFn - the async compare function.
 *
 * @returns a record with the grouped keys and the elements that pass the comparison.
 *
 * @see groupByCompare
 */
export const asyncGroupByCompare = async <T>(
  collection: Collection<T>,
  fn: TransformFn<T, string | number>,
  compareFn: CompareFn<T, Promise<boolean>>
) => {
  let result: Record<string, T[]> = {};
  const array = toArray(collection);

  for (const item of array) {
    const key = fn(item);
    const values = await Promise.all(
      array
        .filter((candidate) => candidate !== item)
        .map(async (candidate) => ({
          candidate,
          valid: await compareFn(candidate, item),
        }))
    ).then((candidates) =>
      candidates.filter(({ valid }) => valid).map(({ candidate }) => candidate)
    );

    result = { ...result, [key]: concat(result[key], values) };
  }
  return result;
};

/**
 * Move an item in an array from a position to another position.
 *
 * @param array - the array to move item in.
 * @param from - the from index.
 * @param to - the to index.
 *
 * @returns the new array with the items re-arranged, when from and to is different.
 */
export const move = <T>(array: T[], from: number, to: number) => {
  let result = array;

  if (from !== to) {
    result = [...result];
    const [item] = result.splice(from, 1);

    if (isDefined(item)) {
      result.splice(to, 0, item);
    }
  }
  return result;
};

/**
 * Replace an item in the array with an item that has the same uniqueness
 * in the array.
 *
 * @param array - the array.
 * @param item - the item to insert.
 * @param fn - the uniqueness function.
 *
 * @returns true when item is replaced otherwise false.
 */
export const searchReplace = <T>(array: T[], item: T, fn: UniqueFn<T>) => {
  const uniqueValue = fn(item);
  const index = array.findIndex((value) => fn(value) === uniqueValue);
  const found = index >= 0;

  if (found) {
    array[index] = item;
  }
  return found;
};

/**
 * Combine two arrays where the first array is the control array
 * and the second one includes values that the first array should replace.
 *
 * @param control - the control array.
 * @param replace - the replace array.
 * @param equalFn - the equality function.
 *
 * @returns the control array with equal values in replace array replaced.
 */
export const combine = <T>(
  control: T[],
  replace: T[],
  equalFn: CompareFn<T, boolean>
) => {
  const copy = [...replace];

  return control.map((defaultItem) => {
    let result = defaultItem;
    const index = copy.findIndex((item) => equalFn(defaultItem, item));

    if (index >= 0) {
      result = copy[index];
      copy.splice(index, 1);
    }

    return result;
  });
};

/**
 * Check if an array has items.
 *
 * @param array - the arrays to check.
 *
 * @returns true when any of the arrays has at least one item, otherwise false.
 */
export const hasItem = <T>(...array: T[][]): boolean =>
  array.some((a) => a.length > 0);

/**
 * Check if a value exists in all values.
 *
 * @param value - the value to check.
 * @param values - the values.
 * @param cb - callback function.
 *
 * @returns true when value exists in all values, otherwise false.
 */
export const exists = <T, U extends number | string>(
  value: U,
  array: T[],
  cb: TransformFn<T, U | undefined>
) => array.map(cb).every((v) => v === value);

/**
 * Concatenates arrays where an array can be undefined or null.
 *
 * @param arrays - the array to concatenate.
 *
 * @returns the arrays concatenated.
 */
export const concat = <T>(...arrays: (T | undefined | null)[]) =>
  arrays.filter(isDefined).flat();

/**
 * Append values to an array.
 *
 * @param array - the array to append values to.
 * @param values - the values to append.
 *
 * @returns a new array with values appended in order.
 */
export const append = <T>(
  array: T[] | undefined,
  ...values: (T | undefined | null)[]
) => concat(array, values.filter(isDefined));

/**
 * Pre-pend values to an array.
 *
 * @param array - the array to prepend values to.
 * @param values - the values to prepend.
 *
 * @returns a new array with values prepended in order.
 */
export const prepend = <T>(
  array: T[] | undefined,
  ...values: (T | undefined | null)[]
) => concat(values.filter(isDefined), array);
