/**
 * Infer function type.
 */
export type InferFn<T> = (value: unknown) => value is T;

/**
 * Optional, Nullable and Maybe types.
 */
export type Optional<T> = T | undefined;
export type Nullable<T> = T | null;
export type Maybe<T> = Optional<T> | Nullable<T>;

/**
 * Internal type representation of collections of data.
 */
export type Collection<T> = T[] | Map<unknown, T> | Set<T>;

/**
 * A compare function.
 */
export type CompareFn<T, U> = (value1: T, value2: T) => U;

/**
 * Representation of the uniqueness in a collection.
 */
export type UniqueFn<T> = (value: T) => unknown;

/**
 * A filter function.
 */
export type FilterFn<T> = (value: T) => boolean;

/**
 * A transform function.
 *
 * Transforms values of type T to type S.
 */
export type TransformFn<S, T = S> = (value: S) => T;
