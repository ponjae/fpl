import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  ProcessedPlayer,
  SquadHorizon,
  MAX_PER_CLUB,
} from '@fpl/contracts/fpl';
import Button from '../../../../components/Button';
import TeamBadge from '../../../../components/TeamBadge';
import PositionBadge from '../../../../components/PositionBadge';
import { formatPrice, formatValue, getPositionShortLabel } from '../../../../utils';
import './index.scss';

export type PlayerPickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  elementType: number; // 1=GK, 2=DEF, 3=MID, 4=FWD
  onSelect: (player: ProcessedPlayer) => void;
  currentSquadIds: number[];
  teamCounts: Record<number, number>;
  budgetRemaining: number;
  replacedPlayerPrice?: number;
  currentHorizon: SquadHorizon;
  players: ProcessedPlayer[];
  teamNamesById: Record<number, string>;
};

type SortOption = 'horizonValue' | 'price_desc' | 'price_asc' | 'total_points' | 'form';

export const PlayerPickerModal: React.FC<PlayerPickerModalProps> = ({
  isOpen,
  onClose,
  elementType,
  onSelect,
  currentSquadIds,
  teamCounts,
  budgetRemaining,
  replacedPlayerPrice = 0,
  currentHorizon,
  players,
  teamNamesById,
}) => {
  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('horizonValue');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when open
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedTeam('all');
      setSortBy('horizonValue');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Team options for selection dropdown
  const teamOptions = useMemo(() => {
    return Object.entries(teamNamesById)
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [teamNamesById]);

  // Filter & Sort Pipeline
  const filteredAndSorted = useMemo(() => {
    // 1. Filter by position
    let result = players.filter((p) => p.generalInfo.element_type === elementType);

    // 2. Filter by search query (name)
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => {
        const fullName = `${p.generalInfo.first_name} ${p.generalInfo.web_name}`.toLowerCase();
        return fullName.includes(q) || p.generalInfo.web_name.toLowerCase().includes(q);
      });
    }

    // 3. Filter by team
    if (selectedTeam !== 'all') {
      const teamId = parseInt(selectedTeam, 10);
      if (!isNaN(teamId)) {
        result = result.filter((p) => p.generalInfo.team === teamId);
      }
    }

    // 4. Sort
    result.sort((a, b) => {
      if (sortBy === 'horizonValue') {
        const key = currentHorizon === 'value' ? 'value' : currentHorizon === 'value5' ? 'value5' : 'value_remaining';
        const valA = a.playerValue[key];
        const valB = b.playerValue[key];
        if (valA === null && valB === null) return 0;
        if (valA === null) return 1; // nulls last
        if (valB === null) return -1;
        return valB - valA; // descending
      }

      if (sortBy === 'price_desc') {
        return b.generalInfo.now_cost - a.generalInfo.now_cost;
      }

      if (sortBy === 'price_asc') {
        return a.generalInfo.now_cost - b.generalInfo.now_cost;
      }

      if (sortBy === 'total_points') {
        return (b.playerStats.total_points ?? 0) - (a.playerStats.total_points ?? 0);
      }

      if (sortBy === 'form') {
        const formA = a.playerStats.form ?? 0;
        const formB = b.playerStats.form ?? 0;
        return formB - formA;
      }

      return 0;
    });

    return result;
  }, [players, elementType, search, selectedTeam, sortBy, currentHorizon]);

  if (!isOpen) return null;

  const positionLabel = getPositionShortLabel(elementType);

  return (
    <div className="player-picker-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="player-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="player-picker-modal__header">
          <div className="player-picker-modal__header-title">
            Select {positionLabel}
          </div>
          <button type="button" className="player-picker-modal__close-btn" onClick={onClose} aria-label="Close dialog">
            &times;
          </button>
        </div>

        <div className="player-picker-modal__filters">
          <div className="player-picker-modal__filter-item">
            <label className="player-picker-modal__label" htmlFor="modal-search">Search Player</label>
            <input
              ref={searchInputRef}
              id="modal-search"
              type="text"
              className="player-picker-modal__input"
              placeholder="Enter last name or full name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="player-picker-modal__filter-item">
            <label className="player-picker-modal__label" htmlFor="modal-team">Filter by Club</label>
            <select
              id="modal-team"
              className="player-picker-modal__select"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
            >
              <option value="all">All Clubs</option>
              {teamOptions.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div className="player-picker-modal__filter-item">
            <label className="player-picker-modal__label" htmlFor="modal-sort">Sort by</label>
            <select
              id="modal-sort"
              className="player-picker-modal__select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
            >
              <option value="horizonValue">Horizon Value ({currentHorizon})</option>
              <option value="price_desc">Price (High to Low)</option>
              <option value="price_asc">Price (Low to High)</option>
              <option value="total_points">Total Points</option>
              <option value="form">Form</option>
            </select>
          </div>
        </div>

        <div className="player-picker-modal__results" role="listbox">
          {filteredAndSorted.length === 0 ? (
            <div className="player-picker-modal__empty">
              No players found matching your criteria.
            </div>
          ) : (
            filteredAndSorted.map((player) => {
              const teamId = player.generalInfo.team;
              const teamName = teamNamesById[teamId] || 'Unknown';
              const cost = player.generalInfo.now_cost;
              
              // Validate constraints
              const isAlreadySelected = currentSquadIds.includes(player.generalInfo.id);
              
              // Check max players from same club
              const currentClubCount = teamCounts[teamId] || 0;
              const isMaxClubExceeded = currentClubCount >= MAX_PER_CLUB && !isAlreadySelected;

              // Check budget
              const allowedMaxCost = budgetRemaining + replacedPlayerPrice;
              const isTooExpensive = cost > allowedMaxCost && !isAlreadySelected;

              // Status check
              const hasStatusIssue = player.generalInfo.status && player.generalInfo.status !== 'a';

              // Determine button state and label
              let buttonText = 'Add Player';
              let isDisabled = false;
              let warningLabel = '';

              if (isAlreadySelected) {
                buttonText = 'In Squad';
                isDisabled = true;
              } else if (isMaxClubExceeded) {
                buttonText = 'Club Limit';
                isDisabled = true;
                warningLabel = `Max ${MAX_PER_CLUB} per club`;
              } else if (isTooExpensive) {
                buttonText = 'Too Pricey';
                isDisabled = true;
                warningLabel = `Max cost: ${formatPrice(allowedMaxCost)}`;
              }

              const valKey = currentHorizon === 'value' ? 'value' : currentHorizon === 'value5' ? 'value5' : 'value_remaining';
              const horizonValue = player.playerValue[valKey];

              return (
                <div
                  key={player.generalInfo.id}
                  className={`player-picker-modal__row ${hasStatusIssue ? 'player-picker-modal__row--status-issue' : ''}`}
                >
                  <div className="player-picker-modal__row-identity">
                    <div className="player-picker-modal__row-name">
                      {player.generalInfo.first_name} {player.generalInfo.web_name}
                      {hasStatusIssue && (
                        <span className="player-picker-modal__status-tag" title="Availability status issue">
                          !
                        </span>
                      )}
                    </div>
                    <div className="player-picker-modal__row-meta">
                      <TeamBadge teamName={teamName} size="sm" showLabel />
                      <PositionBadge elementType={player.generalInfo.element_type} short />
                    </div>
                  </div>

                  <div className="player-picker-modal__row-stats">
                    <div className="player-picker-modal__stat">
                      <span className="player-picker-modal__stat-label">Price</span>
                      <span className="player-picker-modal__stat-value font-tabular">
                        {formatPrice(cost)}
                      </span>
                    </div>
                    <div className="player-picker-modal__stat">
                      <span className="player-picker-modal__stat-label">Value</span>
                      <span className="player-picker-modal__stat-value player-picker-modal__stat-value--success font-tabular">
                        {formatValue(horizonValue, 2)}
                      </span>
                    </div>
                    <div className="player-picker-modal__stat">
                      <span className="player-picker-modal__stat-label">Form</span>
                      <span className="player-picker-modal__stat-value font-tabular">
                        {formatValue(player.playerStats.form, 1)}
                      </span>
                    </div>
                    <div className="player-picker-modal__stat">
                      <span className="player-picker-modal__stat-label">Pts</span>
                      <span className="player-picker-modal__stat-value font-tabular">
                        {player.playerStats.total_points}
                      </span>
                    </div>
                  </div>

                  <div className="player-picker-modal__row-action">
                    {warningLabel && (
                      <span className="player-picker-modal__warning font-tabular">
                        {warningLabel}
                      </span>
                    )}
                    <Button
                      type="button"
                      variant={isDisabled ? 'ghost' : 'primary'}
                      size="sm"
                      onClick={() => onSelect(player)}
                      disabled={isDisabled}
                    >
                      {buttonText}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerPickerModal;
