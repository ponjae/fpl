/**
 * The timeout durations for network requests in milliseconds.
 */
export enum TimeoutTime {
  Short = 1000,
  Medium = 5000,
  Long = 10000,
  Xlong = 30000,
  XXlong = 60000,
}

/**
 * The HTTP verbs.
 */
export enum Method {
  Get = 'get',
  Post = 'post',
  Put = 'put',
  Delete = 'delete',
  Patch = 'patch',
}

/**
 * The response transform function type.
 */
export type ResponseTransform<T, S = unknown> = {
  (data: S): T;
};

/**
 * A generic dictionary type.
 */
export type Dictionary<T = string> = Record<string, T>;

/**
 * The retry delay function type.
 */
export type RetryDelayFunction = (attempt: number) => number;

/**
 * The authentication types.
 */
export const AuthenticationTypes = {
  Basic: 'Basic',
  Bearer: 'Bearer',
} as const;
export type AuthenticationType =
  (typeof AuthenticationTypes)[keyof typeof AuthenticationTypes];

/**
 * The performance callback function type.
 */
export type PerformanceCallback = (
  time: number,
  status: number,
  attempt: number
) => void;

/**
 * The request configuration type.
 */
export type RequestConfig = RequestInit & { url: URL };
