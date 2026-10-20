import {
  ProcessedPlayer,
  SQUAD_SIZE,
  STARTING_SIZE,
  MAX_PER_CLUB,
  SQUAD_RULES,
} from '@fpl/contracts/fpl';

import { SavedPick } from '../../../features/squad/hooks';
import { getPositionShortLabel } from '../../../utils';

export type SquadValidation = {
  errors: string[];
  warnings: string[];
  totalCost: number;
  startersCount: number;
  posCounts: Record<number, number>;
  teamCounts: Record<number, number>;
  isValid: boolean;
};

/** Checks the squad against the official FPL rules and the user's budget. */
export const validateSquad = (
  picks: SavedPick[],
  playersMap: Record<number, ProcessedPlayer>,
  teamNamesById: Record<number, string>,
  budget: number
): SquadValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];

  const posCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const teamCounts: Record<number, number> = {};
  let totalCost = 0;
  let startersCount = 0;
  let captainCount = 0;

  picks.forEach((p) => {
    const player = playersMap[p.id];
    if (!player) return;

    posCounts[player.generalInfo.element_type]++;

    const teamId = player.generalInfo.team;
    teamCounts[teamId] = (teamCounts[teamId] || 0) + 1;

    totalCost += player.generalInfo.now_cost;

    if (p.starting) startersCount++;
    if (p.captain) captainCount++;
  });

  // Size check
  if (picks.length < SQUAD_SIZE) {
    warnings.push(`Squad is incomplete: ${picks.length}/${SQUAD_SIZE} players.`);
  } else if (picks.length > SQUAD_SIZE) {
    errors.push(`Squad has too many players: ${picks.length}/${SQUAD_SIZE}.`);
  }

  // Positions check
  Object.entries(SQUAD_RULES).forEach(([posStr, rule]) => {
    const pos = parseInt(posStr, 10);
    const count = posCounts[pos] || 0;
    const label = getPositionShortLabel(pos);
    if (count > rule.squad) {
      errors.push(`Too many ${label}s: ${count}/${rule.squad} selected.`);
    } else if (picks.length === SQUAD_SIZE && count < rule.squad) {
      errors.push(`Incomplete ${label}s: ${count}/${rule.squad} selected.`);
    }
  });

  // Max per club check
  Object.entries(teamCounts).forEach(([teamIdStr, count]) => {
    if (count > MAX_PER_CLUB) {
      const teamId = parseInt(teamIdStr, 10);
      const teamName = teamNamesById[teamId] || `Club ${teamId}`;
      errors.push(`Too many players from ${teamName}: ${count}/${MAX_PER_CLUB} (max is 3).`);
    }
  });

  // Budget check
  if (totalCost > budget) {
    errors.push(`Squad cost (£${totalCost.toFixed(1)}m) exceeds £${budget.toFixed(1)}m budget limit.`);
  }

  // Starters and formation checks
  if (picks.length === SQUAD_SIZE) {
    if (startersCount !== STARTING_SIZE) {
      errors.push(`Starting XI must have exactly 11 players (currently ${startersCount}).`);
    }

    // Formation details
    const startingPosCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    picks.forEach((p) => {
      const player = playersMap[p.id];
      if (player && p.starting) {
        startingPosCounts[player.generalInfo.element_type]++;
      }
    });

    Object.entries(SQUAD_RULES).forEach(([posStr, rule]) => {
      const pos = parseInt(posStr, 10);
      const startCount = startingPosCounts[pos] || 0;
      const label = getPositionShortLabel(pos);
      if (startCount < rule.minStart || startCount > rule.maxStart) {
        errors.push(`Invalid formation: must start between ${rule.minStart} and ${rule.maxStart} ${label}s (currently ${startCount}).`);
      }
    });

    // Captain check
    if (captainCount === 0) {
      errors.push('No captain selected. Please assign one starting player as captain.');
    } else if (captainCount > 1) {
      errors.push('Multiple captains. Choose only one starting player as captain.');
    }
  }

  return {
    errors,
    warnings,
    totalCost,
    startersCount,
    posCounts,
    teamCounts,
    isValid: errors.length === 0 && picks.length === SQUAD_SIZE,
  };
};
