import { SerializedError } from '@reduxjs/toolkit';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { ApiErrorBody } from './types';

/**
 * Narrow an RTK Query error into the backend's error body shape.
 *
 * RTK surfaces two very different error shapes — transport/HTTP errors and
 * serialised runtime errors — so this normalises them into one thing the UI
 * can branch on.
 *
 * @param error - the error produced by a query or mutation.
 *
 * @returns the normalised error body, or undefined when there is no error.
 */
export const toApiErrorBody = (
  error: FetchBaseQueryError | SerializedError | undefined
): ApiErrorBody | undefined => {
  if (!error) {
    return undefined;
  }

  if ('status' in error) {
    const status = typeof error.status === 'number' ? error.status : 0;
    const data = error.data as Partial<ApiErrorBody> | undefined;

    return {
      status,
      type: data?.type,
      message: data?.message,
    };
  }

  return { status: 0, message: error.message };
};

/**
 * Check whether an error represents a missing resource.
 *
 * @param error - the normalised error body.
 *
 * @returns true when the backend responded 404.
 */
export const isNotFound = (error: ApiErrorBody | undefined): boolean =>
  error?.status === 404;
