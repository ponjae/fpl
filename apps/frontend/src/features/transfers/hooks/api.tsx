import { SquadHorizon, TransferPlanRequest, TransferPlan } from '@fpl/contracts/fpl';
import { useApiError } from '../../api/hooks';
import {
  useGetUnderPerformersMutation,
  useSuggestTransfersMutation,
  usePlanTransfersMutation,
} from '../api';
import { ApiErrorBody } from '../../api/types';

/**
 * Hook for suggesting replacements for a player.
 *
 * Candidates are same-position, available, and affordable given the player's
 * sale price plus money in the bank.
 *
 * @returns the suggest function, the suggestions, loading and error state.
 */
export const useSuggestTransfers = () => {
  const [suggest, result] = useSuggestTransfersMutation();

  const run = (
    playerOutId: number,
    budget = 0,
    horizon: SquadHorizon = 'value5',
    limit = 5
  ) => suggest({ playerOutId, budget, horizon, limit });

  return {
    suggest: run,
    suggestions: result.data ?? [],
    isLoading: result.isLoading,
    error: useApiError(result.error),
  };
};

/**
 * Hook for finding underperformers in a squad.
 *
 * Players are ranked against everyone else in their position, worst first.
 *
 * @returns the check function, the underperformers, loading and error state.
 */
export const useGetUnderPerformers = () => {
  const [check, result] = useGetUnderPerformersMutation();

  const run = (playerIds: number[], horizon: SquadHorizon = 'value5') =>
    check({ playerIds, horizon });

  return {
    check: run,
    underPerformers: result.data ?? [],
    isLoading: result.isLoading,
    error: useApiError(result.error),
  };
};

/**
 * Hook for multi-transfer planning.
 *
 * @returns the plan function, the computed transfer plan, loading and error state.
 */
export const useTransferPlan = () => {
  const [planMutation, result] = usePlanTransfersMutation();

  const plan = (req: TransferPlanRequest) => planMutation(req);

  return {
    plan,
    transferPlan: result.data,
    isLoading: result.isLoading,
    error: useApiError(result.error),
  };
};
