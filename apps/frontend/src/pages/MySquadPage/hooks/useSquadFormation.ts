import { useEffect, useMemo, useState } from 'react';
import { ProcessedPlayer } from '@fpl/contracts/fpl';

import { SavedPick } from '../../../features/squad/hooks';
import {
  LEGAL_FORMATIONS,
  getFormationTargets,
  getStartingFormation,
} from '../utils/formation';

/**
 * Holds the formation chosen in the settings card and keeps it in sync with
 * the saved starting XI.
 */
export const useSquadFormation = (
  picks: SavedPick[],
  playersMap: Record<number, ProcessedPlayer>,
  isStorageLoaded: boolean
) => {
  const [selectedFormation, setSelectedFormation] = useState<string>('4-4-2');

  const formationTargets = useMemo(
    () => getFormationTargets(selectedFormation),
    [selectedFormation]
  );

  // Sync selected formation from saved picks if they represent a valid starting XI shape
  useEffect(() => {
    if (isStorageLoaded && picks.length > 0) {
      const currentForm = getStartingFormation(picks, playersMap);
      if (LEGAL_FORMATIONS.includes(currentForm)) {
        setSelectedFormation(currentForm);
      }
    }
  }, [isStorageLoaded, picks, playersMap]);

  // The formation formed by the current starters (e.g. 4-4-2), shown on the pitch
  const activeFormationString = useMemo(() => {
    if (picks.length === 0) return '';
    return getStartingFormation(picks, playersMap);
  }, [picks, playersMap]);

  return {
    selectedFormation,
    setSelectedFormation,
    formationTargets,
    activeFormationString,
  };
};
