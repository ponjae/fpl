import { useEffect, useState } from 'react';
import { ProcessedPlayer } from '@fpl/contracts/fpl';

import { SavedPick } from '../../../features/squad/hooks';

type UseDroppedPlayersCleanupParams = {
  isStorageLoaded: boolean;
  isPlayersLoading: boolean;
  /** The loaded players payload; the check waits until it is available. */
  groupedPlayers: unknown;
  picks: SavedPick[];
  playersMap: Record<number, ProcessedPlayer>;
  savePicks: (picks: SavedPick[]) => void;
  onRemoved: (message: string) => void;
};

/**
 * Once, after the saved squad and the players have loaded, removes saved
 * picks for players who are no longer in the league.
 */
export const useDroppedPlayersCleanup = ({
  isStorageLoaded,
  isPlayersLoading,
  groupedPlayers,
  picks,
  playersMap,
  savePicks,
  onRemoved,
}: UseDroppedPlayersCleanupParams) => {
  const [checkedDropped, setCheckedDropped] = useState(false);

  useEffect(() => {
    if (isStorageLoaded && !isPlayersLoading && groupedPlayers && !checkedDropped) {
      const validPicks = picks.filter((p) => !!playersMap[p.id]);
      if (validPicks.length < picks.length) {
        const removedCount = picks.length - validPicks.length;
        savePicks(validPicks);
        onRemoved(`Removed ${removedCount} player(s) who are no longer active in the league.`);
      }
      setCheckedDropped(true);
    }
  }, [isStorageLoaded, isPlayersLoading, groupedPlayers, picks, playersMap, savePicks, onRemoved, checkedDropped]);
};
