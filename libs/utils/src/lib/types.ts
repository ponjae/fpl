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
