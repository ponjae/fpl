import { useEffect, useMemo, useState } from 'react';
import { SerializedError } from '@reduxjs/toolkit';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { FplError } from './fpl-error';
import { toApiErrorBody } from './utils';

/**
 * Hook for reading a normalised api error.
 *
 * @param error - the error received from a query or mutation.
 *
 * @returns the normalised error body, or undefined when there is no error.
 */
export const useApiError = (
  error: FetchBaseQueryError | SerializedError | undefined
) => useMemo(() => toApiErrorBody(error), [error]);

/**
 * Options for the error limit guard.
 */
type ErrorOptions = {
  limit: number;
};

/**
 * Hook that escalates to an error boundary after repeated failures.
 *
 * A single transient failure is usually worth retrying silently; a sustained
 * one means the page cannot render meaningfully, so it throws rather than
 * leaving the UI in a permanently empty state.
 *
 * @param isError - whether the current request is in an error state.
 * @param initOptions - the guard options.
 */
export const useErrorLimitGuard = (
  isError: boolean,
  initOptions: ErrorOptions = { limit: 3 }
) => {
  const [options] = useState(initOptions);
  const [failCount, setFailCount] = useState(0);

  useEffect(() => {
    if (isError) {
      setFailCount((prev) => prev + 1);
    }
  }, [isError]);

  useEffect(() => {
    if (failCount >= options.limit) {
      throw new FplError();
    }
  }, [failCount, options]);
};
