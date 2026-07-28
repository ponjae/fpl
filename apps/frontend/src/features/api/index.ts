import { BasePath } from '@fpl/contracts/self-service';
import { createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react';

/**
 * The shared RTK Query api slice.
 *
 * Feature folders extend this via `api.injectEndpoints`, keeping each domain's
 * endpoints colocated with the feature that owns them while sharing a single
 * cache, middleware chain and reducer.
 *
 * `BasePath` is `/api`, which the Vite dev server proxies to the backend on
 * port 3001 (see apps/frontend/vite.config.ts), so no CORS handling is needed.
 */
const baseQueryWithRetry = retry(
  fetchBaseQuery({
    baseUrl: BasePath,
    prepareHeaders(headers) {
      headers.set('Cache-Control', 'no-cache');
      return headers;
    },
  }),
  { maxRetries: 1 }
);

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithRetry,
  tagTypes: [
    'player',
    'team',
    'fixture',
    'gameweek',
    'squad',
    'transfer',
    'data',
  ],
  endpoints: () => ({}),
});
