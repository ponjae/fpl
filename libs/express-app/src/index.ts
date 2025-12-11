import { ApplicationError } from './lib';

export * from './lib';

/**
 * Create a new application error. Can be used directly or overloaded and typed.
 *
 * @param msg - the message of the error.
 * @param status - the status of the error.
 * @param errorType - the error type.
 * @param cause - the cause of the error (original error).
 *
 * @returns the application error.
 */
export const toApplicationError = <T extends string>(
  msg: string,
  status: number,
  errorType?: T,
  cause?: unknown
) => new ApplicationError(msg, status, { errorType, cause });
