import React, { useMemo, useState } from 'react';
import { ProcessedPlayer, SquadHorizon } from '@fpl/contracts/fpl';

import ErrorState from '../../components/ErrorState';
import PageSection from '../../components/PageSection';
import SquadPitchView from '../../components/SquadPitchView';
import PlayerActionsModal from '../../features/squad/components/PlayerActionsModal';
import PlayerPickerModal from '../../features/squad/components/PlayerPickerModal';
import { clampFreeTransfers } from '../../features/squad/freeTransfers';
import { useSquadLocalStorage } from '../../features/squad/hooks';
import { useGetOptimalSquad } from '../../features/squad/hooks/api';
import { useGetTeamNames } from '../../features/teams/hooks';
import TransferSuggestionsModal from '../../features/transfers/components/TransferSuggestionsModal';
import { useSuggestTransfers } from '../../features/transfers/hooks';
import { formatPrice } from '../../utils';

import SquadAnalysisResults from './components/SquadAnalysisResults';
import SquadComplianceCard from './components/SquadComplianceCard';
import SquadMetrics from './components/SquadMetrics';
import SquadNotificationBanner from './components/SquadNotificationBanner';
import SquadSettingsCard from './components/SquadSettingsCard';
import SquadToolbar from './components/SquadToolbar';
import TransferPlannerCard from './components/TransferPlannerCard';
import TransferPlanResults from './components/TransferPlanResults';
import { useDroppedPlayersCleanup } from './hooks/useDroppedPlayersCleanup';
import { useSquadAnalysis } from './hooks/useSquadAnalysis';
import { useSquadFormation } from './hooks/useSquadFormation';
import { useSquadModals } from './hooks/useSquadModals';
import { useSquadPlayers } from './hooks/useSquadPlayers';
import { useTransferPlanner } from './hooks/useTransferPlanner';
import { LEGAL_FORMATIONS, applyFormation, optimizeLineup } from './utils/formation';
import { BANK_MAX, BANK_MIN, BUDGET_MAX, BUDGET_MIN, clampMoney } from './utils/money';
import {
  addPlayerToPicks,
  buildVisualPicks,
  clearSellingPrices,
  getReplacedPlayerPrice,
  getUnderPerformerIds,
  makeCaptainPick,
  removePick,
  setPickSellingPrice,
  swapPickAt,
  toSavedPicks,
  toggleStartingPick,
} from './utils/picks';
import { validateSquad } from './utils/validation';
import './index.scss';

