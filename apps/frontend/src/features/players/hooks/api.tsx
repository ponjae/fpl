import { PlayerSortKey, SortDirection } from '@fpl/contracts/fpl';
import { useApiError } from '../../api/hooks';
import {
  useGetPlayerQuery,
  useGetPlayersByPositionQuery,
  useGetPlayersByTeamQuery,
  useGetPlayersQuery,
  useGetTopPlayersQuery,
} from '../api';

/**
 * Hook for getting all players, grouped by team, position and id.
 *
 * @returns the grouped players, loading state and any error.
 */
export const useGetPlayers = () => {
  const { data, isLoading, error } = useGetPlayersQuery();

  return { players: data, isLoading, error: useApiError(error) };
};

/**
 * Hook for getting a single player.
 *
 * @param id - the player id, or undefined to skip the request.
 *
 * @returns the player, loading state and any error.
 */
export const useGetPlayer = (id?: number) => {
  const { data, isLoading, error } = useGetPlayerQuery(
    { id: id as number },
    { skip: id === undefined }
  );

  return { player: data, isLoading, error: useApiError(error) };
};

/**
 * Hook for getting every player at a club.
 *
 * @param teamId - the team id, or undefined to skip the request.
 *
 * @returns the players, loading state and any error.
 */
export const useGetPlayersByTeam = (teamId?: number) => {
  const { data, isLoading, error } = useGetPlayersByTeamQuery(
    { teamId: teamId as number },
    { skip: teamId === undefined }
  );

  return { players: data ?? [], isLoading, error: useApiError(error) };
};

/**
 * Hook for getting every player in a position.
 *
 * Accepts singular or plural, any casing — the backend normalises it.
 *
 * @param position - the position name, or undefined to skip the request.
 *
 * @returns the players, loading state and any error.
 */
export const useGetPlayersByPosition = (position?: string) => {
  const { data, isLoading, error } = useGetPlayersByPositionQuery(
    { position: position as string },
    { skip: !position }
  );

  return { players: data ?? [], isLoading, error: useApiError(error) };
};

/**
 * Hook for ranking players by a numeric field.
 *
 * Players with no value for the chosen key (no fixtures in that horizon) are
 * ranked last by the backend rather than treated as zero.
 *
 * @param sortKey - the field to rank by.
 * @param limit - how many players to return.
 * @param direction - sort direction.
 *
 * @returns the ranked players, loading state and any error.
 */
export const useGetTopPlayers = (
  sortKey: PlayerSortKey,
  limit = 10,
  direction: SortDirection = 'desc'
) => {
  const { data, isLoading, error } = useGetTopPlayersQuery({
    sortKey,
    limit,
    direction,
  });

  return { players: data ?? [], isLoading, error: useApiError(error) };
};
