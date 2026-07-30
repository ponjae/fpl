import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  ProcessedPlayer,
  PlayerSortKey,
  SortDirection,
  SquadHorizon,
  isPlayerSortKey,
  isSortDirection,
  isSquadHorizon,
} from '@fpl/contracts/fpl';
import { useSearchParams } from 'react-router-dom';
import Button from '../../components/Button';
import DataTable, { Column } from '../../components/DataTable';

// Components
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import PageSection from '../../components/PageSection';
import PlayerIdentity from '../../components/PlayerIdentity';
import PositionBadge from '../../components/PositionBadge';
import TableSkeleton from '../../components/TableSkeleton';
import TeamBadge from '../../components/TeamBadge';
import PlayerFilters from '../../features/players/components/PlayerFilters';
import { useGetPlayers } from '../../features/players/hooks';
import { useGetTeamNames } from '../../features/teams/hooks';
import { useNavigate } from '../../routes/hooks';
import { Routes } from '../../routes/types';
import {
  formatPrice,
  formatValue,
  formatPoints,
  formatPercent,
} from '../../utils';

import './index.scss';

const valueKeyMap: Record<SquadHorizon, PlayerSortKey> = {
  value: 'value',
  value5: 'value5',
  value_remaining: 'value_remaining',
};

const valueLabelMap: Record<SquadHorizon, string> = {
  value: 'Value (Next GW)',
  value5: 'Value (Next 5 GWs)',
  value_remaining: 'Value (Rest of Season)',
};

const fdrLabelMap: Record<SquadHorizon, string> = {
  value: 'FDR (Next GW)',
  value5: 'FDR (Next 5 GWs)',
  value_remaining: 'FDR (Rest of Season)',
};

const getSortValue = (
  player: ProcessedPlayer,
  key: PlayerSortKey
): number | null => {
  if (key === 'now_cost') {
    return player.generalInfo.now_cost;
  }
  if (key === 'value' || key === 'value5' || key === 'value_remaining') {
    return player.playerValue[key];
  }
  return player.playerStats[key] ?? null;
};

const comparePlayers = (
  a: ProcessedPlayer,
  b: ProcessedPlayer,
  key: PlayerSortKey,
  dir: SortDirection
): number => {
  const valA = getSortValue(a, key);
  const valB = getSortValue(b, key);

  if (valA === null && valB === null) return 0;
  if (valA === null) return 1; // Always sort nulls last
  if (valB === null) return -1; // Always sort nulls last

  if (valA < valB) return dir === 'asc' ? -1 : 1;
  if (valA > valB) return dir === 'asc' ? 1 : -1;
  return 0;
};

