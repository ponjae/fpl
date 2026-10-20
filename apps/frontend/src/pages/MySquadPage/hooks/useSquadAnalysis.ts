import { useState } from 'react';
import { SquadHorizon } from '@fpl/contracts/fpl';

import { SavedPick } from '../../../features/squad/hooks';
import { useGetUnderPerformers } from '../../../features/transfers/hooks';

/**
 * Underperformance analysis. Runs only when the user asks for it, and stays
 * visible until something about the squad changes.
 */
export const useSquadAnalysis = (
  picks: SavedPick[],
  horizon: SquadHorizon,
  isSquadValid: boolean
) => {
  const [analysisActive, setAnalysisActive] = useState(false);

  const {
    check: checkUnderPerformers,
    underPerformers,
    isLoading,
    error,
  } = useGetUnderPerformers();

  const triggerAnalyze = () => {
    if (!isSquadValid) return;
    const playerIds = picks.map((p) => p.id);
    checkUnderPerformers(playerIds, horizon);
    setAnalysisActive(true);
  };

  return {
    analysisActive,
    setAnalysisActive,
    underPerformers,
    isLoading,
    error,
    triggerAnalyze,
  };
};
