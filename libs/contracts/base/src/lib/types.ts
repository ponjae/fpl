/**
 * The base error type denotes that the error comes from the app itself.
 */
export const BaseErrorTypes = {
  App: 'app',
} as const;

/**
 * The base error type.
 */
export type BaseErrorType =
  (typeof BaseErrorTypes)[keyof typeof BaseErrorTypes];

/**
 * The common error body for all express servers.
 */
export type ErrorBody<T extends string = string> = {
  status: number;
  method: string;
  path: string;
  type: T;
};
