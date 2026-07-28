import { useApiError } from '../../api/hooks';
import {
  useGetFixturesByGameweekQuery,
  useGetFixturesQuery,
  useGetUpcomingFixturesQuery,
} from '../api';

/**
 * Hook for getting every fixture in the season.
 *
 * @returns the fixtures, loading state and any error.
 */
export const useGetFixtures = () => {
  const { data, isLoading, error } = useGetFixturesQuery();

  return { fixtures: data ?? [], isLoading, error: useApiError(error) };
};

/**
 * Hook for getting the fixtures in a gameweek.
 *
 * @param gw - the gameweek number, or undefined to skip the request.
 *
 * @returns the fixtures, loading state and any error.
 */
export const useGetFixturesByGameweek = (gw?: number) => {
  const { data, isLoading, error } = useGetFixturesByGameweekQuery(
    { gw: gw as number },
    { skip: gw === undefined }
  );

  return { fixtures: data ?? [], isLoading, error: useApiError(error) };
};

/**
 * Hook for getting a club's next fixtures.
 *
 * @param teamId - the team id, or undefined to skip the request.
 * @param count - how many upcoming fixtures to return.
 *
 * @returns the fixtures, loading state and any error.
 */
export const useGetUpcomingFixtures = (teamId?: number, count = 5) => {
  const { data, isLoading, error } = useGetUpcomingFixturesQuery(
    { teamId: teamId as number, count },
    { skip: teamId === undefined }
  );

  return { fixtures: data ?? [], isLoading, error: useApiError(error) };
};
