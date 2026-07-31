import React, { useMemo } from 'react';
import { SquadPick, ProcessedPlayer, SquadHorizon } from '@fpl/contracts/fpl';
import classNames from 'classnames';
import TeamBadge from '../TeamBadge';
import PositionBadge from '../PositionBadge';
import { formatPrice, formatValue, getPositionShortLabel } from '../../utils';
import './index.scss';

export type SquadPitchPick = {
  player: ProcessedPlayer | null;
  starting: boolean;
  captain: boolean;
  value?: number | null;
  elementType?: number; // 1 = GK, 2 = DEF, 3 = MID, 4 = FWD (required if player is null)
};

export type SquadPitchViewProps = {
  picks?: SquadPitchPick[] | SquadPick[];
  formation?: string;
  teamNamesById: Record<number, string>;
  onPlayerClick?: (player: ProcessedPlayer) => void;
  onEmptySlotClick?: (elementType: number, starting: boolean) => void;
  horizon?: SquadHorizon;
  isLoading?: boolean;
};

type NormalizedPick = {
  player: ProcessedPlayer | null;
  starting: boolean;
  captain: boolean;
  value: number | null;
  elementType: number;
  originalIndex: number;
};

export const SquadPitchView: React.FC<SquadPitchViewProps> = ({
  picks = [],
  formation,
  teamNamesById,
  onPlayerClick,
  onEmptySlotClick,
  horizon = 'value5',
  isLoading = false,
}) => {
  const horizonText = useMemo(() => {
    if (horizon === 'value') return 'next gameweek';
    if (horizon === 'value5') return 'next 5 gameweeks';
    return 'rest of season';
  }, [horizon]);

  // Normalize picks to a unified format
  const normalizedPicks = useMemo<NormalizedPick[]>(() => {
    return picks.map((p, index) => {
      const player = p.player;
      const elementType =
        p.elementType || (player ? player.generalInfo.element_type : 1);
      
      let val: number | null = null;
      if (p.value !== undefined) {
        val = p.value;
      } else if (player) {
        // Resolve value from the correct horizon key
        const valueKey = horizon === 'value' ? 'value' : horizon === 'value5' ? 'value5' : 'value_remaining';
        val = player.playerValue[valueKey];
      }

      return {
        player,
        starting: p.starting,
        captain: p.captain || false,
        value: val,
        elementType,
        originalIndex: index,
      };
    });
  }, [picks, horizon]);

  // Group starters by position
  const startersGK = useMemo(() => normalizedPicks.filter((p) => p.starting && p.elementType === 1), [normalizedPicks]);
  const startersDEF = useMemo(() => normalizedPicks.filter((p) => p.starting && p.elementType === 2), [normalizedPicks]);
  const startersMID = useMemo(() => normalizedPicks.filter((p) => p.starting && p.elementType === 3), [normalizedPicks]);
  const startersFWD = useMemo(() => normalizedPicks.filter((p) => p.starting && p.elementType === 4), [normalizedPicks]);

  // Group bench players (GK first, then outfield)
  const benchGK = useMemo(() => normalizedPicks.filter((p) => !p.starting && p.elementType === 1), [normalizedPicks]);
  const benchOutfield = useMemo(() => normalizedPicks.filter((p) => !p.starting && p.elementType !== 1), [normalizedPicks]);
  const benchPicks = useMemo(() => [...benchGK, ...benchOutfield], [benchGK, benchOutfield]);

  // Render a skeleton chip
  const renderSkeletonChip = (key: string) => {
    return (
      <div key={key} className="squad-pitch-player squad-pitch-player--skeleton">
        <div className="squad-pitch-player__badge-row-shimmer">
          <div className="squad-pitch-player__badge-shimmer" />
          <div className="squad-pitch-player__pos-shimmer" />
        </div>
        <div className="squad-pitch-player__name-shimmer" />
        <div className="squad-pitch-player__stats-shimmer">
          <div className="squad-pitch-player__stat-shimmer-left" />
          <div className="squad-pitch-player__stat-shimmer-right" />
        </div>
      </div>
    );
  };

  // Render a player card chip (either active or placeholder)
  const renderPlayerChip = (pick: NormalizedPick) => {
    const { player, captain, value, elementType, starting } = pick;
    const positionShort = getPositionShortLabel(elementType);

    if (!player) {
      return (
        <button
          key={`empty-${elementType}-${starting}-${pick.originalIndex}`}
          type="button"
          className={classNames('squad-pitch-player squad-pitch-player--empty', {
            'squad-pitch-player--interactive': !!onEmptySlotClick,
          })}
          onClick={() => onEmptySlotClick?.(elementType, starting)}
          aria-label={`Add ${positionShort}`}
        >
          <div className="squad-pitch-player__empty-border" />
          <div className="squad-pitch-player__empty-content">
            <span className="squad-pitch-player__empty-icon">+</span>
            <span className="squad-pitch-player__empty-label">{positionShort}</span>
          </div>
        </button>
      );
    }

    const teamName = teamNamesById[player.generalInfo.team] || 'Unknown';
    const hasStatusIssue = player.generalInfo.status && player.generalInfo.status !== 'a';

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onPlayerClick?.(player);
      }
    };

    const tooltipText = `Value Score, ${horizonText}: season scoring rate plus recent form, adjusted for fixture difficulty and double or blank gameweeks. Higher is better. It ranks players against each other — it is not a points forecast.`;

    return (
      <div
        key={`player-${player.generalInfo.id}-${pick.originalIndex}`}
        className={classNames('squad-pitch-player', {
          'squad-pitch-player--captain': captain,
          'squad-pitch-player--interactive': !!onPlayerClick,
          'squad-pitch-player--status-issue': hasStatusIssue,
        })}
        onClick={() => onPlayerClick?.(player)}
        onKeyDown={handleKeyDown}
        role={onPlayerClick ? 'button' : undefined}
        tabIndex={onPlayerClick ? 0 : undefined}
        aria-label={`${player.generalInfo.web_name}, ${positionShort}, Price: ${formatPrice(player.generalInfo.now_cost)}, Value Score (${horizonText}): ${formatValue(value, 2)}${captain ? ', Captain' : ''}`}
      >
        {captain && <div className="squad-pitch-player__captain-badge" title="Captain">C</div>}
        
        <div className="squad-pitch-player__badge-row">
          <TeamBadge teamName={teamName} size="sm" />
          <span className="squad-pitch-player__position">
            <PositionBadge elementType={elementType} short />
          </span>
        </div>

        <div className="squad-pitch-player__name" title={player.generalInfo.web_name}>
          {player.generalInfo.web_name}
        </div>

        <div className="squad-pitch-player__stats">
          <div className="squad-pitch-player__stat-item">
            <span className="squad-pitch-player__stat-label">Price</span>
            <span className="squad-pitch-player__cost">
              {formatPrice(player.generalInfo.now_cost)}
            </span>
          </div>
          <div className="squad-pitch-player__stat-divider" />
          <div 
            className="squad-pitch-player__stat-item squad-pitch-player__stat-item--value"
            title={tooltipText}
          >
            <span className="squad-pitch-player__stat-label">Score</span>
            <span className="squad-pitch-player__value">
              {formatValue(value, 2)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="squad-pitch-view squad-pitch-view--loading" aria-label="Loading squad view" aria-busy="true">
        {/* 1. Tactical Pitch Field */}
        <div className="squad-pitch-view__field">
          {/* Field Markings */}
          <div className="squad-pitch-view__field-markings">
            <div className="squad-pitch-view__halfway-line" />
            <div className="squad-pitch-view__center-circle" />
            <div className="squad-pitch-view__penalty-box squad-pitch-view__penalty-box--top" />
            <div className="squad-pitch-view__penalty-box squad-pitch-view__penalty-box--bottom" />
          </div>

          {/* Starting Rows (Default 4-4-2 layout of skeletons) */}
          <div className="squad-pitch-view__rows">
            {/* Forwards Row (2) */}
            <div className="squad-pitch-view__row squad-pitch-view__row--fwd">
              {renderSkeletonChip('skeleton-fwd-1')}
              {renderSkeletonChip('skeleton-fwd-2')}
            </div>

            {/* Midfielders Row (4) */}
            <div className="squad-pitch-view__row squad-pitch-view__row--mid">
              {renderSkeletonChip('skeleton-mid-1')}
              {renderSkeletonChip('skeleton-mid-2')}
              {renderSkeletonChip('skeleton-mid-3')}
              {renderSkeletonChip('skeleton-mid-4')}
            </div>

            {/* Defenders Row (4) */}
            <div className="squad-pitch-view__row squad-pitch-view__row--def">
              {renderSkeletonChip('skeleton-def-1')}
              {renderSkeletonChip('skeleton-def-2')}
              {renderSkeletonChip('skeleton-def-3')}
              {renderSkeletonChip('skeleton-def-4')}
            </div>

            {/* Goalkeepers Row (1) */}
            <div className="squad-pitch-view__row squad-pitch-view__row--gk">
              {renderSkeletonChip('skeleton-gk-1')}
            </div>
          </div>
        </div>

        {/* 2. Bench Area */}
        <div className="squad-pitch-view__bench">
          <div className="squad-pitch-view__bench-header">
            <span className="squad-pitch-view__bench-title">Substitutes</span>
          </div>
          <div className="squad-pitch-view__bench-row">
            {renderSkeletonChip('skeleton-bench-1')}
            {renderSkeletonChip('skeleton-bench-2')}
            {renderSkeletonChip('skeleton-bench-3')}
            {renderSkeletonChip('skeleton-bench-4')}
          </div>
        </div>

        {/* 3. Legend / Footnote */}
        <div className="squad-pitch-view__legend">
          <span className="squad-pitch-view__legend-icon">ℹ</span>
          <span className="squad-pitch-view__legend-text">
            <strong>Score</strong> rates form and fixtures over the {horizonText}. Higher is better — it ranks players against each other, and is not a points forecast.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="squad-pitch-view" aria-label="Football pitch squad view">
      {/* 1. Tactical Pitch Field */}
      <div className="squad-pitch-view__field">
        {/* Field Markings */}
        <div className="squad-pitch-view__field-markings">
          <div className="squad-pitch-view__halfway-line" />
          <div className="squad-pitch-view__center-circle" />
          <div className="squad-pitch-view__penalty-box squad-pitch-view__penalty-box--top" />
          <div className="squad-pitch-view__penalty-box squad-pitch-view__penalty-box--bottom" />
        </div>

        {/* Starting Rows */}
        <div className="squad-pitch-view__rows">
          {/* Forwards Row */}
          <div className="squad-pitch-view__row squad-pitch-view__row--fwd" role="group" aria-label="Forwards">
            {startersFWD.map(renderPlayerChip)}
          </div>

          {/* Midfielders Row */}
          <div className="squad-pitch-view__row squad-pitch-view__row--mid" role="group" aria-label="Midfielders">
            {startersMID.map(renderPlayerChip)}
          </div>

          {/* Defenders Row */}
          <div className="squad-pitch-view__row squad-pitch-view__row--def" role="group" aria-label="Defenders">
            {startersDEF.map(renderPlayerChip)}
          </div>

          {/* Goalkeepers Row */}
          <div className="squad-pitch-view__row squad-pitch-view__row--gk" role="group" aria-label="Goalkeeper">
            {startersGK.map(renderPlayerChip)}
          </div>
        </div>
      </div>

      {/* 2. Bench Area */}
      <div className="squad-pitch-view__bench" aria-label="Bench players">
        <div className="squad-pitch-view__bench-header">
          <span className="squad-pitch-view__bench-title">Substitutes</span>
          {formation && <span className="squad-pitch-view__bench-formation">Formation: {formation}</span>}
        </div>
        <div className="squad-pitch-view__bench-row">
          {benchPicks.map(renderPlayerChip)}
        </div>
      </div>

      {/* 3. Legend / Footnote */}
      <div className="squad-pitch-view__legend">
        <span className="squad-pitch-view__legend-icon">ℹ</span>
        <span className="squad-pitch-view__legend-text">
          <strong>Score</strong> rates form and fixtures over the {horizonText}. Higher is better — it ranks players against each other, and is not a points forecast.
        </span>
      </div>
    </div>
  );
};

export default SquadPitchView;
