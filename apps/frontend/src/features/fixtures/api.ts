import { FixtureEntry } from '@fpl/contracts/fpl';
import { Routes } from '@fpl/contracts/self-service';
import { toPath } from '@fpl/utils';
import { api } from '../api';
import { GameweekArg, UpcomingFixturesArg } from '../api/types';

export const fixturesApi = api.injectEndpoints({
  endpoints: (build) => ({
    getFixtures: build.query<FixtureEntry[], void>({
      query: () => Routes.Fixtures,
      providesTags: [{ type: 'fixture', id: 'all' }],
    }),
    getFixturesByGameweek: build.query<FixtureEntry[], GameweekArg>({
      query: ({ gw }) => toPath(Routes.FixturesByGameweek, { gw }),
      providesTags: (_r, _e, { gw }) => [{ type: 'fixture', id: gw }],
    }),
    getUpcomingFixtures: build.query<FixtureEntry[], UpcomingFixturesArg>({
      query: ({ teamId, count }) =>
        toPath(Routes.UpcomingFixturesByTeam, { teamId, count }),
      providesTags: [{ type: 'fixture', id: 'upcoming' }],
    }),
  }),
});

export const {
  useGetFixturesQuery,
  useGetFixturesByGameweekQuery,
  useGetUpcomingFixturesQuery,
} = fixturesApi;