export const MySquadPage: React.FC = () => {
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

  const [currentHorizon, setCurrentHorizon] = useState<SquadHorizon>('value5');
  const [notification, setNotification] = useState<string | null>(null);
  const [sellingPricesOpen, setSellingPricesOpen] = useState(false);

  const modals = useSquadModals(picks);

  const { groupedPlayers, playersMap, allPlayers, isLoading: isPlayersLoading, error: playersError } = useSquadPlayers();
  const { teamNamesById, isLoading: isTeamsLoading, error: teamsError } = useGetTeamNames();

  // Fetch optimal squad in background for easy seeding (respects user budget)
  const { squad: optimalSquad } = useGetOptimalSquad(currentHorizon, budget);

  const {
    suggest: suggestTransfers,
    suggestions,
    isLoading: isSuggestionsLoading,
    error: suggestionsError,
  } = useSuggestTransfers();

  const { selectedFormation, setSelectedFormation, formationTargets, activeFormationString } =
    useSquadFormation(picks, playersMap, isStorageLoaded);

  useDroppedPlayersCleanup({
    isStorageLoaded,
    isPlayersLoading,
    groupedPlayers,
    picks,
    playersMap,
    savePicks,
    onRemoved: setNotification,
  });

  const validation = useMemo(
    () => validateSquad(picks, playersMap, teamNamesById, budget),
    [picks, playersMap, teamNamesById, budget]
  );
  const budgetRemaining = budget - validation.totalCost;

  const analysis = useSquadAnalysis(picks, currentHorizon, validation.isValid);
  const { setAnalysisActive } = analysis;

  const planner = useTransferPlanner({
    picks,
    horizon: currentHorizon,
    budget,
    bank,
    freeTransfers,
    isSquadValid: validation.isValid,
  });
  const { setPlanActive, transferPlan } = planner;

  const visualPicks = useMemo(
    () => buildVisualPicks(picks, playersMap, analysis.analysisActive, analysis.underPerformers, formationTargets),
    [picks, playersMap, analysis.analysisActive, analysis.underPerformers, formationTargets]
  );

  // Toolbar and settings
  const handleHorizonChange = (h: SquadHorizon) => {
    setCurrentHorizon(h);
    setAnalysisActive(false); // Invalidate analysis on horizon shift
  };

  const handleFormationChange = (newFormation: string) => {
    setSelectedFormation(newFormation);
    savePicks(applyFormation(picks, newFormation, playersMap));
    setAnalysisActive(false);
  };

  const optimizeFormation = () => {
    if (picks.length === 0) return;
    const best = optimizeLineup(picks, playersMap, currentHorizon);
    setSelectedFormation(best.formation);
    savePicks(best.picks);
    setNotification(`Optimized formation to ${best.formation} and assigned captain.`);
    setAnalysisActive(false);
  };

  const handleBudgetChange = (b: number) => {
    saveBudget(clampMoney(b, BUDGET_MIN, BUDGET_MAX));
    setAnalysisActive(false);
    setPlanActive(false);
  };

  // The backend accepts freeTransfers as an integer 0..5. 0 is a real FPL
  // state: the plan then keeps the current squad (points hits are not modelled).
  const handleFreeTransfersChange = (n: number) => {
    const clamped = clampFreeTransfers(n);
    if (clamped === undefined) return;
    saveFreeTransfers(clamped);
    setPlanActive(false);
  };

  const handleBankChange = (b: number) => {
    if (isNaN(b)) return;
    saveBank(clampMoney(b, BANK_MIN, BANK_MAX));
    setPlanActive(false);
  };

  const handleSellingPriceChange = (playerId: number, raw: string) => {
    const updated = setPickSellingPrice(picks, playerId, raw);
    if (updated) savePicks(updated);
  };

  const triggerAutofill = () => {
    if (optimalSquad?.picks) {
      savePicks(toSavedPicks(optimalSquad.picks));
      setNotification('Auto-filled squad with mathematically optimal lineup.');
      setAnalysisActive(false);
    }
  };

  const triggerClear = () => {
    clearPicks();
    setNotification('Cleared your squad.');
    setAnalysisActive(false);
  };

  // Squad edits from the pitch and modals
  const handleAddPlayer = (player: ProcessedPlayer) => {
    savePicks(addPlayerToPicks(picks, player, modals.pickerReplaceIndex, formationTargets, playersMap));
    setNotification(
      modals.pickerReplaceIndex !== null
        ? `Replaced player in your squad.`
        : `Added ${player.generalInfo.web_name} to your squad.`
    );
    setAnalysisActive(false); // Invalidate analysis on change
    modals.closePicker();
  };

  const handleRemovePlayer = (id: number) => {
    if (picks.some((p) => p.id === id)) {
      const player = playersMap[id];
      const name = player ? player.generalInfo.web_name : 'Player';
      savePicks(removePick(picks, id));
      setNotification(`Removed ${name} from your squad.`);
      setAnalysisActive(false); // Invalidate analysis
    }
    modals.closeActions();
  };

  const handleToggleStarting = (id: number) => {
    savePicks(toggleStartingPick(picks, id));
    setAnalysisActive(false); // Invalidate analysis
    modals.closeActions();
  };

  const handleMakeCaptain = (id: number) => {
    savePicks(makeCaptainPick(picks, id));
    setAnalysisActive(false); // Invalidate analysis
    modals.closeActions();
  };

  const handleApplyTransferSuggestion = (playerIn: ProcessedPlayer) => {
    const playerOut = modals.suggestPlayerOut;
    if (!playerOut) return;

    const index = picks.findIndex((p) => p.id === playerOut.generalInfo.id);
    if (index !== -1) {
      savePicks(swapPickAt(picks, index, playerIn.generalInfo.id));
      setNotification(`Transferred in ${playerIn.generalInfo.web_name} for ${playerOut.generalInfo.web_name}.`);
      setAnalysisActive(false); // Invalidate analysis
    }
    modals.closeSuggestions();
  };

  const findReplacements = (player: ProcessedPlayer) => {
    modals.openSuggestions(player);
    suggestTransfers(player.generalInfo.id, budgetRemaining, currentHorizon, 5);
  };

  // Underperformers flagged by an active analysis open replacements directly
  const handlePlayerClick = (player: ProcessedPlayer) => {
    const underPerformerIds = getUnderPerformerIds(analysis.underPerformers);
    if (analysis.analysisActive && underPerformerIds.has(player.generalInfo.id)) {
      findReplacements(player);
    } else {
      modals.openActions(player);
    }
  };

  // Applying a plan must be atomic: replace the whole squad in one write using
  // the backend's resulting XI and captain, never move-by-move.
  const applyTransferPlan = () => {
    if (!transferPlan) return;
    savePicks(toSavedPicks(transferPlan.resultingPicks));
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

  const { activePlayer } = modals;
  const activePlayerPick = activePlayer ? picks.find((p) => p.id === activePlayer.generalInfo.id) : null;
  const activePlayerTeamName = activePlayer ? (teamNamesById[activePlayer.generalInfo.team] || 'Unknown') : '';

  return (
    <div className="my-squad-page">
      <div className="my-squad-page__container">
        <PageSection
          title="My Squad Planner"
          subtitle="Assemble your 15-player dream squad, validate against official FPL rules, and analyze underperforming slots."
        >
          <SquadNotificationBanner message={notification} onDismiss={() => setNotification(null)} />

          <div className="squad-layout">
            {/* LEFT COLUMN: Main Pitch View and Seeding Controls */}
            <div className="squad-layout__main">
              <SquadToolbar
                horizon={currentHorizon}
                onHorizonChange={handleHorizonChange}
                hasPicks={picks.length > 0}
                hasOptimalSquad={!!optimalSquad}
                isLoading={isGlobalLoading}
                onAutofill={triggerAutofill}
                onClear={triggerClear}
              />

              <div className="pitch-wrapper">
                <SquadPitchView
                  picks={visualPicks}
                  formation={activeFormationString}
                  teamNamesById={teamNamesById}
                  horizon={currentHorizon}
                  isLoading={isGlobalLoading}
                  onPlayerClick={handlePlayerClick}
                  onEmptySlotClick={modals.openPickerForSlot}
                />
              </div>

              {analysis.analysisActive && (
                <SquadAnalysisResults
                  horizon={currentHorizon}
                  isLoading={analysis.isLoading}
                  error={analysis.error}
                  underPerformers={analysis.underPerformers}
                  teamNamesById={teamNamesById}
                  onRetry={analysis.triggerAnalyze}
                  onFindReplacements={findReplacements}
                />
              )}

              {planner.planActive && (
                <TransferPlanResults
                  freeTransfers={freeTransfers}
                  isLoading={planner.isLoading}
                  error={planner.error}
                  transferPlan={transferPlan}
                  teamNamesById={teamNamesById}
                  onRetry={planner.triggerPlanTransfers}
                  onApply={applyTransferPlan}
                  onDismiss={() => setPlanActive(false)}
                />
              )}
            </div>

            {/* RIGHT COLUMN: KPI Metrics & Continuous Validation Checklist */}
            <div className="squad-layout__sidebar">
              <SquadMetrics
                isLoading={isGlobalLoading}
                budget={budget}
                budgetRemaining={budgetRemaining}
                totalCost={validation.totalCost}
                squadSize={picks.length}
              />

              <SquadSettingsCard
                budget={budget}
                onBudgetChange={handleBudgetChange}
                selectedFormation={selectedFormation}
                formations={LEGAL_FORMATIONS}
                onFormationChange={handleFormationChange}
                canOptimize={picks.length > 0}
                onOptimize={optimizeFormation}
                isLoading={isGlobalLoading}
              />

              <TransferPlannerCard
                picks={picks}
                playersMap={playersMap}
                freeTransfers={freeTransfers}
                onFreeTransfersChange={handleFreeTransfersChange}
                bank={bank}
                onBankChange={handleBankChange}
                sellingPricesOpen={sellingPricesOpen}
                onToggleSellingPrices={() => setSellingPricesOpen((v) => !v)}
                onSellingPriceChange={handleSellingPriceChange}
                onResetSellingPrices={() => savePicks(clearSellingPrices(picks))}
                isSquadValid={validation.isValid}
                isLoading={isGlobalLoading}
                isPlanLoading={planner.isLoading}
                onPlan={planner.triggerPlanTransfers}
              />

              <SquadComplianceCard
                squadSize={picks.length}
                budget={budget}
                validation={validation}
                isLoading={isGlobalLoading}
                isAnalysisLoading={analysis.isLoading}
                onAnalyze={analysis.triggerAnalyze}
              />
            </div>
          </div>
        </PageSection>
      </div>

      {/* Modals & Portals */}
      <PlayerPickerModal
        isOpen={modals.isPickerOpen}
        onClose={modals.closePicker}
        elementType={modals.pickerElementType}
        onSelect={handleAddPlayer}
        currentSquadIds={picks.map((p) => p.id)}
        teamCounts={validation.teamCounts}
        budgetRemaining={budgetRemaining}
        replacedPlayerPrice={getReplacedPlayerPrice(picks, modals.pickerReplaceIndex, playersMap)}
        currentHorizon={currentHorizon}
        players={allPlayers}
        teamNamesById={teamNamesById}
      />

      <PlayerActionsModal
        isOpen={modals.isActionsOpen}
        onClose={modals.closeActions}
        player={activePlayer}
        isStarting={activePlayerPick ? activePlayerPick.starting : false}
        isCaptain={activePlayerPick ? activePlayerPick.captain : false}
        onMakeCaptain={() => activePlayer && handleMakeCaptain(activePlayer.generalInfo.id)}
        onToggleStarting={() => activePlayer && handleToggleStarting(activePlayer.generalInfo.id)}
        onReplace={modals.replaceActivePlayer}
        onRemove={() => activePlayer && handleRemovePlayer(activePlayer.generalInfo.id)}
        teamName={activePlayerTeamName}
      />

      <TransferSuggestionsModal
        isOpen={modals.isSuggestionsOpen}
        onClose={modals.closeSuggestions}
        playerOut={modals.suggestPlayerOut}
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
