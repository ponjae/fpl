import { TeamData, TeamDataDict, TeamNamesById } from '@fpl/contracts/fpl';
import { Routes } from '@fpl/contracts/self-service';
import { toPath } from '@fpl/utils';
import { api } from '../api';
import { IdArg } from '../api/types';

export const teamsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getTeams: build.query<TeamDataDict, void>({
      query: () => Routes.Teams,
      providesTags: [{ type: 'team', id: 'all' }],
    }),
    getTeamNames: build.query<TeamNamesById, void>({
      query: () => Routes.TeamNames,
      providesTags: [{ type: 'team', id: 'names' }],
    }),
    getTeam: build.query<TeamData, IdArg>({
      query: ({ id }) => toPath(Routes.Team, { id }),
      providesTags: (_r, _e, { id }) => [{ type: 'team', id }],
    }),
  }),
});

export const {
  useGetTeamsQuery,
  useGetTeamNamesQuery,
  useGetTeamQuery,
  useLazyGetTeamQuery,
} = teamsApi;
