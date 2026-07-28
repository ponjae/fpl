import { GameweekData, GameweekDataEntry } from '@fpl/contracts/fpl';
import { Routes } from '@fpl/contracts/self-service';
import { toPath } from '@fpl/utils';
import { api } from '../api';
import { IdArg } from '../api/types';

export const gameweeksApi = api.injectEndpoints({
  endpoints: (build) => ({
    getGameweeks: build.query<GameweekData, void>({
      query: () => Routes.Gameweeks,
      providesTags: [{ type: 'gameweek', id: 'all' }],
    }),
    getCurrentGameweek: build.query<GameweekDataEntry, void>({
      query: () => Routes.CurrentGameweek,
      providesTags: [{ type: 'gameweek', id: 'current' }],
    }),
    getGameweek: build.query<GameweekDataEntry, IdArg>({
      query: ({ id }) => toPath(Routes.Gameweek, { id }),
      providesTags: (_r, _e, { id }) => [{ type: 'gameweek', id }],
    }),
  }),
});

export const {
  useGetGameweeksQuery,
  useGetCurrentGameweekQuery,
  useGetGameweekQuery,
} = gameweeksApi;
