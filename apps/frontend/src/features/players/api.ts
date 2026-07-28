import { GroupedPlayers, ProcessedPlayer } from '@fpl/contracts/fpl';
import { Routes } from '@fpl/contracts/self-service';
import { toPath } from '@fpl/utils';
import { api } from '../api';
import { IdArg, PositionArg, TeamIdArg, TopPlayersArg } from '../api/types';

export const playersApi = api.injectEndpoints({
  endpoints: (build) => ({
    getPlayers: build.query<GroupedPlayers, void>({
      query: () => Routes.Players,
      providesTags: [{ type: 'player', id: 'all' }],
    }),
    getPlayer: build.query<ProcessedPlayer, IdArg>({
      query: ({ id }) => toPath(Routes.Player, { id }),
      providesTags: (_r, _e, { id }) => [{ type: 'player', id }],
    }),
    getPlayersByTeam: build.query<ProcessedPlayer[], TeamIdArg>({
      query: ({ teamId }) => toPath(Routes.PlayersByTeam, { teamId }),
      providesTags: [{ type: 'player', id: 'all' }],
    }),
    getPlayersByPosition: build.query<ProcessedPlayer[], PositionArg>({
      query: ({ position }) => toPath(Routes.PlayersByPosition, { position }),
      providesTags: [{ type: 'player', id: 'all' }],
    }),
    getTopPlayers: build.query<ProcessedPlayer[], TopPlayersArg>({
      query: ({ sortKey, limit = 10, direction = 'desc' }) => ({
        url: Routes.TopPlayers,
        params: { sortKey, limit, direction },
      }),
      providesTags: [{ type: 'player', id: 'top' }],
    }),
  }),
});

export const {
  useGetPlayersQuery,
  useGetPlayerQuery,
  useGetPlayersByTeamQuery,
  useGetPlayersByPositionQuery,
  useGetTopPlayersQuery,
  useLazyGetPlayerQuery,
  useLazyGetTopPlayersQuery,
} = playersApi;
