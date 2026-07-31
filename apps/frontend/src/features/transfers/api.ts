import {
  SquadHorizon,
  TransferSuggestion,
  UnderPerformer,
  TransferPlanRequest,
  TransferPlan,
} from '@fpl/contracts/fpl';
import { Routes } from '@fpl/contracts/self-service';
import { api } from '../api';

type SuggestArg = {
  playerOutId: number;
  budget?: number;
  horizon?: SquadHorizon;
  limit?: number;
};

type UnderPerformersArg = {
  playerIds: number[];
  horizon?: SquadHorizon;
};

export const transfersApi = api.injectEndpoints({
  endpoints: (build) => ({
    // POST rather than GET: the request carries squad context in the body.
    suggestTransfers: build.mutation<TransferSuggestion[], SuggestArg>({
      query: (body) => ({
        url: Routes.TransferSuggestions,
        method: 'POST',
        body,
      }),
    }),
    getUnderPerformers: build.mutation<UnderPerformer[], UnderPerformersArg>({
      query: (body) => ({
        url: Routes.UnderPerformers,
        method: 'POST',
        body,
      }),
    }),
    planTransfers: build.mutation<TransferPlan, TransferPlanRequest>({
      query: (body) => ({
        url: Routes.TransferPlan,
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useSuggestTransfersMutation,
  useGetUnderPerformersMutation,
  usePlanTransfersMutation,
} = transfersApi;
