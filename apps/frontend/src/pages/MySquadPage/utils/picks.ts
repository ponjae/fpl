import { ProcessedPlayer, SQUAD_RULES, UnderPerformer } from '@fpl/contracts/fpl';

import { SquadPitchPick } from '../../../components/SquadPitchView';
import { SavedPick } from '../../../features/squad/hooks';

type PlayersMap = Record<number, ProcessedPlayer>;

/** A pick as returned by the backend (optimal squad or transfer plan). */
type ResolvedPick = {
  player: ProcessedPlayer;
  starting: boolean;
  captain: boolean;
};

export const getUnderPerformerIds = (underPerformers: UnderPerformer[]): Set<number> =>
  new Set(underPerformers.map((u) => u.player.generalInfo.id));

/** Maps backend picks to the shape that is saved locally. */
export const toSavedPicks = (resolved: ResolvedPick[]): SavedPick[] =>
  resolved.map((p) => ({
    id: p.player.generalInfo.id,
    starting: p.starting,
    captain: p.captain,
  }));

/**
 * Builds the 15 visual pitch slots: picked players grouped by position with
 * starters first, then empty placeholders. During an analysis, underperformers
 * are flagged through their status.
 */
export const buildVisualPicks = (
  picks: SavedPick[],
  playersMap: PlayersMap,
  analysisActive: boolean,
  underPerformers: UnderPerformer[],
  formationTargets: Record<number, number>
): SquadPitchPick[] => {
  const list: SquadPitchPick[] = [];
  const underPerformerIds = getUnderPerformerIds(underPerformers);

  // Group active picks by position
  const activeByPos: Record<number, SavedPick[]> = { 1: [], 2: [], 3: [], 4: [] };
  picks.forEach((p) => {
    const player = playersMap[p.id];
    if (player) {
      activeByPos[player.generalInfo.element_type].push(p);
    }
  });

  // Populate positions
  for (let pos = 1; pos <= 4; pos++) {
    const rule = SQUAD_RULES[pos];
    const active = activeByPos[pos];

    // Sort active: starters first
    const sortedActive = [...active].sort((a, b) => {
      if (a.starting && !b.starting) return -1;
      if (!a.starting && b.starting) return 1;
      return 0;
    });

    // Total slots for this position is rule.squad
    for (let i = 0; i < rule.squad; i++) {
      if (i < sortedActive.length) {
        const activePick = sortedActive[i];
        const player = playersMap[activePick.id];

        // If analysis is active and player is underperforming, flag them by changing status!
        let finalPlayer = player;
        if (analysisActive && player && underPerformerIds.has(player.generalInfo.id)) {
          // Shallow clone player to flag their status
          finalPlayer = {
            ...player,
            generalInfo: {
              ...player.generalInfo,
              status: 'underperforming', // any value !== 'a' flags it
            },
          };
        }

        list.push({
          player: finalPlayer,
          starting: activePick.starting,
          captain: activePick.captain,
        });
      } else {
        // Empty slot placeholder
        // Determine if this empty slot should be starting or bench based on target counts
        const targetStarters = formationTargets[pos] || 0;
        const activeStartersCount = active.filter((p) => p.starting).length;

        // If we have fewer active starters than target, make this empty slot a starter
        const isStartingSlot = activeStartersCount + list.filter(p => p.player === null && p.elementType === pos && p.starting).length < targetStarters;

        list.push({
          player: null,
          starting: isStartingSlot,
          captain: false,
          elementType: pos,
        });
      }
    }
  }

  return list;
};

/**
 * Adds a player, or replaces the pick at `replaceIndex`. A new player starts
 * when their position has fewer starters than the formation needs; a
 * replacement keeps the replaced pick's starting and captain flags.
 */
export const addPlayerToPicks = (
  picks: SavedPick[],
  player: ProcessedPlayer,
  replaceIndex: number | null,
  formationTargets: Record<number, number>,
  playersMap: PlayersMap
): SavedPick[] => {
  const id = player.generalInfo.id;
  const pos = player.generalInfo.element_type;

  // Determine if player should be starting or bench based on current formation targets
  const targetStarters = formationTargets[pos] || 0;
  const currentStarters = picks.filter((p) => playersMap[p.id]?.generalInfo.element_type === pos && p.starting).length;
  const shouldStart = currentStarters < targetStarters;

  const newPick: SavedPick = {
    id,
    starting: shouldStart,
    captain: false,
  };

  const newPicks = [...picks];
  if (replaceIndex !== null) {
    // Replace a specific player
    const oldPick = picks[replaceIndex];
    newPicks[replaceIndex] = {
      ...newPick,
      starting: oldPick ? oldPick.starting : shouldStart,
      captain: oldPick ? oldPick.captain : false,
    };
  } else {
    newPicks.push(newPick);
  }
  return newPicks;
};

/** Removes a pick. If it was the captain, the first starter becomes captain. */
export const removePick = (picks: SavedPick[], id: number): SavedPick[] => {
  const removedPick = picks.find((p) => p.id === id);
  const newPicks = picks.filter((p) => p.id !== id);

  // If we removed the captain, assign a new captain if possible
  if (removedPick?.captain && newPicks.length > 0) {
    const firstStarter = newPicks.find(p => p.starting);
    if (firstStarter) {
      firstStarter.captain = true;
    }
  }

  return newPicks;
};

/** Moves a player between the starting XI and the bench. */
export const toggleStartingPick = (picks: SavedPick[], id: number): SavedPick[] =>
  picks.map((p) => {
    if (p.id === id) {
      const nextStarting = !p.starting;
      return {
        ...p,
        starting: nextStarting,
        captain: nextStarting ? p.captain : false, // Can't be captain if on bench
      };
    }
    return p;
  });

/** Makes one player captain and strips the armband from everyone else. */
export const makeCaptainPick = (picks: SavedPick[], id: number): SavedPick[] =>
  picks.map((p) => ({
    ...p,
    captain: p.id === id,
  }));

/**
 * Swaps the pick at `index` for another player, keeping its starting and
 * captain flags.
 */
export const swapPickAt = (picks: SavedPick[], index: number, playerInId: number): SavedPick[] => {
  const oldPick = picks[index];
  const newPicks = [...picks];
  newPicks[index] = {
    id: playerInId,
    starting: oldPick.starting,
    captain: oldPick.captain,
  };
  return newPicks;
};

/**
 * Applies a selling price typed by the user. A blank value clears it.
 * Returns null when the input should be ignored.
 */
export const setPickSellingPrice = (
  picks: SavedPick[],
  playerId: number,
  raw: string
): SavedPick[] | null => {
  if (raw.trim() === '') {
    return picks.map((p) => {
      if (p.id !== playerId) return p;
      const { sellingPrice: _removed, ...rest } = p;
      return rest as typeof p;
    });
  }
  const val = parseFloat(raw);
  if (isNaN(val) || val <= 0) return null;
  const clamped = parseFloat(Math.max(0.1, Math.min(20, val)).toFixed(1));
  return picks.map((p) =>
    p.id === playerId ? { ...p, sellingPrice: clamped } : p
  );
};

export const clearSellingPrices = (picks: SavedPick[]): SavedPick[] =>
  picks.map(({ sellingPrice: _sp, ...rest }) => rest as SavedPick);

/** Current price of the player being replaced in the picker, or 0. */
export const getReplacedPlayerPrice = (
  picks: SavedPick[],
  replaceIndex: number | null,
  playersMap: PlayersMap
): number =>
  replaceIndex !== null && picks[replaceIndex]
    ? (playersMap[picks[replaceIndex].id]?.generalInfo.now_cost || 0)
    : 0;
