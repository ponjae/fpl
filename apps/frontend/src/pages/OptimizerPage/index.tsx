import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ProcessedPlayer,
  SquadHorizon,
  isSquadHorizon,
  SQUAD_SIZE,
  DEFAULT_BUDGET
} from '@fpl/contracts/fpl';

import { useGetOptimalSquad, useOptimizeSquad } from '../../features/squad/hooks';
import { useGetPlayers } from '../../features/players/hooks';
import { useGetTeamNames } from '../../features/teams/hooks';

import Button from '../../components/Button';
import HorizonTabs from '../../components/HorizonTabs';
import PageSection from '../../components/PageSection';
import TeamBadge from '../../components/TeamBadge';
import PositionBadge from '../../components/PositionBadge';
import ErrorState from '../../components/ErrorState';
import StatValue from '../../components/StatValue';
import SquadPitchView from '../../components/SquadPitchView';

import { formatPrice, formatValue } from '../../utils';
import './index.scss';

export const OptimizerPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Read & Validate Search Params (Horizon and Budget)
  const rawHorizon = searchParams.get('horizon');
  const validHorizon: SquadHorizon = isSquadHorizon(rawHorizon) ? rawHorizon : 'value5';

  const rawBudget = searchParams.get('budget');
  const validBudget = useMemo(() => {
    if (!rawBudget) return DEFAULT_BUDGET;
    const parsed = parseFloat(rawBudget);
    if (!isNaN(parsed) && parsed >= 50.0 && parsed <= 150.0) {
      return parseFloat(parsed.toFixed(1)); // round to 1 decimal place
    }
    return DEFAULT_BUDGET;
  }, [rawBudget]);

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
    (updates: Record<string, string | undefined>) => {
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
      setShowMutationResult(false);
    },
    [searchParams, setSearchParams]
  );

  const handleHorizonChange = (h: SquadHorizon) => {
    updateSearchParams({ horizon: h });
  };

  const handleBudgetChange = (b: number) => {
    // Clamp to [50.0, 150.0] and format to 1 decimal place
    const clamped = Math.max(50.0, Math.min(150.0, b));
    updateSearchParams({ budget: clamped.toFixed(1) });
  };

  const adjustBudgetBy = (amount: number) => {
    handleBudgetChange(validBudget + amount);
  };

  // 5. Player Pickers Autocomplete Logic
  const pickerSearchResults = useMemo<ProcessedPlayer[]>(() => {
    const q = pickerQuery.trim().toLowerCase();
    if (!q || allPlayers.length === 0) return [];
    return allPlayers
      .filter((p) => {
        const fullName = `${p.generalInfo.first_name} ${p.generalInfo.web_name}`.toLowerCase();
        return fullName.includes(q) &&
          !includedIds.includes(p.generalInfo.id) &&
          !excludedIds.includes(p.generalInfo.id);
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
  const handleOptimizeCustom = async () => {
    await optimize({
      horizon: validHorizon,
      budget: validBudget,
      benchWeight,
      benchGkWeight,
      include: includedIds,
      exclude: excludedIds,
    });
    setShowMutationResult(true);
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

  // 6. Select current squad and stats based on active view
  const displaySquad = showMutationResult && mutationSquad ? mutationSquad : querySquad;
  const isSquadLoading = isQueryLoading || isMutationLoading;
  const activeError = showMutationResult ? (mutationError || queryError) : queryError;

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
                  <label className="optimizer-control-label" id="horizon-label">Optimization Horizon</label>
                  <HorizonTabs value={validHorizon} onChange={handleHorizonChange} />
                </div>

                {/* Budget Multi-Selector */}
                <div className="optimizer-control-group">
                  <label className="optimizer-control-label" htmlFor="budget-input">Squad Budget (£m)</label>
                  <div className="budget-picker">
                    <button
                      type="button"
                      className="budget-picker__btn"
                      onClick={() => adjustBudgetBy(-1.0)}
                      title="Decrease by £1.0m"
                      disabled={validBudget <= 50.0 || isSquadLoading}
                    >
                      -1.0
                    </button>
                    <button
                      type="button"
                      className="budget-picker__btn budget-picker__btn--small"
                      onClick={() => adjustBudgetBy(-0.1)}
                      title="Decrease by £0.1m"
                      disabled={validBudget <= 50.0 || isSquadLoading}
                    >
                      -0.1
                    </button>
                    <input
                      id="budget-input"
                      type="number"
                      className="budget-picker__input"
                      value={validBudget}
                      step={0.1}
                      min={50.0}
                      max={150.0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) handleBudgetChange(val);
                      }}
                      disabled={isSquadLoading}
                    />
                    <button
                      type="button"
                      className="budget-picker__btn budget-picker__btn--small"
                      onClick={() => adjustBudgetBy(0.1)}
                      title="Increase by £0.1m"
                      disabled={validBudget >= 150.0 || isSquadLoading}
                    >
                      +0.1
                    </button>
                    <button
                      type="button"
                      className="budget-picker__btn"
                      onClick={() => adjustBudgetBy(1.0)}
                      title="Increase by £1.0m"
                      disabled={validBudget >= 150.0 || isSquadLoading}
                    >
                      +1.0
                    </button>
                  </div>
                </div>
              </div>

              {/* Advanced Accordion Card */}
              <div className="optimizer-card optimizer-card--advanced">
                <button
                  type="button"
                  className="advanced-toggle"
                  onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                  aria-expanded={isAdvancedOpen}
                >
                  <span className="advanced-toggle__title">Advanced Constraints</span>
                  <span className={`advanced-toggle__icon ${isAdvancedOpen ? 'is-open' : ''}`}>
                    ▼
                  </span>
                </button>

                <div className={`advanced-content ${isAdvancedOpen ? 'is-open' : ''}`}>
                  <div className="advanced-content__inner">
                    {/* Bench Weight Sliders */}
                    <div className="optimizer-control-group">
                      <div className="slider-header">
                        <label className="optimizer-control-label" htmlFor="bench-weight">Bench Outfield Weight</label>
                        <span className="slider-value">{benchWeight.toFixed(2)}</span>
                      </div>
                      <input
                        id="bench-weight"
                        type="range"
                        className="advanced-slider"
                        min="0.0"
                        max="1.0"
                        step="0.05"
                        value={benchWeight}
                        onChange={(e) => setBenchWeight(parseFloat(e.target.value))}
                        disabled={isSquadLoading}
                      />
                      <span className="advanced-hint">
                        Weight multiplier for outfield substitutes. Default 0.20.
                      </span>
                    </div>

                    <div className="optimizer-control-group">
                      <div className="slider-header">
                        <label className="optimizer-control-label" htmlFor="bench-gk-weight">Bench GK Weight</label>
                        <span className="slider-value">{benchGkWeight.toFixed(2)}</span>
                      </div>
                      <input
                        id="bench-gk-weight"
                        type="range"
                        className="advanced-slider"
                        min="0.0"
                        max="0.5"
                        step="0.01"
                        value={benchGkWeight}
                        onChange={(e) => setBenchGkWeight(parseFloat(e.target.value))}
                        disabled={isSquadLoading}
                      />
                      <span className="advanced-hint">
                        Weight multiplier for reserve goalkeeper. Default 0.01.
                      </span>
                    </div>

                    {/* Inclusion & Exclusion Picker */}
                    <div className="optimizer-control-group">
                      <label className="optimizer-control-label" htmlFor="player-picker-input">Lock or Ban Players</label>
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
                          <div className="player-picker__dropdown" role="listbox">
                            {pickerSearchResults.map((player) => {
                              const teamName = teamNamesById[player.generalInfo.team] || 'Unknown';
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
                                      <TeamBadge teamName={teamName} size="sm" />
                                      <PositionBadge elementType={player.generalInfo.element_type} short />
                                      <span className="player-picker__result-price">
                                        {formatPrice(player.generalInfo.now_cost)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="player-picker__result-actions">
                                    <button
                                      type="button"
                                      className="picker-action-btn picker-action-btn--include"
                                      onClick={() => includePlayer(player.generalInfo.id)}
                                      title="Force player to be in the squad"
                                    >
                                      + Lock
                                    </button>
                                    <button
                                      type="button"
                                      className="picker-action-btn picker-action-btn--exclude"
                                      onClick={() => excludePlayer(player.generalInfo.id)}
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
                        <h4 className="constraints-list__title">Locked-in ({includedPlayers.length})</h4>
                        {includedPlayers.length === 0 ? (
                          <div className="constraints-list__empty">No locked players</div>
                        ) : (
                          <div className="constraints-list__grid">
                            {includedPlayers.map((p) => (
                              <div key={`inc-chip-${p.generalInfo.id}`} className="constraint-chip constraint-chip--include">
                                <span className="constraint-chip__name" title={p.generalInfo.web_name}>
                                  {p.generalInfo.web_name}
                                </span>
                                <button
                                  type="button"
                                  className="constraint-chip__remove"
                                  onClick={() => removeIncluded(p.generalInfo.id)}
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
                        <h4 className="constraints-list__title">Banned ({excludedPlayers.length})</h4>
                        {excludedPlayers.length === 0 ? (
                          <div className="constraints-list__empty">No banned players</div>
                        ) : (
                          <div className="constraints-list__grid">
                            {excludedPlayers.map((p) => (
                              <div key={`exc-chip-${p.generalInfo.id}`} className="constraint-chip constraint-chip--exclude">
                                <span className="constraint-chip__name" title={p.generalInfo.web_name}>
                                  {p.generalInfo.web_name}
                                </span>
                                <button
                                  type="button"
                                  className="constraint-chip__remove"
                                  onClick={() => removeExcluded(p.generalInfo.id)}
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
                      {(showMutationResult || includedIds.length > 0 || excludedIds.length > 0 || benchWeight !== 0.2 || benchGkWeight !== 0.01) && (
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
                      Locks: {includedIds.length} · Bans: {excludedIds.length} · Weights: {benchWeight.toFixed(2)} / {benchGkWeight.toFixed(2)}
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
                    message={activeError.message || "An unexpected error occurred while computing the squad."}
                    onRetry={showMutationResult ? handleOptimizeCustom : undefined}
                  />
                </div>
              )}

              {/* Heuristic Fallback Warning Notice */}
              {isHeuristicFallback && !isSquadLoading && !activeError && (
                <div className="optimizer-notice">
                  <div className="optimizer-notice__icon">ℹ</div>
                  <div className="optimizer-notice__content">
                    <div className="optimizer-notice__title">Heuristic Fallback Used</div>
                    <div className="optimizer-notice__message">
                      The optimizer resolved using a fast heuristic fallback. The output is exceptionally strong, but there is a slight chance a marginally better combination exists.
                    </div>
                  </div>
                </div>
              )}

              {/* Squad KPI Stat Cards */}
              <div className="stats-grid">
                <div className="stats-card">
                  <StatValue
                    label="Objective Score"
                    value={isSquadLoading ? '—' : formatValue(displaySquad?.totalValue, 2)}
                    hint="Starter value + captain bonus + weighted bench"
                  />
                </div>
                <div className="stats-card">
                  <StatValue
                    label="Squad Cost"
                    value={isSquadLoading ? '—' : `${formatPrice(displaySquad?.totalCost || 0)}`}
                    hint={`Limit: ${formatPrice(validBudget)}`}
                    tone={displaySquad && displaySquad.totalCost > validBudget ? 'danger' : 'default'}
                  />
                </div>
                <div className="stats-card">
                  <StatValue
                    label="Remaining Bank"
                    value={isSquadLoading ? '—' : displaySquad ? `${formatPrice(Math.max(0, validBudget - displaySquad.totalCost))}` : '—'}
                    hint="Unspent squad value"
                    tone="success"
                  />
                </div>
                <div className="stats-card">
                  <StatValue
                    label="Candidates Evaluated"
                    value={isSquadLoading ? '—' : displaySquad ? displaySquad.candidatesConsidered.toLocaleString() : '—'}
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
