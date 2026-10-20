import { useMemo } from 'react';
import { ProcessedPlayer } from '@fpl/contracts/fpl';

import { useGetPlayers } from '../../../features/players/hooks';

/** Loads every player and exposes them both by id and as a flat list. */
export const useSquadPlayers = () => {
  const { players: groupedPlayers, isLoading, error } = useGetPlayers();

  const playersMap = useMemo<Record<number, ProcessedPlayer>>(() => {
    if (!groupedPlayers || !groupedPlayers.byId) return {};
    return groupedPlayers.byId;
  }, [groupedPlayers]);

  const allPlayers = useMemo<ProcessedPlayer[]>(() => {
    return Object.values(playersMap);
  }, [playersMap]);

  return { groupedPlayers, playersMap, allPlayers, isLoading, error };
};
