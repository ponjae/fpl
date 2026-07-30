import { useApiError } from '../../api/hooks';
import { useGetTeamNamesQuery, useGetTeamQuery, useGetTeamsQuery } from '../api';

/**
 * Hook for getting every Premier League club.
 *
 * @returns the teams keyed by name, loading state and any error.
 */
export const useGetTeams = () => {
  const { data, isLoading, error } = useGetTeamsQuery();

  return { teams: data, isLoading, error: useApiError(error) };
};

/**
 * Hook for getting a mapping of team id → team name.
 *
 * Useful for resolving numeric team ids from fixture data to human-readable
 * names. Returns an empty object when data has not yet loaded.
 *
 * @returns the id→name map, loading state and any error.
 */
export const useGetTeamNames = () => {
  const { data, isLoading, error } = useGetTeamNamesQuery();

  return { teamNamesById: data ?? {}, isLoading, error: useApiError(error) };
};

/**
 * Hook for getting a single club.
 *
 * @param id - the team id, or undefined to skip the request.
 *
 * @returns the team, loading state and any error.
 */
export const useGetTeam = (id?: number) => {
  const { data, isLoading, error } = useGetTeamQuery(
    { id: id as number },
    { skip: id === undefined }
  );

  return { team: data, isLoading, error: useApiError(error) };
};
