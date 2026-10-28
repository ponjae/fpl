import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  OptimalSquad,
  ProcessedPlayer,
  SquadHorizon,
  isSquadHorizon,
  DEFAULT_BUDGET,
} from '@fpl/contracts/fpl';
import { useSearchParams } from 'react-router-dom';

import Button from '../../components/Button';
import ErrorState from '../../components/ErrorState';
import HorizonTabs from '../../components/HorizonTabs';
import PageSection from '../../components/PageSection';
import PositionBadge from '../../components/PositionBadge';
import SquadPitchView from '../../components/SquadPitchView';
import StatValue from '../../components/StatValue';
import TeamBadge from '../../components/TeamBadge';
import { useGetPlayers } from '../../features/players/hooks';
import {
  useGetOptimalSquad,
  useOptimizeSquad,
} from '../../features/squad/hooks';
import { useGetTeamNames } from '../../features/teams/hooks';

import { formatPrice, formatValue } from '../../utils';
import './index.scss';

const BUDGET_MIN = 50.0;
const BUDGET_MAX = 150.0;

/** Round a £m amount to the nearest £0.1m. */
const roundBudget = (value: number): number => Math.round(value * 10) / 10;

/** Parse the typed budget text into a rounded number, or null if it isn't a number. */
const parseBudgetDraft = (draft: string): number | null => {
  const normalized = draft.trim().replace(',', '.');
  if (!/^\d+(\.\d*)?$|^\.\d+$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? roundBudget(parsed) : null;
};

const isBudgetInRange = (value: number): boolean =>
  value >= BUDGET_MIN && value <= BUDGET_MAX;

/** True when a squad was built for exactly this horizon and budget. */
const isSquadFor = (
  squad: OptimalSquad | undefined,
  horizon: SquadHorizon,
  budget: number
): squad is OptimalSquad =>
  squad !== undefined &&
  squad.horizon === horizon &&
  Math.abs(squad.budget - budget) < 0.05;

export const OptimizerPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Read & Validate Search Params (Horizon and Budget)
  const rawHorizon = searchParams.get('horizon');
  const validHorizon: SquadHorizon = isSquadHorizon(rawHorizon)
    ? rawHorizon
    : 'value5';

  const rawBudget = searchParams.get('budget');
  const validBudget = useMemo(() => {
    if (!rawBudget) return DEFAULT_BUDGET;
    const parsed = parseFloat(rawBudget);
    if (!isNaN(parsed) && parsed >= BUDGET_MIN && parsed <= BUDGET_MAX) {
      return roundBudget(parsed);
    }
    return DEFAULT_BUDGET;
  }, [rawBudget]);

  // Budget being edited. Only applied to the URL (and the query) on submit.
  const [budgetDraft, setBudgetDraft] = useState(() => validBudget.toFixed(1));
  const [showBudgetError, setShowBudgetError] = useState(false);

  // Keep the draft in sync when the applied budget changes (apply, back/forward, shared links).
  useEffect(() => {
    setBudgetDraft(validBudget.toFixed(1));
    setShowBudgetError(false);
  }, [validBudget]);

  // 2. Local Advanced Controls State (Unserialized)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [benchWeight, setBenchWeight] = useState(0.2);
  const [benchGkWeight, setBenchGkWeight] = useState(0.01);
  const [includedIds, setIncludedIds] = useState<number[]>([]);
  const [excludedIds, setExcludedIds] = useState<number[]>([]);
  const [pickerQuery, setPickerQuery] = useState('');

  // Track whether custom mutation results are currently active
  const [showMutationResult, setShowMutationResult] = useState(false);

  // 3. Fetch Data via Hooks
  const {
    squad: querySquad,
    isLoading: isQueryLoading,
    error: queryError,
  } = useGetOptimalSquad(validHorizon, validBudget);

  const {
    optimize,
    squad: mutationSquad,
    isLoading: isMutationLoading,
    isSuccess: isMutationSuccess,
    error: mutationError,
  } = useOptimizeSquad();

  const {
    players: groupedPlayers,
    isLoading: isPlayersLoading,
    error: playersError,
  } = useGetPlayers();

  const {
    teamNamesById,
    isLoading: isTeamsLoading,
    error: teamsError,
  } = useGetTeamNames();

  // 4. Flatten all players for inclusion/exclusion lookup
  const allPlayers = useMemo<ProcessedPlayer[]>(() => {
    if (!groupedPlayers || !groupedPlayers.byId) return [];
    return Object.values(groupedPlayers.byId);
  }, [groupedPlayers]);

  const playersMap = useMemo<Record<number, ProcessedPlayer>>(() => {
    if (!groupedPlayers || !groupedPlayers.byId) return {};
    return groupedPlayers.byId;
  }, [groupedPlayers]);

  // Helper to change search parameters
  const updateSearchParams = useCallback(
    (
      updates: Record<string, string | undefined>,
      { keepCustomResult = false }: { keepCustomResult?: boolean } = {}
    ) => {
      const newParams = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, val]) => {
        if (val === undefined || val === '') {
          newParams.delete(key);
        } else {
          newParams.set(key, val);
        }
      });
      setSearchParams(newParams, { replace: true });
      // Reset mutation view back to standard query when primary parameters change
      if (!keepCustomResult) setShowMutationResult(false);
    },
    [searchParams, setSearchParams]
  );

  const handleHorizonChange = (h: SquadHorizon) => {
    updateSearchParams({ horizon: h });
  };

  // Budget draft derived state
  const parsedDraft = parseBudgetDraft(budgetDraft);
  const isDraftValid = parsedDraft !== null && isBudgetInRange(parsedDraft);
  const isBudgetPending = parsedDraft === null || parsedDraft !== validBudget;
  const isDraftEdited = budgetDraft !== validBudget.toFixed(1);
  const isBudgetErrorVisible = showBudgetError && !isDraftValid;
  const stepperBase = parsedDraft ?? validBudget;

  const adjustBudgetBy = (amount: number) => {
    const next = Math.max(
      BUDGET_MIN,
      Math.min(BUDGET_MAX, roundBudget(stepperBase + amount))
    );
    setBudgetDraft(next.toFixed(1));
  };

  const resetBudgetDraft = () => {
    setBudgetDraft(validBudget.toFixed(1));
    setShowBudgetError(false);
  };

  // 5. Player Pickers Autocomplete Logic
  const pickerSearchResults = useMemo<ProcessedPlayer[]>(() => {
    const q = pickerQuery.trim().toLowerCase();
    if (!q || allPlayers.length === 0) return [];
    return allPlayers
      .filter((p) => {
        const fullName =
          `${p.generalInfo.first_name} ${p.generalInfo.web_name}`.toLowerCase();
        return (
          fullName.includes(q) &&
          !includedIds.includes(p.generalInfo.id) &&
          !excludedIds.includes(p.generalInfo.id)
        );
      })
      .slice(0, 5); // Limit to top 5 matches
  }, [pickerQuery, allPlayers, includedIds, excludedIds]);

  const includePlayer = (id: number) => {
    if (!includedIds.includes(id)) {
      setIncludedIds((prev) => [...prev, id]);
    }
    setPickerQuery('');
  };

  const excludePlayer = (id: number) => {
    if (!excludedIds.includes(id)) {
      setExcludedIds((prev) => [...prev, id]);
    }
    setPickerQuery('');
  };

  const removeIncluded = (id: number) => {
    setIncludedIds((prev) => prev.filter((item) => item !== id));
  };

  const removeExcluded = (id: number) => {
    setExcludedIds((prev) => prev.filter((item) => item !== id));
  };

  // Run Custom Advanced Optimization
  const runCustomOptimize = async (budget: number) => {
    await optimize({
      horizon: validHorizon,
      budget,
      benchWeight,
      benchGkWeight,
      include: includedIds,
      exclude: excludedIds,
    });
    setShowMutationResult(true);
  };

  const handleOptimizeCustom = () => {
    void runCustomOptimize(validBudget);
  };

  // Apply the drafted budget: the only path that changes the URL budget.
  const handleBudgetSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSquadLoading) return;
    if (parsedDraft === null || !isBudgetInRange(parsedDraft)) {
      setShowBudgetError(true);
      return;
    }
    setShowBudgetError(false);
    setBudgetDraft(parsedDraft.toFixed(1));
    if (parsedDraft === validBudget) return;

    // In custom mode keep the constraints and rebuild the custom squad for the new budget.
    const keepCustomResult = showMutationResult;
    updateSearchParams(
      { budget: parsedDraft.toFixed(1) },
      { keepCustomResult }
    );
    if (keepCustomResult) {
      void runCustomOptimize(parsedDraft);
    }
  };

  // Reset to default optimal squad
  const handleResetToDefault = () => {
    setShowMutationResult(false);
    setBenchWeight(0.2);
    setBenchGkWeight(0.01);
    setIncludedIds([]);
    setExcludedIds([]);
    setPickerQuery('');
  };

  // 6. Select current squad and stats based on active view.
  // Only show a squad built for the applied horizon and budget, so a stale
  // result (or a failed rebuild) is never labelled as the current squad.
  const displaySquad = showMutationResult
    ? isSquadFor(mutationSquad, validHorizon, validBudget)
      ? mutationSquad
      : undefined
    : isSquadFor(querySquad, validHorizon, validBudget)
    ? querySquad
    : undefined;
  const isSquadLoading = isQueryLoading || isMutationLoading;
  const activeError = showMutationResult
    ? mutationError || queryError
    : queryError;

  // Sync mutation state: if mutation was requested but failed, or if we need to fall back
  useEffect(() => {
    if (isMutationSuccess && mutationSquad) {
      setShowMutationResult(true);
    }
  }, [isMutationSuccess, mutationSquad]);

  // Sane text for the notice state
  const isHeuristicFallback = displaySquad ? !displaySquad.optimal : false;

  // Resolve players in included/excluded lists to display nice chips
  const includedPlayers = useMemo(() => {
    return includedIds
      .map((id) => playersMap[id])
      .filter((p): p is ProcessedPlayer => p !== undefined);
  }, [includedIds, playersMap]);

  const excludedPlayers = useMemo(() => {
    return excludedIds
      .map((id) => playersMap[id])
      .filter((p): p is ProcessedPlayer => p !== undefined);
  }, [excludedIds, playersMap]);

  // Loading and Error check
  const isGlobalLoading = isPlayersLoading || isTeamsLoading;
  const globalError = playersError || teamsError;

  if (globalError) {
    return (
      <div className="optimizer-page optimizer-page--error">
        <div className="optimizer-page__container">
          <ErrorState
            title="Failed to Load Optimizer"
            message={globalError.message}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="optimizer-page">
      <div className="optimizer-page__container">
        <PageSection
          title="Squad Optimizer"
          subtitle="Leverage mixed-integer linear programming (MILP) to find the mathematically perfect 15-player squad."
        >
          <div className="optimizer-layout">
            {/* LEFT COLUMN: Controls & Advanced constraints */}
            <div className="optimizer-layout__sidebar">
              {/* Primary Controls */}
              <div className="optimizer-card">
                <h3 className="optimizer-card__title">Primary Parameters</h3>

                {/* Horizon Tab Picker */}
                <div className="optimizer-control-group">
                  <label className="optimizer-control-label" id="horizon-label">
                    Optimization Horizon
                  </label>
                  <HorizonTabs
                    value={validHorizon}
                    onChange={handleHorizonChange}
                  />
                </div>

                {/* Budget Multi-Selector: edits a draft; "Update squad" applies it */}
                <form
                  className="optimizer-control-group budget-form"
                  onSubmit={handleBudgetSubmit}
                  noValidate
                >
                  <label
                    className="optimizer-control-label"
                    htmlFor="budget-input"
                  >
                    Squad Budget (£m)
                  </label>
                  <div
                    className={`budget-picker ${
                      isBudgetErrorVisible
                        ? 'budget-picker--invalid'
                        : isBudgetPending
                        ? 'budget-picker--pending'
                        : ''
                    }`}
                  >
                    <button
                      type="button"
                      className="budget-picker__btn"
                      onClick={() => adjustBudgetBy(-1.0)}
                      title="Decrease by £1.0m"
                      aria-label="Decrease budget by £1.0m"
                      disabled={stepperBase <= BUDGET_MIN}
                    >
                      -1.0
                    </button>
                    <button
                      type="button"
                      className="budget-picker__btn budget-picker__btn--small"
                      onClick={() => adjustBudgetBy(-0.1)}
                      title="Decrease by £0.1m"
                      aria-label="Decrease budget by £0.1m"
                      disabled={stepperBase <= BUDGET_MIN}
                    >
                      -0.1
                    </button>
                    <input
                      id="budget-input"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      className="budget-picker__input"
                      value={budgetDraft}
                      onChange={(e) => setBudgetDraft(e.target.value)}
                      onBlur={() => {
                        if (isDraftValid && parsedDraft !== null) {
                          setBudgetDraft(parsedDraft.toFixed(1));
                        } else {
                          setShowBudgetError(true);
                        }
                      }}
                      aria-invalid={isBudgetErrorVisible}
                      aria-describedby="budget-status"
                    />
                    <button
                      type="button"
                      className="budget-picker__btn budget-picker__btn--small"
                      onClick={() => adjustBudgetBy(0.1)}
                      title="Increase by £0.1m"
                      aria-label="Increase budget by £0.1m"
                      disabled={stepperBase >= BUDGET_MAX}
                    >
                      +0.1
                    </button>
                    <button
                      type="button"
                      className="budget-picker__btn"
                      onClick={() => adjustBudgetBy(1.0)}
                      title="Increase by £1.0m"
                      aria-label="Increase budget by £1.0m"
                      disabled={stepperBase >= BUDGET_MAX}
                    >
                      +1.0
                    </button>
                  </div>

                  <div
                    id="budget-status"
                    className={`budget-status ${
                      isBudgetErrorVisible
                        ? 'budget-status--error'
                        : isBudgetPending
                        ? 'budget-status--pending'
                        : ''
                    }`}
                    aria-live="polite"
                  >
                    <span>
                      {isBudgetErrorVisible
                        ? `Enter an amount between ${formatPrice(
                            BUDGET_MIN
                          )} and ${formatPrice(BUDGET_MAX)}.`
                        : isBudgetPending
                        ? `Not applied yet. Showing squad for ${formatPrice(
                            validBudget
                          )}.`
                        : isSquadLoading
                        ? `Updating squad for ${formatPrice(validBudget)}…`
                        : `Showing squad for ${formatPrice(validBudget)}.`}
                    </span>
                    {isDraftEdited && (
                      <button
                        type="button"
                        className="budget-status__reset"
                        onClick={resetBudgetDraft}
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!isBudgetPending || !isDraftValid}
                    loading={isSquadLoading}
                    className="budget-form__submit"
                  >
                    {isSquadLoading ? 'Updating squad…' : 'Update squad'}
                  </Button>
                </form>
              </div>

              {/* Advanced Accordion Card */}
              <div className="optimizer-card optimizer-card--advanced">
                <button
                  type="button"
                  className="advanced-toggle"
                  onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                  aria-expanded={isAdvancedOpen}
                >
                  <span className="advanced-toggle__title">
                    Advanced Constraints
                  </span>
                  <span
                    className={`advanced-toggle__icon ${
                      isAdvancedOpen ? 'is-open' : ''
                    }`}
                  >
                    ▼
                  </span>
                </button>

                <div
                  className={`advanced-content ${
                    isAdvancedOpen ? 'is-open' : ''
                  }`}
                >
                  <div className="advanced-content__inner">
                    {/* Bench Weight Sliders */}
                    <div className="optimizer-control-group">
                      <div className="slider-header">
                        <label
                          className="optimizer-control-label"
                          htmlFor="bench-weight"
                        >
                          Bench Outfield Weight
                        </label>
                        <span className="slider-value">
                          {benchWeight.toFixed(2)}
                        </span>
                      </div>
                      <input
                        id="bench-weight"
                        type="range"
                        className="advanced-slider"
                        min="0.0"
                        max="1.0"
                        step="0.05"
                        value={benchWeight}
                        onChange={(e) =>
                          setBenchWeight(parseFloat(e.target.value))
                        }
                        disabled={isSquadLoading}
                      />
                      <span className="advanced-hint">
                        Weight multiplier for outfield substitutes. Default
                        0.20.
                      </span>
                    </div>

                    <div className="optimizer-control-group">
                      <div className="slider-header">
                        <label
                          className="optimizer-control-label"
                          htmlFor="bench-gk-weight"
                        >
                          Bench GK Weight
                        </label>
                        <span className="slider-value">
                          {benchGkWeight.toFixed(2)}
                        </span>
                      </div>
                      <input
                        id="bench-gk-weight"
                        type="range"
                        className="advanced-slider"
                        min="0.0"
                        max="0.5"
                        step="0.01"
                        value={benchGkWeight}
                        onChange={(e) =>
                          setBenchGkWeight(parseFloat(e.target.value))
                        }
                        disabled={isSquadLoading}
                      />
                      <span className="advanced-hint">
                        Weight multiplier for reserve goalkeeper. Default 0.01.
                      </span>
                    </div>

                    {/* Inclusion & Exclusion Picker */}
                    <div className="optimizer-control-group">
                      <label
                        className="optimizer-control-label"
                        htmlFor="player-picker-input"
                      >
                        Lock or Ban Players
                      </label>
                      <div className="player-picker">
                        <input
                          id="player-picker-input"
                          type="text"
                          className="player-picker__input"
                          placeholder="Search player name..."
                          value={pickerQuery}
                          onChange={(e) => setPickerQuery(e.target.value)}
                          disabled={isSquadLoading || isGlobalLoading}
                        />
                        {pickerSearchResults.length > 0 && (
                          <div
                            className="player-picker__dropdown"
                            role="listbox"
                          >
                            {pickerSearchResults.map((player) => {
                              const teamName =
                                teamNamesById[player.generalInfo.team] ||
                                'Unknown';
                              return (
                                <div
                                  key={`picker-res-${player.generalInfo.id}`}
                                  className="player-picker__result-row"
                                  role="option"
                                  aria-selected="false"
                                >
                                  <div className="player-picker__result-identity">
                                    <div className="player-picker__result-name">
                                      {player.generalInfo.web_name}
                                    </div>
                                    <div className="player-picker__result-meta">
                                      <TeamBadge
                                        teamName={teamName}
                                        size="sm"
                                      />
                                      <PositionBadge
                                        elementType={
                                          player.generalInfo.element_type
                                        }
                                        short
                                      />
                                      <span className="player-picker__result-price">
                                        {formatPrice(
                                          player.generalInfo.now_cost
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="player-picker__result-actions">
                                    <button
                                      type="button"
                                      className="picker-action-btn picker-action-btn--include"
                                      onClick={() =>
                                        includePlayer(player.generalInfo.id)
                                      }
                                      title="Force player to be in the squad"
                                    >
                                      + Lock
                                    </button>
                                    <button
                                      type="button"
                                      className="picker-action-btn picker-action-btn--exclude"
                                      onClick={() =>
                                        excludePlayer(player.generalInfo.id)
                                      }
                                      title="Prevent player from being selected"
                                    >
                                      + Ban
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* List of current constraints */}
                    <div className="constraints-summary">
                      {/* Included List */}
                      <div className="constraints-list">
                        <h4 className="constraints-list__title">
                          Locked-in ({includedPlayers.length})
                        </h4>
                        {includedPlayers.length === 0 ? (
                          <div className="constraints-list__empty">
                            No locked players
                          </div>
                        ) : (
                          <div className="constraints-list__grid">
                            {includedPlayers.map((p) => (
                              <div
                                key={`inc-chip-${p.generalInfo.id}`}
                                className="constraint-chip constraint-chip--include"
                              >
                                <span
                                  className="constraint-chip__name"
                                  title={p.generalInfo.web_name}
                                >
                                  {p.generalInfo.web_name}
                                </span>
                                <button
                                  type="button"
                                  className="constraint-chip__remove"
                                  onClick={() =>
                                    removeIncluded(p.generalInfo.id)
                                  }
                                  title="Remove lock"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Excluded List */}
                      <div className="constraints-list">
                        <h4 className="constraints-list__title">
                          Banned ({excludedPlayers.length})
                        </h4>
                        {excludedPlayers.length === 0 ? (
                          <div className="constraints-list__empty">
                            No banned players
                          </div>
                        ) : (
                          <div className="constraints-list__grid">
                            {excludedPlayers.map((p) => (
                              <div
                                key={`exc-chip-${p.generalInfo.id}`}
                                className="constraint-chip constraint-chip--exclude"
                              >
                                <span
                                  className="constraint-chip__name"
                                  title={p.generalInfo.web_name}
                                >
                                  {p.generalInfo.web_name}
                                </span>
                                <button
                                  type="button"
                                  className="constraint-chip__remove"
                                  onClick={() =>
                                    removeExcluded(p.generalInfo.id)
                                  }
                                  title="Remove ban"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons inside accordion */}
                    <div className="advanced-actions">
                      <Button
                        type="button"
                        variant="primary"
                        onClick={handleOptimizeCustom}
                        disabled={isSquadLoading}
                        loading={isSquadLoading && showMutationResult}
                        className="advanced-actions__btn"
                      >
                        Optimize with Constraints
                      </Button>
                      {(showMutationResult ||
                        includedIds.length > 0 ||
                        excludedIds.length > 0 ||
                        benchWeight !== 0.2 ||
                        benchGkWeight !== 0.01) && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={handleResetToDefault}
                          disabled={isSquadLoading}
                          className="advanced-actions__btn"
                        >
                          Reset to Default
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Pitch view & Squad statistics */}
            <div className="optimizer-layout__main">
              {/* Active configuration summary bar */}
              <div className="optimizer-status-bar">
                {showMutationResult ? (
                  <div className="optimizer-status-bar__content">
                    <div className="optimizer-status-bar__badge optimizer-status-bar__badge--custom">
                      Custom Constraints Active
                    </div>
                    <div className="optimizer-status-bar__details">
                      Locks: {includedIds.length} · Bans: {excludedIds.length} ·
                      Weights: {benchWeight.toFixed(2)} /{' '}
                      {benchGkWeight.toFixed(2)}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleResetToDefault}
                      disabled={isSquadLoading}
                    >
                      Clear
                    </Button>
                  </div>
                ) : (
                  <div className="optimizer-status-bar__content">
                    <div className="optimizer-status-bar__badge optimizer-status-bar__badge--default">
                      Default Optimal Squad
                    </div>
                    <div className="optimizer-status-bar__details">
                      No custom filters or advanced weights applied.
                    </div>
                  </div>
                )}
              </div>

              {/* Inline Error Displays */}
              {activeError && (
                <div className="optimizer-error-container">
                  <ErrorState
                    title="Optimization Error"
                    message={
                      activeError.message ||
                      'An unexpected error occurred while computing the squad.'
                    }
                    onRetry={
                      showMutationResult ? handleOptimizeCustom : undefined
                    }
                  />
                </div>
              )}

              {/* Heuristic Fallback Warning Notice */}
              {isHeuristicFallback && !isSquadLoading && !activeError && (
                <div className="optimizer-notice">
                  <div className="optimizer-notice__icon">ℹ</div>
                  <div className="optimizer-notice__content">
                    <div className="optimizer-notice__title">
                      Heuristic Fallback Used
                    </div>
                    <div className="optimizer-notice__message">
                      The optimizer resolved using a fast heuristic fallback.
                      The output is exceptionally strong, but there is a slight
                      chance a marginally better combination exists.
                    </div>
                  </div>
                </div>
              )}

              {/* Squad KPI Stat Cards */}
              <div className="stats-grid">
                <div className="stats-card">
                  <StatValue
                    label="Objective Score"
                    value={
                      isSquadLoading
                        ? '—'
                        : formatValue(displaySquad?.totalValue, 2)
                    }
                    hint="Starter value + captain bonus + weighted bench"
                  />
                </div>
                <div className="stats-card">
                  <StatValue
                    label="Squad Cost"
                    value={
                      isSquadLoading
                        ? '—'
                        : `${formatPrice(displaySquad?.totalCost || 0)}`
                    }
                    hint={`Limit: ${formatPrice(validBudget)}`}
                    tone={
                      displaySquad && displaySquad.totalCost > validBudget
                        ? 'danger'
                        : 'default'
                    }
                  />
                </div>
                <div className="stats-card">
                  <StatValue
                    label="Remaining Bank"
                    value={
                      isSquadLoading
                        ? '—'
                        : displaySquad
                        ? `${formatPrice(
                            Math.max(0, validBudget - displaySquad.totalCost)
                          )}`
                        : '—'
                    }
                    hint="Unspent squad value"
                    tone="success"
                  />
                </div>
                <div className="stats-card">
                  <StatValue
                    label="Candidates Evaluated"
                    value={
                      isSquadLoading
                        ? '—'
                        : displaySquad
                        ? displaySquad.candidatesConsidered.toLocaleString()
                        : '—'
                    }
                    hint="Filtered combinations"
                  />
                </div>
              </div>

              {/* Main Pitch View */}
              <div className="pitch-wrapper">
                <SquadPitchView
                  picks={displaySquad?.picks || []}
                  formation={displaySquad?.formation}
                  teamNamesById={teamNamesById}
                  horizon={validHorizon}
                  isLoading={isSquadLoading}
                />
              </div>
            </div>
          </div>
        </PageSection>
      </div>
    </div>
  );
};

export default OptimizerPage;
