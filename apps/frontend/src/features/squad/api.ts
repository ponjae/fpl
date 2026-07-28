import { OptimalSquad, OptimizeSquadOptions } from '@fpl/contracts/fpl';
import { Routes } from '@fpl/contracts/self-service';
import { api } from '../api';
import { OptimalSquadArg } from '../api/types';

export const squadApi = api.injectEndpoints({
  endpoints: (build) => ({
    getOptimalSquad: build.query<OptimalSquad, OptimalSquadArg>({
      query: ({ horizon = 'value5', budget = 100 }) => ({
        url: Routes.OptimalSquad,
        params: { horizon, budget },
      }),
      providesTags: [{ type: 'squad', id: 'optimal' }],
    }),
    optimizeSquad: build.mutation<OptimalSquad, OptimizeSquadOptions>({
      query: (body) => ({
        url: Routes.OptimizeSquad,
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useGetOptimalSquadQuery,
  useLazyGetOptimalSquadQuery,
  useOptimizeSquadMutation,
} = squadApi;
