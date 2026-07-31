import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  ProcessedPlayer,
  SquadHorizon,
  SQUAD_SIZE,
  STARTING_SIZE,
  MAX_PER_CLUB,
  DEFAULT_BUDGET,
  SQUAD_RULES,
} from '@fpl/contracts/fpl';

import { useSquadLocalStorage, SavedPick } from '../../features/squad/hooks';
import { useGetPlayers } from '../../features/players/hooks';
import { useGetTeamNames } from '../../features/teams/hooks';
import {
  useGetUnderPerformers,
  useSuggestTransfers,
  useTransferPlan,
} from '../../features/transfers/hooks';
import { useGetOptimalSquad } from '../../features/squad/hooks/api';

import Button from '../../components/Button';
import PageSection from '../../components/PageSection';
import TeamBadge from '../../components/TeamBadge';
import PositionBadge from '../../components/PositionBadge';
import HorizonTabs from '../../components/HorizonTabs';
import ErrorState from '../../components/ErrorState';
import StatValue from '../../components/StatValue';
import SquadPitchView, { SquadPitchPick } from '../../components/SquadPitchView';

import PlayerPickerModal from '../../features/squad/components/PlayerPickerModal';
import PlayerActionsModal from '../../features/squad/components/PlayerActionsModal';
import TransferSuggestionsModal from '../../features/transfers/components/TransferSuggestionsModal';

import { formatPrice, formatValue, getPositionShortLabel } from '../../utils';
import './index.scss';

