import { useApiError } from '../../api/hooks';
import {
  useGetCurrentGameweekQuery,
  useGetGameweekQuery,
  useGetGameweeksQuery,
} from '../api';

/**
 * Hook for getting every gameweek in the season.
 *
 * @returns the gameweeks keyed by id, loading state and any error.
 */
export const useGetGameweeks = () => {
  const { data, isLoading, error } = useGetGameweeksQuery();

  return { gameweeks: data, isLoading, error: useApiError(error) };
};

/**
 * Hook for getting the current gameweek.
 *
 * This is the first unfinished gameweek, so during preseason it is gameweek 1.
 *
 * @returns the current gameweek, loading state and any error.
 */
export const useGetCurrentGameweek = () => {
  const { data, isLoading, error } = useGetCurrentGameweekQuery();

  return { gameweek: data, isLoading, error: useApiError(error) };
};

/**
 * Hook for getting a specific gameweek.
 *
 * @param id - the gameweek id, or undefined to skip the request.
 *
 * @returns the gameweek, loading state and any error.
 */
export const useGetGameweek = (id?: number) => {
  const { data, isLoading, error } = useGetGameweekQuery(
    { id: id as number },
    { skip: id === undefined }
  );

  return { gameweek: data, isLoading, error: useApiError(error) };
};
