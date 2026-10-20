import {
  ProcessedPlayer,
  SquadHorizon,
  STARTING_SIZE,
  SQUAD_RULES,
} from '@fpl/contracts/fpl';

import { SavedPick } from '../../../features/squad/hooks';

type PlayersMap = Record<number, ProcessedPlayer>;

/** Value used in place of a missing player value when ranking starters. */
const MISSING_VALUE = -999999;

/**
 * All legal starting formations (e.g. "4-4-2"), derived from SQUAD_RULES and
 * STARTING_SIZE.
 */
const buildLegalFormations = (): string[] => {
  const list: string[] = [];
  const gkRule = SQUAD_RULES[1];
  const defRule = SQUAD_RULES[2];
  const midRule = SQUAD_RULES[3];
  const fwdRule = SQUAD_RULES[4];

  if (!gkRule || !defRule || !midRule || !fwdRule) return ['4-4-2'];

  for (let def = defRule.minStart; def <= defRule.maxStart; def++) {
    for (let mid = midRule.minStart; mid <= midRule.maxStart; mid++) {
      for (let fwd = fwdRule.minStart; fwd <= fwdRule.maxStart; fwd++) {
        if (gkRule.minStart + def + mid + fwd === STARTING_SIZE) {
          list.push(`${def}-${mid}-${fwd}`);
        }
      }
    }
  }
  return list;
};

export const LEGAL_FORMATIONS: string[] = buildLegalFormations();

/** Number of starters per position (1 = GK .. 4 = FWD) for a formation string. */
export const getFormationTargets = (
  formation: string
): Record<number, number> => {
  const parts = (formation || '4-4-2').split('-').map(Number);
  return {
    1: 1,
    2: parts[0] || 4,
    3: parts[1] || 4,
    4: parts[2] || 2,
  };
};

/** The formation string (e.g. "4-4-2") formed by the current starters. */
export const getStartingFormation = (
  picks: SavedPick[],
  playersMap: PlayersMap
): string => {
  const def = picks.filter(
    (p) => playersMap[p.id]?.generalInfo.element_type === 2 && p.starting
  ).length;
  const mid = picks.filter(
    (p) => playersMap[p.id]?.generalInfo.element_type === 3 && p.starting
  ).length;
  const fwd = picks.filter(
    (p) => playersMap[p.id]?.generalInfo.element_type === 4 && p.starting
  ).length;
  return `${def}-${mid}-${fwd}`;
};

const groupPicksByPosition = (picks: SavedPick[], playersMap: PlayersMap) => {
  const picksByPos: Record<number, SavedPick[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
  };
  picks.forEach((p) => {
    const player = playersMap[p.id];
    if (player) {
      picksByPos[player.generalInfo.element_type].push(p);
    }
  });
  return picksByPos;
};

/**
 * Re-assigns starters to fit a formation, keeping the captain and current
 * starters first. Makes the first starter captain if no starter is captain.
 */
export const applyFormation = (
  picks: SavedPick[],
  formation: string,
  playersMap: PlayersMap
): SavedPick[] => {
  const targets = getFormationTargets(formation);
  const picksByPos = groupPicksByPosition(picks, playersMap);

  const newPicks: SavedPick[] = [];

  for (let pos = 1; pos <= 4; pos++) {
    const posPicks = picksByPos[pos];
    const target = targets[pos];

    const sorted = [...posPicks].sort((a, b) => {
      if (a.captain && !b.captain) return -1;
      if (!a.captain && b.captain) return 1;
      if (a.starting && !b.starting) return -1;
      if (!a.starting && b.starting) return 1;
      return 0;
    });

    sorted.forEach((pick, index) => {
      const shouldStart = index < target;
      newPicks.push({
        ...pick,
        starting: shouldStart,
        captain: shouldStart ? pick.captain : false,
      });
    });
  }

  const hasCaptain = newPicks.some((p) => p.captain && p.starting);
  if (!hasCaptain) {
    newPicks.forEach((p) => (p.captain = false));
    const firstStarter = newPicks.find((p) => p.starting);
    if (firstStarter) {
      firstStarter.captain = true;
    }
  }

  return newPicks;
};

/**
 * Picks the legal formation and starting XI with the highest total value on
 * the given horizon, and makes the highest-value starter captain.
 */
export const optimizeLineup = (
  picks: SavedPick[],
  playersMap: PlayersMap,
  horizon: SquadHorizon
): { formation: string; picks: SavedPick[] } => {
  let bestFormation = '4-4-2';
  let bestTotalValue = -Infinity;
  let bestStartersIds = new Set<number>();

  const picksByPos = groupPicksByPosition(picks, playersMap);

  const sortedPicksByPos: Record<number, SavedPick[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
  };
  for (let pos = 1; pos <= 4; pos++) {
    sortedPicksByPos[pos] = [...picksByPos[pos]].sort((a, b) => {
      const playerA = playersMap[a.id];
      const playerB = playersMap[b.id];
      const valA = playerA ? playerA.playerValue[horizon] : null;
      const valB = playerB ? playerB.playerValue[horizon] : null;

      const numA = valA !== null ? valA : MISSING_VALUE;
      const numB = valB !== null ? valB : MISSING_VALUE;

      if (numA !== numB) {
        return numB - numA;
      }
      return a.id - b.id;
    });
  }

  LEGAL_FORMATIONS.forEach((formStr) => {
    const targets = getFormationTargets(formStr);

    let currentTotalValue = 0;
    const currentStarters = new Set<number>();

    for (let pos = 1; pos <= 4; pos++) {
      const posPicks = sortedPicksByPos[pos];
      const target = targets[pos];

      const selected = posPicks.slice(0, target);
      for (const p of selected) {
        currentStarters.add(p.id);
        const player = playersMap[p.id];
        const val = player ? player.playerValue[horizon] : null;
        currentTotalValue += val !== null ? val : MISSING_VALUE;
      }

      const missingCount = target - selected.length;
      if (missingCount > 0) {
        currentTotalValue += missingCount * MISSING_VALUE;
      }
    }

    if (currentTotalValue > bestTotalValue) {
      bestTotalValue = currentTotalValue;
      bestFormation = formStr;
      bestStartersIds = currentStarters;
    }
  });

  let highestValueStarterId: number | null = null;
  let highestStarterValue = -Infinity;

  const newPicks = picks.map((p) => {
    const isStarter = bestStartersIds.has(p.id);

    if (isStarter) {
      const player = playersMap[p.id];
      const val = player ? player.playerValue[horizon] : null;
      const numVal = val !== null ? val : MISSING_VALUE;
      if (numVal > highestStarterValue) {
        highestStarterValue = numVal;
        highestValueStarterId = p.id;
      }
    }

    return {
      ...p,
      starting: isStarter,
      captain: false,
    };
  });

  if (highestValueStarterId !== null) {
    const capPick = newPicks.find((p) => p.id === highestValueStarterId);
    if (capPick) {
      capPick.captain = true;
    }
  } else {
    const firstStarter = newPicks.find((p) => p.starting);
    if (firstStarter) {
      firstStarter.captain = true;
    }
  }

  return { formation: bestFormation, picks: newPicks };
};