export const PlayersPage: React.FC = () => {
  const navigateHook = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Read & Validate Search Params from URL
  const search = searchParams.get('search') || '';
  const position = searchParams.get('position') || '';
  const team = searchParams.get('team') || '';

  const sortParam = searchParams.get('sort');
  const validSort: PlayerSortKey = isPlayerSortKey(sortParam)
    ? sortParam
    : 'total_points';

  const dirParam = searchParams.get('dir');
  const validDir: SortDirection = isSortDirection(dirParam) ? dirParam : 'desc';

  const horizonParam = searchParams.get('horizon');
  const validHorizon: SquadHorizon = isSquadHorizon(horizonParam)
    ? horizonParam
    : 'value5';

  // 2. Fetch API Data
  const {
    players,
    isLoading: isPlayersLoading,
    error: playersError,
  } = useGetPlayers();
  const {
    teamNamesById,
    isLoading: isTeamsLoading,
    error: teamsError,
  } = useGetTeamNames();

  // 3. Local state for Search Debouncing
  const [searchValue, setSearchValue] = useState(search);

  // Sync debounced search input when URL param changes externally (e.g. Back button)
  useEffect(() => {
    setSearchValue(search);
  }, [search]);

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
    },
    [searchParams, setSearchParams]
  );

  // Debounced search input handler
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchValue !== search) {
        updateSearchParams({ search: searchValue || undefined });
      }
    }, 250);

    return () => clearTimeout(handler);
  }, [searchValue, search, updateSearchParams]);

  // 4. Flatten and Deduplicate Players
  const flattenedPlayers = useMemo<ProcessedPlayer[]>(() => {
    if (!players) return [];

    const uniquePlayers: Record<number, ProcessedPlayer> = {};

    if (players.byId) {
      Object.values(players.byId).forEach((p) => {
        uniquePlayers[p.generalInfo.id] = p;
      });
    }

    if (players.byTeam) {
      Object.values(players.byTeam).forEach((teamPlayers) => {
        if (Array.isArray(teamPlayers)) {
          teamPlayers.forEach((p) => {
            uniquePlayers[p.generalInfo.id] = p;
          });
        }
      });
    }

    if (players.byPosition) {
      Object.values(players.byPosition).forEach((posPlayers) => {
        if (Array.isArray(posPlayers)) {
          posPlayers.forEach((p) => {
            uniquePlayers[p.generalInfo.id] = p;
          });
        }
      });
    }

    return Object.values(uniquePlayers);
  }, [players]);

  // 5. Team Options for Filter Dropdown
  const teamOptions = useMemo(() => {
    return Object.entries(teamNamesById)
      .map(([id, name]) => ({ id: Number(id), name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [teamNamesById]);

  // 6. Filter & Sort Pipeline
  const filteredAndSortedPlayers = useMemo(() => {
    let result = [...flattenedPlayers];

    // Filter by name (case-insensitive on web_name)
    if (search) {
      const query = search.toLowerCase();
      result = result.filter((p) =>
        p.generalInfo.web_name.toLowerCase().includes(query)
      );
    }

    // Filter by position (GK, DEF, MID, FWD)
    if (position) {
      const posMap: Record<string, number> = { GK: 1, DEF: 2, MID: 3, FWD: 4 };
      const targetType = posMap[position.toUpperCase()];
      if (targetType) {
        result = result.filter(
          (p) => p.generalInfo.element_type === targetType
        );
      }
    }

    // Filter by team
    if (team) {
      const teamId = parseInt(team, 10);
      if (!isNaN(teamId)) {
        result = result.filter((p) => p.generalInfo.team === teamId);
      }
    }

    // Sort using custom compare logic
    result.sort((a, b) => comparePlayers(a, b, validSort, validDir));

    return result;
  }, [flattenedPlayers, search, position, team, validSort, validDir]);

  // 7. Column Definitions
  const columns = useMemo<Column<ProcessedPlayer>[]>(
    () => [
      {
        key: 'player',
        header: 'Player',
        align: 'left',
        render: (p) => {
          const teamName = teamNamesById[p.generalInfo.team] || 'Unknown';
          return <PlayerIdentity player={p} teamName={teamName} />;
        },
      },
      {
        key: 'team',
        header: 'Team',
        align: 'left',
        render: (p) => {
          const teamName = teamNamesById[p.generalInfo.team] || 'Unknown';
          return <TeamBadge teamName={teamName} size="sm" showLabel />;
        },
      },
      {
        key: 'position',
        header: 'Pos',
        align: 'center',
        render: (p) => (
          <PositionBadge elementType={p.generalInfo.element_type} short />
        ),
      },
      {
        key: 'now_cost',
        header: 'Price',
        sortable: true,
        align: 'right',
        render: (p) => formatPrice(p.generalInfo.now_cost),
      },
      {
        key: 'form',
        header: 'Form',
        sortable: true,
        align: 'right',
        render: (p) => formatValue(p.playerStats.form, 1),
      },
      {
        key: 'total_points',
        header: 'Total Pts',
        sortable: true,
        align: 'right',
        render: (p) => formatPoints(p.playerStats.total_points),
      },
      {
        key: 'points_per_game',
        header: 'Pts/Gm',
        sortable: true,
        align: 'right',
        render: (p) => formatValue(p.playerStats.points_per_game, 1),
      },
      {
        key: 'points_per_million',
        header: 'Pts/£m',
        sortable: true,
        align: 'right',
        render: (p) => formatValue(p.playerStats.points_per_million, 2),
      },
      {
        key: 'selected_by_percent',
        header: 'Sel. %',
        sortable: true,
        align: 'right',
        render: (p) => formatPercent(p.playerStats.selected_by_percent),
      },
      {
        key: 'goals_scored',
        header: 'Goals',
        sortable: true,
        align: 'right',
        render: (p) => String(p.playerStats.goals_scored),
      },
      {
        key: 'assists',
        header: 'Assists',
        sortable: true,
        align: 'right',
        render: (p) => String(p.playerStats.assists),
      },
      {
        key: 'minutes',
        header: 'Min',
        sortable: true,
        align: 'right',
        render: (p) => String(p.playerStats.minutes),
      },
      {
        key: valueKeyMap[validHorizon],
        header: valueLabelMap[validHorizon],
        sortable: true,
        align: 'right',
        render: (p) => {
          const val = p.playerValue[valueKeyMap[validHorizon]];
          return formatValue(val, 2);
        },
      },
      {
        key: 'fdr',
        header: fdrLabelMap[validHorizon],
        align: 'right',
        render: (p) => {
          const fdr =
            validHorizon === 'value'
              ? p.fixtureData.fdr1
              : validHorizon === 'value5'
              ? p.fixtureData.fdr5
              : p.fixtureData.fdr_remaining;
          return formatValue(fdr, 1);
        },
      },
    ],
    [teamNamesById, validHorizon]
  );

  // 8. Event Handlers
  const handleSortChange = (key: string) => {
    let nextDir: SortDirection = 'desc';
    if (validSort === key) {
      nextDir = validDir === 'desc' ? 'asc' : 'desc';
    }
    updateSearchParams({
      sort: key,
      dir: nextDir,
    });
  };

  const handleRowClick = (row: ProcessedPlayer) => {
    navigateHook.navigate(Routes.PlayerDetail, { id: row.generalInfo.id });
  };

  const handleClearFilters = () => {
    setSearchValue('');
    updateSearchParams({
      search: '',
      position: '',
      team: '',
    });
  };

  const isAnyFilterActive = !!search || !!position || !!team;

  // 9. Error and Loading States
  const isGlobalLoading = isPlayersLoading || isTeamsLoading;
  const globalError = playersError || teamsError;

  if (globalError) {
    return (
      <div className="players-page padded-container">
        <ErrorState
          title="Failed to Load Players Explorer"
          message={globalError.message}
        />
      </div>
    );
  }

  // Formatting Last Updated String
  const lastUpdatedNote = players?.lastUpdated
    ? `Data updated: ${new Date(players.lastUpdated).toLocaleString()}`
    : '';

  return (
    <div className="players-page">
      <div className="players-page__container">
        {/* Page Section Header */}
        <PageSection
          title="Players Explorer"
          subtitle={
            isGlobalLoading
              ? 'Loading active roster data...'
              : `${filteredAndSortedPlayers.length} of ${flattenedPlayers.length} players found.`
          }
          actions={
            lastUpdatedNote && (
              <span className="players-page__last-updated" aria-live="polite">
                {lastUpdatedNote}
              </span>
            )
          }
        >
          {/* Filters Control Bar */}
          {!isGlobalLoading && (
            <PlayerFilters
              search={searchValue}
              onSearchChange={setSearchValue}
              position={position}
              onPositionChange={(pos) =>
                updateSearchParams({ position: pos || undefined })
              }
              team={team}
              onTeamChange={(t) => updateSearchParams({ team: t || undefined })}
              horizon={validHorizon}
              onHorizonChange={(hor) => updateSearchParams({ horizon: hor })}
              teamOptions={teamOptions}
              onClearFilters={handleClearFilters}
              isAnyFilterActive={isAnyFilterActive}
            />
          )}

          {/* Results Table Section */}
          {isGlobalLoading ? (
            <TableSkeleton rows={10} columns={columns.length} />
          ) : filteredAndSortedPlayers.length === 0 ? (
            <EmptyState
              title="No Matching Players"
              message="No players match the criteria you selected. Try adjusting your search query or clear the active filters."
              action={
                <Button
                  onClick={handleClearFilters}
                  variant="secondary"
                  size="md"
                >
                  Clear Filters
                </Button>
              }
            />
          ) : (
            <DataTable
              rows={filteredAndSortedPlayers}
              columns={columns}
              rowKey={(row) => row.generalInfo.id}
              sortKey={validSort}
              sortDir={validDir}
              onSortChange={handleSortChange}
              onRowClick={handleRowClick}
            />
          )}
        </PageSection>
      </div>
    </div>
  );
};

export default PlayersPage;
