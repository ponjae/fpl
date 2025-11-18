import {
  append,
  asyncGroupByCompare,
  combine,
  concat,
  difference,
  groupBy,
  groupByCompare,
  hasItem,
  identity,
  intersection,
  intersects,
  isEqualSet,
  move,
  pickBy,
  repeats,
  searchReplace,
  subset,
  toArray,
  union,
  unique,
} from './collection';
import { CompareFn } from './types';

type Typed = { type: string; value: number };

describe('Utils - collection', () => {
  describe('toArray', () => {
    it('Can use ordinary array', () => {
      const value = ['a', 'b'];
      expect(toArray(value)).toEqual(value);
    });

    it('Concatenates arrays', () => {
      const array1 = ['a', 'b'];
      const array2 = ['c', 'd'];
      expect(toArray(array1, array2)).toEqual(['a', 'b', 'c', 'd']);
    });

    it('Can use Set', () => {
      const array = toArray(new Set<string>().add('a').add('b'));
      const expectedValues = ['a', 'b'];

      expect(array.every((item) => expectedValues.includes(item))).toBe(true);
    });

    it('Can use map', () => {
      const array = toArray(
        new Map<string, string>().set('a', 'a').set('b', 'b')
      );
      const expectedValues = ['a', 'b'];

      expect(array.every((item) => expectedValues.includes(item))).toBe(true);
    });

    it('Can use a mix and concatenate to one array', () => {
      const set = new Set<string>().add('a').add('b');
      const map = new Map<string, string>().set('c', 'c').set('d', 'd');
      const arr = ['e', 'f'];

      const array = toArray(set, map, arr);
      const expectedValues = ['a', 'b', 'c', 'd', 'e', 'f'];

      expect(array.every((item) => expectedValues.includes(item))).toBe(true);
    });
  });

  describe('pickBy', () => {
    it('should pick the item with the highest value', () => {
      const a = [0, 6, 3, 2, 1, 4, 5];

      expect(pickBy(a, identity)).toBe(6);
    });

    it('should pick the item with the lowest value', () => {
      const a = [0, 6, 3, 2, 1, 4, 5];

      expect(pickBy(a, identity, false)).toBe(0);
    });

    it('should pick an item from object with the highest value', () => {
      const a = [
        { name: 'Danaerys', surname: 'Targaeryan' },
        { name: 'Jon', surname: 'Snow' },
      ];

      expect(
        pickBy(a, ({ name, surname }) => name.length + surname.length, true)
      ).toEqual({
        name: 'Danaerys',
        surname: 'Targaeryan',
      });
    });
  });

  describe('unique', () => {
    it('should return an array with unique values', () => {
      const array = [1, 2, 3, 2, 4, 5, 1, 6];
      const uniqueArray = unique(array);
      expect(uniqueArray).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should preserve the order of elements', () => {
      const array = [1, 2, 3, 2, 4, 5, 1, 6];
      const uniqueArray = unique(array);
      expect(uniqueArray).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should return an empty array for an empty input', () => {
      const emptyArray: number[] = [];
      const uniqueArray = unique(emptyArray);
      expect(uniqueArray).toEqual([]);
    });

    it('should return an array with one element for single element input', () => {
      const array = [1];
      const uniqueArray = unique(array);
      expect(uniqueArray).toEqual([1]);
    });

    it('should handle arrays with string values', () => {
      const array = ['a', 'b', 'c', 'a', 'd', 'b'];
      const uniqueArray = unique(array);
      expect(uniqueArray).toEqual(['a', 'b', 'c', 'd']);
    });

    it('should return an array with unique values based on a key function', () => {
      const array = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
        { id: 1, name: 'Jack' },
        { id: 3, name: 'Jane' },
      ];
      const uniqueArray = unique(array, (obj) => obj.id);
      expect(uniqueArray).toEqual([
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
        { id: 3, name: 'Jane' },
      ]);
    });

    it('should handle arrays with non-primitive values', () => {
      const array = [
        { id: { value: 1 }, name: 'John' },
        { id: { value: 2 }, name: 'Jane' },
        { id: { value: 1 }, name: 'Jack' },
        { id: { value: 3 }, name: 'Jane' },
      ];
      const uniqueArray = unique(array, (obj) => obj.id.value);
      expect(uniqueArray).toEqual([
        { id: { value: 1 }, name: 'John' },
        { id: { value: 2 }, name: 'Jane' },
        { id: { value: 3 }, name: 'Jane' },
      ]);
    });

    it('should handle arrays with string values', () => {
      const array = ['a', 'b', 'c', 'a', 'd', 'b'];
      const uniqueArray = unique(array, (str) => str);
      expect(uniqueArray).toEqual(['a', 'b', 'c', 'd']);
    });
  });

  describe('difference', () => {
    it('should return an origial set when nothing is included in other set', () => {
      const a = [1, 2, 3];
      const b = [4, 5, 6];

      expect(difference(a, b)).toEqual(a);
      expect(difference(b, a)).toEqual(b);
    });

    it('should return one element if included in a but not in b', () => {
      const a = [2, 3, 4];
      const b = [1, 2, 3];

      expect(difference(a, b)).toEqual([4]);
    });

    it('should return complement if b is subset of a', () => {
      const a = [1, 2, 3];
      const b = [2];

      expect(difference(a, b)).toEqual([1, 3]);
    });

    it('should return empty set if a is empty', () => {
      const a = [];
      const b = [2, 3, 4];

      expect(difference(a, b)).toEqual([]);
    });

    it('should return empty set if same', () => {
      const a = [1];
      const b = [1];

      expect(difference(a, b)).toEqual([]);
    });

    it('should return an origial set when nothing is included in other set', () => {
      const a: Typed[] = [
        { type: 'a', value: 1 },
        { type: 'b', value: 2 },
        { type: 'c', value: 3 },
      ];
      const b: Typed[] = [
        { type: 'd', value: 4 },
        { type: 'e', value: 3 },
        { type: 'f', value: 6 },
      ];

      expect(difference(a, b, ({ type }) => type)).toEqual(a);
      expect(difference(b, a, ({ type }) => type)).toEqual(b);
    });

    it('should return one element if included in a but not in b', () => {
      const a: Typed[] = [
        { type: 'b', value: 2 },
        { type: 'c', value: 3 },
        { type: 'd', value: 4 },
      ];
      const b: Typed[] = [
        { type: 'a', value: 1 },
        { type: 'b', value: 2 },
        { type: 'c', value: 3 },
      ];

      expect(difference(a, b, ({ type }) => type)).toEqual([
        { type: 'd', value: 4 },
      ]);
    });

    it('should return complement if b is subset of a', () => {
      const a: Typed[] = [
        { type: 'a', value: 1 },
        { type: 'b', value: 2 },
        { type: 'c', value: 3 },
      ];
      const b = [{ type: 'b', value: 2 }];

      expect(difference(a, b, ({ type }) => type)).toEqual([
        { type: 'a', value: 1 },
        { type: 'c', value: 3 },
      ]);
    });
  });

  describe('intersection', () => {
    it('should return empty set when nothing is included in other set', () => {
      const a = [1, 2, 3];
      const b = [4, 5, 6];

      expect(intersection(a, b)).toEqual([]);
      expect(intersection(b, a)).toEqual([]);
    });

    it('should return intersection', () => {
      const a = [1, 2, 3];
      const b = [2, 3, 4];

      expect(intersection(a, b)).toEqual([2, 3]);
    });

    it('should return empty set if a is empty', () => {
      const a = [];
      const b = [2, 3, 4];

      expect(intersection(a, b)).toEqual([]);
    });

    it('should return empty set when nothing is included in other set', () => {
      const a: Typed[] = [
        { type: 'a', value: 6 },
        { type: 'b', value: 3 },
        { type: 'c', value: 3 },
      ];
      const b: Typed[] = [
        { type: 'd', value: 2 },
        { type: 'e', value: 3 },
        { type: 'f', value: 2 },
      ];

      expect(intersection(a, b, ({ type }) => type)).toEqual([]);
    });

    it('should return intersection', () => {
      const a: Typed[] = [
        { type: 'a', value: 6 },
        { type: 'b', value: 3 },
        { type: 'c', value: 3 },
      ];
      const b: Typed[] = [
        { type: 'b', value: 2 },
        { type: 'c', value: 3 },
        { type: 'f', value: 2 },
      ];

      expect(intersection(a, b, ({ type }) => type)).toEqual([
        { type: 'b', value: 3 },
        { type: 'c', value: 3 },
      ]);
    });
  });

  describe('union', () => {
    it('should return the union of two sets', () => {
      const a = [1, 2, 3];
      const b = [3, 4, 5];

      expect(union(a, b)).toEqual([1, 2, 3, 4, 5]);
    });

    it('should return the union of two sets with object members', () => {
      const a: Typed[] = [
        { type: 'a', value: 6 },
        { type: 'b', value: 3 },
        { type: 'c', value: 3 },
      ];
      const b: Typed[] = [
        { type: 'b', value: 2 },
        { type: 'c', value: 3 },
        { type: 'f', value: 2 },
      ];

      expect(union(a, b, ({ type }) => type)).toEqual([
        { type: 'a', value: 6 },
        { type: 'b', value: 3 },
        { type: 'c', value: 3 },
        { type: 'f', value: 2 },
      ]);
    });
  });

  describe('intersects', () => {
    it('should return false when nothing is included in other set', () => {
      const a = [1, 2, 3];
      const b = [4, 5, 6];

      expect(intersects(a, b)).toBeFalsy();
    });

    it('should return true when collections intersect', () => {
      const a = [1, 2, 3];
      const b = [2, 3, 4];

      expect(intersects(a, b)).toBeTruthy();
    });

    it('should return false when nothing is included in other set', () => {
      const a: Typed[] = [
        { type: 'a', value: 6 },
        { type: 'b', value: 3 },
        { type: 'c', value: 3 },
      ];
      const b: Typed[] = [
        { type: 'd', value: 2 },
        { type: 'e', value: 3 },
        { type: 'f', value: 2 },
      ];

      expect(intersects(a, b, ({ type }) => type)).toBeFalsy();
    });

    it('should return true when intersections exists', () => {
      const a: Typed[] = [
        { type: 'a', value: 6 },
        { type: 'b', value: 3 },
        { type: 'c', value: 3 },
      ];
      const b: Typed[] = [
        { type: 'b', value: 2 },
        { type: 'c', value: 3 },
        { type: 'f', value: 2 },
      ];

      expect(intersects(a, b, ({ type }) => type)).toBeTruthy();
    });
  });

  describe('isEqualSet', () => {
    it('should be equal when one is not a set', () => {
      const a = [1, 1, 2, 2, 3, 3];
      const b = [1, 2, 3];

      expect(isEqualSet(a, b)).toBeTruthy();
    });

    it('should return false when two sets does not contains the same elements', () => {
      const a: string[] = ['a', 'b', 'c'];
      const b: string[] = ['d', 'e', 'f'];

      expect(isEqualSet(a, b)).toBeFalsy();
    });

    it('should return false when there is merely an intersection', () => {
      const a: string[] = ['a', 'b', 'c'];
      const b: string[] = ['c', 'd', 'e'];

      expect(isEqualSet(a, b)).toBeFalsy();
    });

    it('should return true when two sets contains the same elements', () => {
      const a: string[] = ['a', 'b', 'c'];
      const b: string[] = ['a', 'b', 'c'];

      expect(isEqualSet(a, b)).toBeTruthy();
    });

    it('should return true when two sets contains the same elements but not in the same order', () => {
      const a: string[] = ['a', 'b', 'c'];
      const b: string[] = ['b', 'c', 'a'];

      expect(isEqualSet(a, b)).toBeTruthy();
    });

    it('should return false when two sets does not contain the same elements', () => {
      const a: Typed[] = [
        { type: 'a', value: 6 },
        { type: 'b', value: 3 },
        { type: 'c', value: 3 },
      ];
      const b: Typed[] = [
        { type: 'd', value: 2 },
        { type: 'e', value: 3 },
        { type: 'f', value: 2 },
      ];

      expect(isEqualSet(a, b, ({ type }) => type)).toBeFalsy();
    });

    it('should return true when two sets contain the same elements', () => {
      const a: Typed[] = [
        { type: 'a', value: 6 },
        { type: 'b', value: 3 },
        { type: 'c', value: 3 },
      ];
      const b: Typed[] = [
        { type: 'a', value: 6 },
        { type: 'b', value: 3 },
        { type: 'c', value: 3 },
      ];

      expect(isEqualSet(a, b, ({ type }) => type)).toBeTruthy();
    });

    it('should return false when one array is a superset of another', () => {
      const a: string[] = ['a', 'b', 'c', 'd'];
      const b: string[] = ['a', 'b', 'c'];

      expect(isEqualSet(a, b)).toBeFalsy();
    });

    it('should return false when one array is a subset of another', () => {
      const a: string[] = ['a', 'b', 'c'];
      const b: string[] = ['a', 'b', 'c', 'd'];

      expect(isEqualSet(a, b)).toBeFalsy();
    });
  });

  describe('subset', () => {
    it('should identify a subset', () => {
      const superset = [1, 2, 3, 4, 5];

      expect(subset([2, 3], superset)).toBeTruthy();
    });

    it('should identify the empty set as a subset', () => {
      const superset = [1, 2, 3, 4, 5];
      expect(subset([], superset)).toBeTruthy();
    });

    it('should identify two identical sets as subsets', () => {
      const set = [1, 2, 3, 4, 5];

      expect(subset(set, set)).toBeTruthy();
    });

    it('should identify when a set is not a subset', () => {
      const set = [1, 2, 3, 4, 5];

      expect(subset([6], set)).toBeFalsy();
    });
  });

  describe('move', () => {
    it('should move an item from one position to another', () => {
      const array = ['a', 'b', 'c', 'd', 'e'];
      const movedArray = move(array, 1, 3);
      expect(movedArray).toEqual(['a', 'c', 'd', 'b', 'e']);
    });
  });

  describe('groupBy', () => {
    it('should group elements', () => {
      const array = ['a', 'b', 'b', 'd', 'e'];

      expect(groupBy(array, identity)).toEqual({
        a: ['a'],
        b: ['b', 'b'],
        d: ['d'],
        e: ['e'],
      });
    });
  });

  describe('groupByCompare', () => {
    it('should group elements if difference is 1 or less', () => {
      const array = [0, 4, 3, 5, 9, 10];

      const result = groupByCompare(
        array,
        identity,
        (value1, value2) => Math.abs(value1 - value2) <= 1
      );

      expect(result).toEqual({
        0: [],
        3: [4],
        4: [3, 5],
        5: [4],
        9: [10],
        10: [9],
      });
    });
  });

  describe('asyncGroupByCompare', () => {
    it('should group elements if difference is 1 or less', async () => {
      const array = [0, 4, 3, 5, 9, 10];

      const result = await asyncGroupByCompare(
        array,
        identity,
        async (value1, value2) => Math.abs(value1 - value2) <= 1
      );

      expect(result).toEqual({
        0: [],
        3: [4],
        4: [3, 5],
        5: [4],
        9: [10],
        10: [9],
      });
    });
  });

  describe('hasItems', () => {
    it('check if the array has items', () => {
      const array = ['a', 'b', 'c', 'd', 'e'];
      expect(hasItem(array)).toBeTruthy();
    });

    it('should return false if the array is empty', () => {
      const array: string[] = [];
      expect(hasItem(array)).toBeFalsy();
    });

    it('should work for multiple arrays', () => {
      const a = [];
      const b = ['1'];

      expect(hasItem(a, b)).toBeTruthy();
    });
  });

  describe('searchReplace', () => {
    it('should replace an item in the array', () => {
      const array = [
        { id: 0, name: 'a' },
        { id: 1, name: 'b' },
        { id: 2, name: 'c' },
        { id: 3, name: 'd' },
      ];

      const result = searchReplace(array, { id: 2, name: 'f' }, ({ id }) => id);

      expect(result).toBeTruthy();
      expect(array[2].name).toBe('f');
    });

    it('should not replace anything if search fails', () => {
      const array = [
        { id: 0, name: 'a' },
        { id: 1, name: 'b' },
        { id: 2, name: 'c' },
        { id: 3, name: 'd' },
      ];

      const result = searchReplace(array, { id: 4, name: 'f' }, ({ id }) => id);

      expect(result).toBeFalsy();
    });
  });

  describe('combine', () => {
    const equalityFn: CompareFn<{ id: number; name: string }, boolean> = (
      v1,
      v2
    ) => v1.id === v2.id;

    it('should replace all values in array1 with values in array2 where id is the same', () => {
      const array1 = [
        { id: 0, name: 'name_0_control' },
        { id: 1, name: 'name_1_control' },
        { id: 2, name: 'name_2_control' },
        { id: 3, name: 'name_3_control' },
      ];

      const array2 = [
        { id: 0, name: 'name_0_default' },
        { id: 3, name: 'name_3_default' },
      ];

      expect(combine(array1, array2, equalityFn)).toEqual([
        { id: 0, name: 'name_0_default' },
        { id: 1, name: 'name_1_control' },
        { id: 2, name: 'name_2_control' },
        { id: 3, name: 'name_3_default' },
      ]);
    });

    it('should not handle uniqueness, all values in array1 can only be replaces by values in array2', () => {
      const array1 = [
        { id: 0, name: 'name_0_control_0' },
        { id: 0, name: 'name_0_control_1' },
        { id: 1, name: 'name_1_control' },
        { id: 2, name: 'name_2_control' },
        { id: 3, name: 'name_3_control' },
      ];

      const array2 = [
        { id: 0, name: 'name_0_default_0' },
        { id: 0, name: 'name_0_default_1' },
      ];

      expect(combine(array1, array2, equalityFn)).toEqual([
        { id: 0, name: 'name_0_default_0' },
        { id: 0, name: 'name_0_default_1' },
        { id: 1, name: 'name_1_control' },
        { id: 2, name: 'name_2_control' },
        { id: 3, name: 'name_3_control' },
      ]);
    });
  });

  describe('repeats', () => {
    it('should create an array of the indexes', () => {
      const array = repeats(5, identity);

      expect(array).toHaveLength(5);
    });

    it('should create an empty array when times is negative', () => {
      const array = repeats(-5, identity);

      expect(array).toHaveLength(0);
    });

    it('should create an array with length 0 when using fractional times less than 1', () => {
      const array = repeats(0.6, identity);
      expect(array).toHaveLength(0);
    });
  });

  describe('concat', () => {
    it('should concatenate arrays, preserving order', () => {
      const array1 = [1, 2, 3];
      const array2 = [4, 5, 6];

      expect(concat(array1, array2)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should return empty array when array is undefined', () => {
      const array: number[] | undefined = undefined;

      expect(concat(array)).toEqual([]);
    });

    it('should handle undefined arrays', () => {
      const array1 = [1, 2, 3];
      const array2 = undefined;
      const array3 = [4, 5, 6];

      expect(concat(array1, array2, array3)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should handle null arrays', () => {
      const array1 = [1, 2, 3];
      const array2 = null;
      const array3 = [4, 5, 6];

      expect(concat(array1, array2, array3)).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });

  describe('append', () => {
    it('should append values to an array', () => {
      const array = [1, 2, 3];
      const value1 = 4;
      const value2 = undefined;
      const value3 = null;

      expect(append(array, value1, value2, value3)).toEqual([1, 2, 3, 4]);
    });
  });
});