export const MySquadPage: React.FC = () => {
  // 1. Local Storage Persistence Hook
  const {
    picks,
    budget,
    freeTransfers,
    bank,
    savePicks,
    saveBudget,
    saveFreeTransfers,
    saveBank,
    clearPicks,
    loaded: isStorageLoaded,
  } = useSquadLocalStorage();

  // 2. State management
  const [currentHorizon, setCurrentHorizon] = useState<SquadHorizon>('value5');
  const [notification, setNotification] = useState<string | null>(null);
  const [analysisActive, setAnalysisActive] = useState(false);
  const [planActive, setPlanActive] = useState(false);
  const [selectedFormation, setSelectedFormation] = useState<string>('4-4-2');

  // Modals / Selection states
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerElementType, setPickerElementType] = useState<number>(1);
  const [pickerReplaceIndex, setPickerReplaceIndex] = useState<number | null>(null);

  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [activePlayer, setActivePlayer] = useState<ProcessedPlayer | null>(null);

  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [suggestPlayerOut, setSuggestPlayerOut] = useState<ProcessedPlayer | null>(null);

  // 3. Fetch players and teams
  const { players: groupedPlayers, isLoading: isPlayersLoading, error: playersError } = useGetPlayers();
  const { teamNamesById, isLoading: isTeamsLoading, error: teamsError } = useGetTeamNames();

  // Fetch optimal squad in background for easy seeding (respects user budget)
  const { squad: optimalSquad } = useGetOptimalSquad(currentHorizon, budget);

  // 4. Mutations hooks (POST on user actions only, no useEffect trigger)
  const {
    check: checkUnderPerformers,
    underPerformers,
    isLoading: isAnalysisLoading,
    error: analysisError,
  } = useGetUnderPerformers();

  const {
    suggest: suggestTransfers,
    suggestions,
    isLoading: isSuggestionsLoading,
    error: suggestionsError,
  } = useSuggestTransfers();

  const {
    plan: requestTransferPlan,
    transferPlan,
    isLoading: isPlanLoading,
    error: planError,
  } = useTransferPlan();

  // 5. Flatten players maps
  const playersMap = useMemo<Record<number, ProcessedPlayer>>(() => {
    if (!groupedPlayers || !groupedPlayers.byId) return {};
    return groupedPlayers.byId;
  }, [groupedPlayers]);

  const allPlayers = useMemo<ProcessedPlayer[]>(() => {
    return Object.values(playersMap);
  }, [playersMap]);

  // Derive legal formations dynamically from SQUAD_RULES and STARTING_SIZE
  const legalFormations = useMemo(() => {
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
  }, []);

  const formationTargets = useMemo(() => {
    const parts = (selectedFormation || '4-4-2').split('-').map(Number);
    const def = parts[0] || 4;
    const mid = parts[1] || 4;
    const fwd = parts[2] || 2;
    return {
      1: 1,
      2: def,
      3: mid,
      4: fwd,
    };
  }, [selectedFormation]);

  // Sync selected formation from saved picks if they represent a valid starting XI shape
  useEffect(() => {
    if (isStorageLoaded && picks.length > 0) {
      const def = picks.filter(p => playersMap[p.id]?.generalInfo.element_type === 2 && p.starting).length;
      const mid = picks.filter(p => playersMap[p.id]?.generalInfo.element_type === 3 && p.starting).length;
      const fwd = picks.filter(p => playersMap[p.id]?.generalInfo.element_type === 4 && p.starting).length;
      const currentForm = `${def}-${mid}-${fwd}`;
      if (legalFormations.includes(currentForm)) {
        setSelectedFormation(currentForm);
      }
    }
  }, [isStorageLoaded, picks, playersMap, legalFormations]);

  const applyFormation = useCallback((picksList: SavedPick[], formationStr: string): SavedPick[] => {
    const parts = formationStr.split('-').map(Number);
    const defTarget = parts[0] || 4;
    const midTarget = parts[1] || 4;
    const fwdTarget = parts[2] || 2;
    const targets: Record<number, number> = {
      1: 1,
      2: defTarget,
      3: midTarget,
      4: fwdTarget,
    };

    const picksByPos: Record<number, SavedPick[]> = { 1: [], 2: [], 3: [], 4: [] };
    picksList.forEach((p) => {
      const player = playersMap[p.id];
      if (player) {
        picksByPos[player.generalInfo.element_type].push(p);
      }
    });

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

    return newPicks;
  }, [playersMap]);

  const handleFormationChange = (newFormation: string) => {
    setSelectedFormation(newFormation);
    const updated = applyFormation(picks, newFormation);
    const hasCaptain = updated.some(p => p.captain && p.starting);
    if (!hasCaptain) {
      updated.forEach(p => p.captain = false);
      const firstStarter = updated.find(p => p.starting);
      if (firstStarter) {
        firstStarter.captain = true;
      }
    }
    savePicks(updated);
    setAnalysisActive(false);
  };

  const optimizeFormation = () => {
    if (picks.length === 0) return;

    let bestFormation = '4-4-2';
    let bestTotalValue = -Infinity;
    let bestStartersIds = new Set<number>();

    const picksByPos: Record<number, SavedPick[]> = { 1: [], 2: [], 3: [], 4: [] };
    picks.forEach((p) => {
      const player = playersMap[p.id];
      if (player) {
        picksByPos[player.generalInfo.element_type].push(p);
      }
    });

    const sortedPicksByPos: Record<number, SavedPick[]> = { 1: [], 2: [], 3: [], 4: [] };
    for (let pos = 1; pos <= 4; pos++) {
      sortedPicksByPos[pos] = [...picksByPos[pos]].sort((a, b) => {
        const playerA = playersMap[a.id];
        const playerB = playersMap[b.id];
        const valA = playerA ? playerA.playerValue[currentHorizon] : null;
        const valB = playerB ? playerB.playerValue[currentHorizon] : null;

        const numA = valA !== null ? valA : -999999;
        const numB = valB !== null ? valB : -999999;

        if (numA !== numB) {
          return numB - numA;
        }
        return a.id - b.id;
      });
    }

    legalFormations.forEach((formStr) => {
      const parts = formStr.split('-').map(Number);
      const defTarget = parts[0] || 4;
      const midTarget = parts[1] || 4;
      const fwdTarget = parts[2] || 2;
      const targets: Record<number, number> = {
        1: 1,
        2: defTarget,
        3: midTarget,
        4: fwdTarget,
      };

      let currentTotalValue = 0;
      const currentStarters = new Set<number>();

      for (let pos = 1; pos <= 4; pos++) {
        const posPicks = sortedPicksByPos[pos];
        const target = targets[pos];
        
        const selected = posPicks.slice(0, target);
        selected.forEach((p) => {
          currentStarters.add(p.id);
          const player = playersMap[p.id];
          const val = player ? player.playerValue[currentHorizon] : null;
          currentTotalValue += val !== null ? val : -999999;
        });

        const missingCount = target - selected.length;
        if (missingCount > 0) {
          currentTotalValue += missingCount * -999999;
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
        const val = player ? player.playerValue[currentHorizon] : null;
        const numVal = val !== null ? val : -999999;
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

    setSelectedFormation(bestFormation);
    savePicks(newPicks);
    setNotification(`Optimized formation to ${bestFormation} and assigned captain.`);
    setAnalysisActive(false);
  };

  const handleBudgetChange = (b: number) => {
    const clamped = Math.max(50.0, Math.min(150.0, b));
    saveBudget(parseFloat(clamped.toFixed(1)));
    setAnalysisActive(false);
    setPlanActive(false);
  };

  // The backend validates freeTransfers as an integer 1..2 today. Raising the
  // cap here is the only frontend change needed when the API widens it.
  const MAX_FREE_TRANSFERS = 2;

  const handleFreeTransfersChange = (n: number) => {
    if (isNaN(n)) return;
    const clamped = Math.max(1, Math.min(MAX_FREE_TRANSFERS, Math.round(n)));
    saveFreeTransfers(clamped);
    setPlanActive(false);
  };

  const handleBankChange = (b: number) => {
    if (isNaN(b)) return;
    const clamped = Math.max(0, Math.min(100.0, b));
    saveBank(parseFloat(clamped.toFixed(1)));
    setPlanActive(false);
  };

  const adjustBankBy = (amount: number) => {
    handleBankChange(bank + amount);
  };

  const adjustBudgetBy = (amount: number) => {
    handleBudgetChange(budget + amount);
  };

  // 6. Handle dropped/transferred out players on load
  const [checkedDropped, setCheckedDropped] = useState(false);
  useEffect(() => {
    if (isStorageLoaded && !isPlayersLoading && groupedPlayers && !checkedDropped) {
      const validPicks = picks.filter((p) => !!playersMap[p.id]);
      if (validPicks.length < picks.length) {
        const removedCount = picks.length - validPicks.length;
        savePicks(validPicks);
        setNotification(`Removed ${removedCount} player(s) who are no longer active in the league.`);
      }
      setCheckedDropped(true);
    }
  }, [isStorageLoaded, isPlayersLoading, groupedPlayers, picks, playersMap, savePicks, checkedDropped]);

  // 7. Continuous validation pipeline
  const validation = useMemo(() => {
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
  }, [picks, playersMap, teamNamesById, budget]);

  // Remaining budget
  const budgetRemaining = budget - validation.totalCost;

  // 8. Map picks for SquadPitchView consumption
  // Build a perfect visual array of 15 slots
  const visualPicks = useMemo<SquadPitchPick[]>(() => {
    const list: SquadPitchPick[] = [];
    const underPerformerIds = new Set(underPerformers.map((u) => u.player.generalInfo.id));

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
  }, [picks, playersMap, analysisActive, underPerformers, formationTargets]);

  // Helper to determine the active starting formation string (e.g. 4-4-2)
  const activeFormationString = useMemo(() => {
    if (picks.length === 0) return '';
    const def = picks.filter(p => playersMap[p.id]?.generalInfo.element_type === 2 && p.starting).length;
    const mid = picks.filter(p => playersMap[p.id]?.generalInfo.element_type === 3 && p.starting).length;
    const fwd = picks.filter(p => playersMap[p.id]?.generalInfo.element_type === 4 && p.starting).length;
    return `${def}-${mid}-${fwd}`;
  }, [picks, playersMap]);

  // 9. Mutative Operations
  const handleAddPlayer = (player: ProcessedPlayer) => {
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

    let newPicks = [...picks];
    if (pickerReplaceIndex !== null) {
      // Replace a specific player
      const oldId = picks[pickerReplaceIndex]?.id;
      const oldPick = picks[pickerReplaceIndex];
      newPicks[pickerReplaceIndex] = {
        ...newPick,
        starting: oldPick ? oldPick.starting : shouldStart,
        captain: oldPick ? oldPick.captain : false,
      };
      setNotification(`Replaced player in your squad.`);
    } else {
      newPicks.push(newPick);
      setNotification(`Added ${player.generalInfo.web_name} to your squad.`);
    }

    savePicks(newPicks);
    setAnalysisActive(false); // Invalidate analysis on change
    setIsPickerOpen(false);
    setPickerReplaceIndex(null);
  };

  const handleRemovePlayer = (id: number) => {
    const index = picks.findIndex((p) => p.id === id);
    if (index !== -1) {
      const player = playersMap[id];
      const name = player ? player.generalInfo.web_name : 'Player';
      const removedPick = picks[index];
      
      let newPicks = picks.filter((p) => p.id !== id);
      
      // If we removed the captain, assign a new captain if possible
      if (removedPick.captain && newPicks.length > 0) {
        const firstStarter = newPicks.find(p => p.starting);
        if (firstStarter) {
          firstStarter.captain = true;
        }
      }

      savePicks(newPicks);
      setNotification(`Removed ${name} from your squad.`);
      setAnalysisActive(false); // Invalidate analysis
    }
    setIsActionsOpen(false);
  };

  const handleToggleStarting = (id: number) => {
    const newPicks = picks.map((p) => {
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

    savePicks(newPicks);
    setAnalysisActive(false); // Invalidate analysis
    setIsActionsOpen(false);
  };

  const handleMakeCaptain = (id: number) => {
    const newPicks = picks.map((p) => ({
      ...p,
      captain: p.id === id, // Assign only to this player, strip others
    }));

    savePicks(newPicks);
    setAnalysisActive(false); // Invalidate analysis
    setIsActionsOpen(false);
  };

  const handleApplyTransferSuggestion = (playerIn: ProcessedPlayer) => {
    if (!suggestPlayerOut) return;
    
    const outId = suggestPlayerOut.generalInfo.id;
    const index = picks.findIndex((p) => p.id === outId);
    if (index !== -1) {
      const oldPick = picks[index];
      const newPicks = [...picks];
      newPicks[index] = {
        id: playerIn.generalInfo.id,
        starting: oldPick.starting,
        captain: oldPick.captain,
      };

      savePicks(newPicks);
      setNotification(`Transferred in ${playerIn.generalInfo.web_name} for ${suggestPlayerOut.generalInfo.web_name}.`);
      setAnalysisActive(false); // Invalidate analysis
    }
    setIsSuggestionsOpen(false);
    setSuggestPlayerOut(null);
  };

  // 10. Core Interactions
  const handleEmptySlotClick = (elementType: number) => {
    setPickerElementType(elementType);
    setPickerReplaceIndex(null);
    setIsPickerOpen(true);
  };

  const handlePlayerClick = (player: ProcessedPlayer) => {
    // If analysis is active and player is flagged as underperforming,
    // open the suggestion replacements immediately!
    const underPerformerIds = new Set(underPerformers.map((u) => u.player.generalInfo.id));
    
    if (analysisActive && underPerformerIds.has(player.generalInfo.id)) {
      setSuggestPlayerOut(player);
      suggestTransfers(player.generalInfo.id, budgetRemaining, currentHorizon, 5);
      setIsSuggestionsOpen(true);
    } else {
      setActivePlayer(player);
      setIsActionsOpen(true);
    }
  };

  const triggerAnalyze = () => {
    if (!validation.isValid) return;
    const playerIds = picks.map((p) => p.id);
    checkUnderPerformers(playerIds, currentHorizon);
    setAnalysisActive(true);
  };

  // Fires only from the user's click — never from an effect.
  const triggerPlanTransfers = () => {
    if (!validation.isValid || picks.length !== SQUAD_SIZE) return;
    requestTransferPlan({
      squad: picks.map((p) => ({ playerId: p.id })),
      bank,
      freeTransfers,
      horizon: currentHorizon,
    });
    setPlanActive(true);
  };

  // Any change to the squad or the planner inputs makes an existing plan stale,
  // so hide it rather than let it contradict what is on the pitch.
  useEffect(() => {
    setPlanActive(false);
  }, [picks, currentHorizon, budget, bank, freeTransfers]);

  // Applying a plan must be atomic: replace the whole squad in one write using
  // the backend's resulting XI and captain, never move-by-move.
  const applyTransferPlan = () => {
    if (!transferPlan) return;
    const mapped: SavedPick[] = transferPlan.resultingPicks.map((p) => ({
      id: p.player.generalInfo.id,
      starting: p.starting,
      captain: p.captain,
    }));
    savePicks(mapped);
    setSelectedFormation(transferPlan.resultingFormation);
    saveBank(parseFloat(transferPlan.resultingBank.toFixed(1)));
    setNotification(
      `Applied ${transferPlan.transfersUsed} transfer${
        transferPlan.transfersUsed === 1 ? '' : 's'
      }. Bank is now ${formatPrice(transferPlan.resultingBank)}.`
    );
    setAnalysisActive(false);
    setPlanActive(false);
  };

  const triggerAutofill = () => {
    if (optimalSquad?.picks) {
      const mapped = optimalSquad.picks.map((p) => ({
        id: p.player.generalInfo.id,
        starting: p.starting,
        captain: p.captain,
      }));
      savePicks(mapped);
      setNotification('Auto-filled squad with mathematically optimal lineup.');
      setAnalysisActive(false);
    }
  };

  const triggerClear = () => {
    clearPicks();
    setNotification('Cleared your squad.');
    setAnalysisActive(false);
  };

  // 11. Loading and Error check
  const isGlobalLoading = !isStorageLoaded || isPlayersLoading || isTeamsLoading;
  const globalError = playersError || teamsError;

  if (globalError) {
    return (
      <div className="my-squad-page my-squad-page--error">
        <div className="my-squad-page__container">
          <ErrorState
            title="Failed to Load Squad Builder"
            message={globalError.message}
          />
        </div>
      </div>
    );
  }

  // Active player actions params helper
  const activePlayerPick = activePlayer ? picks.find((p) => p.id === activePlayer.generalInfo.id) : null;
  const activePlayerTeamName = activePlayer ? (teamNamesById[activePlayer.generalInfo.team] || 'Unknown') : '';

  return (
    <div className="my-squad-page">
      <div className="my-squad-page__container">
        <PageSection
          title="My Squad Planner"
          subtitle="Assemble your 15-player dream squad, validate against official FPL rules, and analyze underperforming slots."
        >
          {/* Top Banner Notifications */}
          {notification && (
            <div className="squad-notification-banner" role="status">
              <span className="squad-notification-banner__message">{notification}</span>
              <button
                type="button"
                className="squad-notification-banner__close"
                onClick={() => setNotification(null)}
                aria-label="Dismiss notification"
              >
                &times;
              </button>
            </div>
          )}

          <div className="squad-layout">
            {/* LEFT COLUMN: Main Pitch View and Seeding Controls */}
            <div className="squad-layout__main">
              {/* Toolbar Actions */}
              <div className="squad-toolbar">
                <div className="squad-toolbar__horizon">
                  <span className="squad-toolbar__lbl">Horizon:</span>
                  <HorizonTabs value={currentHorizon} onChange={(h) => {
                    setCurrentHorizon(h);
                    setAnalysisActive(false); // Invalidate analysis on horizon shift
                  }} />
                </div>
                <div className="squad-toolbar__actions">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={triggerAutofill}
                    disabled={isGlobalLoading || !optimalSquad}
                  >
                    Auto-fill Optimal
                  </Button>
                  {picks.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={triggerClear}
                      disabled={isGlobalLoading}
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </div>

              {/* Pitch Display Container */}
              <div className="pitch-wrapper">
                <SquadPitchView
                  picks={visualPicks}
                  formation={activeFormationString}
                  teamNamesById={teamNamesById}
                  horizon={currentHorizon}
                  isLoading={isGlobalLoading}
                  onPlayerClick={handlePlayerClick}
                  onEmptySlotClick={handleEmptySlotClick}
                />
              </div>

              {/* Stale/Underperforming Analysis Section */}
              {analysisActive && (
                <div className="analysis-results-card">
                  <h3 className="analysis-results-card__title">Squad Underperformance Analysis</h3>
                  {isAnalysisLoading ? (
                    <div className="analysis-results-card__loading">
                      <div className="analysis-spinner" />
                      <span>Running optimization algorithms against {currentHorizon} horizon...</span>
                    </div>
                  ) : analysisError ? (
                    <ErrorState
                      title="Analysis Error"
                      message={analysisError.message || "Could not analyze underperforming slots."}
                      onRetry={triggerAnalyze}
                    />
                  ) : underPerformers.length === 0 ? (
                    <div className="analysis-results-card__success">
                      <span>No underperforming slots found! Your squad is fully optimized for price vs value.</span>
                    </div>
                  ) : (
                    <div className="underperformers-grid">
                      {underPerformers.map((up) => {
                        const teamName = teamNamesById[up.player.generalInfo.team] || 'Unknown';
                        return (
                          <div key={up.player.generalInfo.id} className="underperformer-row">
                            <div className="underperformer-row__identity">
                              <span className="underperformer-row__name">
                                {up.player.generalInfo.first_name} {up.player.generalInfo.web_name}
                              </span>
                              <div className="underperformer-row__meta">
                                <TeamBadge teamName={teamName} size="sm" showLabel />
                                <PositionBadge elementType={up.player.generalInfo.element_type} short />
                              </div>
                            </div>

                            <div className="underperformer-row__rank font-tabular">
                              Ranked <strong className="text-danger">{up.positionRank}</strong> of {up.positionCount}
                            </div>

                            <div className="underperformer-row__value font-tabular">
                              Value: <strong>{formatValue(up.value, 2)}</strong>
                            </div>

                            <div className="underperformer-row__action">
                              <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                  setSuggestPlayerOut(up.player);
                                  suggestTransfers(up.player.generalInfo.id, budgetRemaining, currentHorizon, 5);
                                  setIsSuggestionsOpen(true);
                                }}
                              >
                                Find Replacements
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Joint transfer plan results */}
              {planActive && (
                <div className="analysis-results-card">
                  <h3 className="analysis-results-card__title">
                    Transfer plan
                  </h3>
                  {isPlanLoading ? (
                    <div className="analysis-results-card__loading">
                      <div className="analysis-spinner" />
                      <span>Planning up to {freeTransfers} transfer{freeTransfers === 1 ? '' : 's'}…</span>
                    </div>
                  ) : planError ? (
                    <ErrorState
                      title="Could not build a transfer plan"
                      message={
                        planError.message ||
                        'The planner could not produce a valid plan for this squad.'
                      }
                      onRetry={triggerPlanTransfers}
                    />
                  ) : !transferPlan ? null : transferPlan.moves.length === 0 ? (
                    <div className="analysis-results-card__success">
                      <span>
                        No transfer improves your squad on this horizon. Keeping
                        your current squad is the best option.
                      </span>
                    </div>
                  ) : (
                    <>
                      {!transferPlan.optimal && (
                        <div className="plan-notice">
                          The solver could not prove this plan optimal, so a
                          fallback was used. The result may be sub-optimal.
                        </div>
                      )}

                      <div className="plan-moves">
                        {transferPlan.moves.map((m) => {
                          const outTeam =
                            teamNamesById[m.playerOut.generalInfo.team] || 'Unknown';
                          const inTeam =
                            teamNamesById[m.playerIn.generalInfo.team] || 'Unknown';
                          return (
                            <div key={m.order} className="plan-move">
                              <div className="plan-move__side plan-move__side--out">
                                <span className="plan-move__label">Out</span>
                                <span className="plan-move__name">
                                  {m.playerOut.generalInfo.web_name}
                                </span>
                                <div className="plan-move__meta">
                                  <TeamBadge teamName={outTeam} size="sm" />
                                  <PositionBadge
                                    elementType={m.playerOut.generalInfo.element_type}
                                    short
                                  />
                                  <span className="font-tabular">
                                    {formatPrice(m.sellingPrice)}
                                  </span>
                                </div>
                              </div>

                              <div className="plan-move__arrow" aria-hidden="true">
                                →
                              </div>

                              <div className="plan-move__side plan-move__side--in">
                                <span className="plan-move__label">In</span>
                                <span className="plan-move__name">
                                  {m.playerIn.generalInfo.web_name}
                                </span>
                                <div className="plan-move__meta">
                                  <TeamBadge teamName={inTeam} size="sm" />
                                  <PositionBadge
                                    elementType={m.playerIn.generalInfo.element_type}
                                    short
                                  />
                                  <span className="font-tabular">
                                    {formatPrice(m.purchasePrice)}
                                  </span>
                                </div>
                              </div>

                              <div className="plan-move__figures font-tabular">
                                <span
                                  className={
                                    m.costDelta > 0
                                      ? 'plan-move__cost plan-move__cost--spend'
                                      : 'plan-move__cost plan-move__cost--free'
                                  }
                                >
                                  {m.costDelta > 0 ? 'Costs ' : 'Frees '}
                                  {formatPrice(Math.abs(m.costDelta))}
                                </span>
                                <span className="plan-move__gain">
                                  Score {m.valueGain >= 0 ? '+' : ''}
                                  {formatValue(m.valueGain, 2)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="plan-summary">
                        <StatValue
                          label="Transfers used"
                          value={`${transferPlan.transfersUsed}/${transferPlan.freeTransfers}`}
                        />
                        <StatValue
                          label="Net spend"
                          value={formatPrice(transferPlan.netSpend)}
                        />
                        <StatValue
                          label="Bank after transfers"
                          value={formatPrice(transferPlan.resultingBank)}
                          tone={transferPlan.resultingBank < 0 ? 'danger' : 'default'}
                        />
                        <StatValue
                          label="Value gain"
                          value={`${
                            transferPlan.totalValueGain >= 0 ? '+' : ''
                          }${formatValue(transferPlan.totalValueGain, 2)}`}
                          hint={`${formatValue(
                            transferPlan.currentTotalValue,
                            2
                          )} → ${formatValue(transferPlan.resultingTotalValue, 2)}`}
                          tone={
                            transferPlan.totalValueGain > 0 ? 'success' : 'default'
                          }
                        />
                        <StatValue
                          label="New formation"
                          value={transferPlan.resultingFormation}
                        />
                      </div>

                      {transferPlan.priceBasis !== 'provided_selling_price' && (
                        <p className="plan-disclosure">
                          Sale proceeds are estimated from current prices, so your
                          real bank may differ.
                        </p>
                      )}

                      <div className="plan-actions">
                        <Button
                          type="button"
                          variant="primary"
                          onClick={applyTransferPlan}
                        >
                          Apply plan
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setPlanActive(false)}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: KPI Metrics & Continuous Validation Checklist */}
            <div className="squad-layout__sidebar">
              {/* Squad KPI metrics */}
              <div className="squad-metrics">
                <div className="squad-metrics__item">
                  <StatValue
                    label="Remaining Bank"
                    value={isGlobalLoading ? '—' : `${formatPrice(budgetRemaining)}`}
                    hint={`Squad Cost: ${formatPrice(validation.totalCost)}`}
                    tone={validation.totalCost > budget ? 'danger' : 'success'}
                  />
                </div>
                <div className="squad-metrics__item">
                  <StatValue
                    label="Squad Size"
                    value={isGlobalLoading ? '—' : `${picks.length}/${SQUAD_SIZE}`}
                    hint="Full squad is required to analyze"
                    tone={picks.length === SQUAD_SIZE ? 'success' : 'warning'}
                  />
                </div>
              </div>

              {/* Squad Settings Card */}
              <div className="validation-card">
                <h3 className="validation-card__title">Squad Settings</h3>
                
                {/* Budget control */}
                <div className="optimizer-control-group">
                  <label className="optimizer-control-label" htmlFor="budget-input">Budget (£m)</label>
                  <div className="budget-picker">
                    <button
                      type="button"
                      className="budget-picker__btn"
                      onClick={() => adjustBudgetBy(-1.0)}
                      title="Decrease by £1.0m"
                      disabled={budget <= 50.0 || isGlobalLoading}
                    >
                      -1.0
                    </button>
                    <button
                      type="button"
                      className="budget-picker__btn budget-picker__btn--small"
                      onClick={() => adjustBudgetBy(-0.1)}
                      title="Decrease by £0.1m"
                      disabled={budget <= 50.0 || isGlobalLoading}
                    >
                      -0.1
                    </button>
                    <input
                      id="budget-input"
                      type="number"
                      className="budget-picker__input"
                      value={budget}
                      step={0.1}
                      min={50.0}
                      max={150.0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) handleBudgetChange(val);
                      }}
                      disabled={isGlobalLoading}
                    />
                    <button
                      type="button"
                      className="budget-picker__btn budget-picker__btn--small"
                      onClick={() => adjustBudgetBy(0.1)}
                      title="Increase by £0.1m"
                      disabled={budget >= 150.0 || isGlobalLoading}
                    >
                      +0.1
                    </button>
                    <button
                      type="button"
                      className="budget-picker__btn"
                      onClick={() => adjustBudgetBy(1.0)}
                      title="Increase by £1.0m"
                      disabled={budget >= 150.0 || isGlobalLoading}
                    >
                      +1.0
                    </button>
                  </div>
                </div>

                {/* Formation control */}
                <div className="optimizer-control-group">
                  <label className="optimizer-control-label" htmlFor="formation-select">Formation</label>
                  <div className="formation-picker">
                    <select
                      id="formation-select"
                      className="formation-picker__select"
                      value={selectedFormation}
                      onChange={(e) => handleFormationChange(e.target.value)}
                      disabled={isGlobalLoading}
                    >
                      {legalFormations.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="validation-card__actions" style={{ marginTop: 0 }}>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={optimizeFormation}
                    disabled={picks.length === 0 || isGlobalLoading}
                    className="analyze-btn"
                  >
                    Optimize formation
                  </Button>
                </div>
              </div>

              {/* Transfer planner */}
              <div className="validation-card">
                <h3 className="validation-card__title">Plan transfers</h3>
                <p className="validation-card__hint">
                  Plans all moves together, so selling one player can fund an
                  upgrade in another position.
                </p>

                {/* Free transfers */}
                <div className="optimizer-control-group">
                  <label
                    className="optimizer-control-label"
                    htmlFor="free-transfers-input"
                  >
                    Free transfers
                  </label>
                  <div className="free-transfers-picker">
                    {Array.from(
                      { length: MAX_FREE_TRANSFERS },
                      (_, i) => i + 1
                    ).map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`free-transfers-picker__btn ${
                          freeTransfers === n
                            ? 'free-transfers-picker__btn--active'
                            : ''
                        }`}
                        onClick={() => handleFreeTransfersChange(n)}
                        disabled={isGlobalLoading}
                        aria-pressed={freeTransfers === n}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bank */}
                <div className="optimizer-control-group">
                  <label className="optimizer-control-label" htmlFor="bank-input">
                    In the bank (£m)
                  </label>
                  <div className="budget-picker">
                    <button
                      type="button"
                      className="budget-picker__btn"
                      onClick={() => adjustBankBy(-1.0)}
                      title="Decrease by £1.0m"
                      disabled={bank <= 0 || isGlobalLoading}
                    >
                      -1.0
                    </button>
                    <button
                      type="button"
                      className="budget-picker__btn budget-picker__btn--small"
                      onClick={() => adjustBankBy(-0.1)}
                      title="Decrease by £0.1m"
                      disabled={bank <= 0 || isGlobalLoading}
                    >
                      -0.1
                    </button>
                    <input
                      id="bank-input"
                      type="number"
                      className="budget-picker__input"
                      value={bank}
                      step={0.1}
                      min={0}
                      max={100.0}
                      onChange={(e) => handleBankChange(parseFloat(e.target.value))}
                      disabled={isGlobalLoading}
                    />
                    <button
                      type="button"
                      className="budget-picker__btn budget-picker__btn--small"
                      onClick={() => adjustBankBy(0.1)}
                      title="Increase by £0.1m"
                      disabled={bank >= 100.0 || isGlobalLoading}
                    >
                      +0.1
                    </button>
                    <button
                      type="button"
                      className="budget-picker__btn"
                      onClick={() => adjustBankBy(1.0)}
                      title="Increase by £1.0m"
                      disabled={bank >= 100.0 || isGlobalLoading}
                    >
                      +1.0
                    </button>
                  </div>
                </div>

                <div className="validation-card__actions" style={{ marginTop: 0 }}>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={triggerPlanTransfers}
                    disabled={
                      !validation.isValid ||
                      picks.length !== SQUAD_SIZE ||
                      isGlobalLoading ||
                      isPlanLoading
                    }
                    loading={isPlanLoading}
                    className="analyze-btn"
                  >
                    Plan transfers
                  </Button>
                </div>

                {picks.length !== SQUAD_SIZE && (
                  <p className="validation-card__hint">
                    Complete your {SQUAD_SIZE}-player squad to plan transfers.
                  </p>
                )}

                <p className="validation-card__note">
                  Plans use at most your free transfers, so a points hit is never
                  suggested. Sale proceeds are estimated from each player&apos;s
                  current price, which may differ from your actual selling price.
                </p>
              </div>

              {/* Continuous Validation Rules */}
              <div className="validation-card">
                <h3 className="validation-card__title">Squad Compliance</h3>
                <div className="validation-checklist">
                  {/* Rule 1: Squad size */}
                  <div className={`validation-item ${picks.length === SQUAD_SIZE ? 'validation-item--success' : 'validation-item--warning'}`}>
                    <span className="validation-item__icon">
                      {picks.length === SQUAD_SIZE ? '✓' : '○'}
                    </span>
                    <div className="validation-item__content">
                      <span className="validation-item__name">Squad Size</span>
                      <span className="validation-item__desc">
                        {picks.length}/{SQUAD_SIZE} players selected.
                      </span>
                    </div>
                  </div>

                  {/* Rule 2: Position Counts */}
                  {Object.entries(SQUAD_RULES).map(([posStr, rule]) => {
                    const pos = parseInt(posStr, 10);
                    const count = validation.posCounts[pos] || 0;
                    const label = getPositionShortLabel(pos);
                    const isPerfect = count === rule.squad;
                    return (
                      <div key={pos} className={`validation-item ${isPerfect ? 'validation-item--success' : 'validation-item--warning'}`}>
                        <span className="validation-item__icon">
                          {isPerfect ? '✓' : '○'}
                        </span>
                        <div className="validation-item__content">
                          <span className="validation-item__name">{label} Quantity</span>
                          <span className="validation-item__desc">
                            {count}/{rule.squad} selected.
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Rule 3: Budget check */}
                  <div className={`validation-item ${validation.totalCost <= budget ? 'validation-item--success' : 'validation-item--error'}`}>
                    <span className="validation-item__icon">
                      {validation.totalCost <= budget ? '✓' : '✗'}
                    </span>
                    <div className="validation-item__content">
                      <span className="validation-item__name">Budget Limit</span>
                      <span className="validation-item__desc">
                        £{validation.totalCost.toFixed(1)}m / £{budget.toFixed(1)}m.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Specific active validation errors */}
                {validation.errors.length > 0 && (
                  <div className="validation-errors-list">
                    {validation.errors.map((err, idx) => (
                      <div key={idx} className="validation-error-msg">
                        <span className="validation-error-msg__bullet">•</span>
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Main Action Button */}
                <div className="validation-card__actions">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={triggerAnalyze}
                    disabled={!validation.isValid || isGlobalLoading}
                    loading={isAnalysisLoading}
                    className="analyze-btn"
                  >
                    Analyze Squad
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </PageSection>
      </div>

      {/* Modals & Portals */}
      <PlayerPickerModal
        isOpen={isPickerOpen}
        onClose={() => {
          setIsPickerOpen(false);
          setPickerReplaceIndex(null);
        }}
        elementType={pickerElementType}
        onSelect={handleAddPlayer}
        currentSquadIds={picks.map((p) => p.id)}
        teamCounts={validation.teamCounts}
        budgetRemaining={budgetRemaining}
        replacedPlayerPrice={pickerReplaceIndex !== null && picks[pickerReplaceIndex] ? (playersMap[picks[pickerReplaceIndex].id]?.generalInfo.now_cost || 0) : 0}
        currentHorizon={currentHorizon}
        players={allPlayers}
        teamNamesById={teamNamesById}
      />

      <PlayerActionsModal
        isOpen={isActionsOpen}
        onClose={() => setIsActionsOpen(false)}
        player={activePlayer}
        isStarting={activePlayerPick ? activePlayerPick.starting : false}
        isCaptain={activePlayerPick ? activePlayerPick.captain : false}
        onMakeCaptain={() => activePlayer && handleMakeCaptain(activePlayer.generalInfo.id)}
        onToggleStarting={() => activePlayer && handleToggleStarting(activePlayer.generalInfo.id)}
        onReplace={() => {
          if (activePlayer) {
            setPickerElementType(activePlayer.generalInfo.element_type);
            const idx = picks.findIndex((p) => p.id === activePlayer.generalInfo.id);
            setPickerReplaceIndex(idx !== -1 ? idx : null);
            setIsActionsOpen(false);
            setIsPickerOpen(true);
          }
        }}
        onRemove={() => activePlayer && handleRemovePlayer(activePlayer.generalInfo.id)}
        teamName={activePlayerTeamName}
      />

      <TransferSuggestionsModal
        isOpen={isSuggestionsOpen}
        onClose={() => {
          setIsSuggestionsOpen(false);
          setSuggestPlayerOut(null);
        }}
        playerOut={suggestPlayerOut}
        suggestions={suggestions}
        isLoading={isSuggestionsLoading}
        error={suggestionsError}
        budgetRemaining={budgetRemaining}
        teamNamesById={teamNamesById}
        onApplyTransfer={handleApplyTransferSuggestion}
      />
    </div>
  );
};

export default MySquadPage;
