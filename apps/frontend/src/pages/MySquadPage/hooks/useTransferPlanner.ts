import { useEffect, useState } from 'react';
import { SquadHorizon, SQUAD_SIZE } from '@fpl/contracts/fpl';

import { buildTransferPlanRequest } from '../../../features/squad/freeTransfers';
import { SavedPick } from '../../../features/squad/hooks';
import { useTransferPlan } from '../../../features/transfers/hooks';

type UseTransferPlannerParams = {
  picks: SavedPick[];
  horizon: SquadHorizon;
  budget: number;
  bank: number;
  freeTransfers: number;
  isSquadValid: boolean;
};

/**
 * Joint transfer planning. The plan is requested only from the user's click,
 * and hidden as soon as the squad or the planner inputs change.
 */
export const useTransferPlanner = ({
  picks,
  horizon,
  budget,
  bank,
  freeTransfers,
  isSquadValid,
}: UseTransferPlannerParams) => {
  const [planActive, setPlanActive] = useState(false);

  const {
    plan: requestTransferPlan,
    transferPlan,
    isLoading,
    error,
  } = useTransferPlan();

  // Fires only from the user's click — never from an effect.
  const triggerPlanTransfers = () => {
    if (!isSquadValid || picks.length !== SQUAD_SIZE) return;
    requestTransferPlan(
      buildTransferPlanRequest(picks, bank, freeTransfers, horizon)
    );
    setPlanActive(true);
  };

  // Any change to the squad or the planner inputs makes an existing plan stale,
  // so hide it rather than let it contradict what is on the pitch.
  useEffect(() => {
    setPlanActive(false);
  }, [picks, horizon, budget, bank, freeTransfers]);

  return {
    planActive,
    setPlanActive,
    transferPlan,
    isLoading,
    error,
    triggerPlanTransfers,
  };
};
