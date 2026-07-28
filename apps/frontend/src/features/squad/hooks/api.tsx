import { OptimizeSquadOptions, SquadHorizon } from '@fpl/contracts/fpl';
import { useApiError } from '../../api/hooks';
import { useGetOptimalSquadQuery, useOptimizeSquadMutation } from '../api';

/**
 * Hook for getting the optimal squad for a budget and horizon.
 *
 * @param horizon - the value horizon to optimise against.
 * @param budget - the budget in millions.
 *
 * @returns the squad, loading state and any error.
 */
export const useGetOptimalSquad = (
  horizon: SquadHorizon = 'value5',
  budget = 100
) => {
  const { data, isLoading, isFetching, error } = useGetOptimalSquadQuery({
    horizon,
    budget,
  });

  return {
    squad: data,
    isLoading: isLoading || isFetching,
    error: useApiError(error),
  };
};

/**
 * Hook for building a squad with custom constraints.
 *
 * Use this rather than `useGetOptimalSquad` when the user supplies locked-in
 * players, exclusions or custom bench weights.
 *
 * @returns the optimise function, the resulting squad, loading and error state.
 */
export const useOptimizeSquad = () => {
  const [optimize, result] = useOptimizeSquadMutation();

  const run = (options: OptimizeSquadOptions) => optimize(options);

  return {
    optimize: run,
    squad: result.data,
    isLoading: result.isLoading,
    isSuccess: result.isSuccess,
    error: useApiError(result.error),
  };
};
