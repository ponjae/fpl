import React from 'react';
import { SquadHorizon } from '@fpl/contracts/fpl';
import Button from '../../../../components/Button';
import HorizonTabs from '../../../../components/HorizonTabs';
import './index.scss';

export type PlayerFiltersProps = {
  search: string;
  onSearchChange: (val: string) => void;
  position: string;
  onPositionChange: (val: string) => void;
  team: string;
  onTeamChange: (val: string) => void;
  horizon: SquadHorizon;
  onHorizonChange: (val: SquadHorizon) => void;
  teamOptions: { id: number; name: string }[];
  onClearFilters: () => void;
  isAnyFilterActive: boolean;
};

export const PlayerFilters: React.FC<PlayerFiltersProps> = ({
  search,
  onSearchChange,
  position,
  onPositionChange,
  team,
  onTeamChange,
  horizon,
  onHorizonChange,
  teamOptions,
  onClearFilters,
  isAnyFilterActive,
}) => {
  return (
    <div className="player-filters">
      <div className="player-filters__main">
        <div className="player-filters__field player-filters__field--search">
          <div className="player-filters__search-wrapper">
            <svg
              className="player-filters__search-icon"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="player-filters__input"
              placeholder="Search players by name..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        <div className="player-filters__field">
          <select
            className="player-filters__select"
            value={position}
            onChange={(e) => onPositionChange(e.target.value)}
            aria-label="Filter by position"
          >
            <option value="">All Positions</option>
            <option value="GK">Goalkeeper (GK)</option>
            <option value="DEF">Defender (DEF)</option>
            <option value="MID">Midfielder (MID)</option>
            <option value="FWD">Forward (FWD)</option>
          </select>
        </div>

        <div className="player-filters__field">
          <select
            className="player-filters__select"
            value={team}
            onChange={(e) => onTeamChange(e.target.value)}
            aria-label="Filter by team"
          >
            <option value="">All Teams</option>
            {teamOptions.map((opt) => (
              <option key={opt.id} value={String(opt.id)}>
                {opt.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="player-filters__aside">
        <HorizonTabs value={horizon} onChange={onHorizonChange} />

        {isAnyFilterActive && (
          <Button
            className="player-filters__clear-btn"
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
};

export default PlayerFilters;
