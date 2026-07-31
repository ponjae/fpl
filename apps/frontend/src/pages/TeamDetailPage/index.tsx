import React, { useMemo, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  ProcessedPlayer,
  PlayerSortKey,
  SortDirection,
  isPlayerSortKey,
  isSortDirection,
} from '@fpl/contracts/fpl';
import { useGetTeams, useGetTeamNames } from '../../features/teams/hooks';
import { useGetPlayers } from '../../features/players/hooks';
import { useGetUpcomingFixtures } from '../../features/fixtures/hooks';
import { useNavigate } from '../../routes/hooks';
import { Routes } from '../../routes/types';
import TeamBadge from '../../components/TeamBadge';
import PositionBadge from '../../components/PositionBadge';
import PlayerIdentity from '../../components/PlayerIdentity';
import DataTable, { Column } from '../../components/DataTable';
import TableSkeleton from '../../components/TableSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import PageSection from '../../components/PageSection';
import Button from '../../components/Button';
import Text from '../../components/Text';
import FixtureList from '../../components/FixtureList';
import {
  formatPrice,
  formatValue,
  formatPoints,
} from '../../utils';
import './index.scss';

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

export const TeamDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigateHook = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const teamId = id ? parseInt(id, 10) : undefined;

  // 1. Read & Validate Search Params from URL
  const position = searchParams.get('position') || '';

  const sortParam = searchParams.get('sort');
  const validSort: PlayerSortKey = isPlayerSortKey(sortParam) ? sortParam : 'value5';

  const dirParam = searchParams.get('dir');
  const validDir: SortDirection = isSortDirection(dirParam) ? dirParam : 'desc';

  // 2. Fetch API Data
  const {
    teamNamesById,
    isLoading: isNamesLoading,
    error: namesError,
  } = useGetTeamNames();

  const {
    teams,
    isLoading: isTeamsLoading,
    error: teamsError,
  } = useGetTeams();

  const {
    players,
    isLoading: isPlayersLoading,
    error: playersError,
  } = useGetPlayers();

  const {
    fixtures,
    isLoading: isFixturesLoading,
    error: fixturesError,
  } = useGetUpcomingFixtures(teamId, 5);

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

  // 3. Resolve Team Name and Trivia
  const teamName = teamId !== undefined ? teamNamesById[teamId] : undefined;
  const teamData = teamName ? teams?.[teamName] : undefined;

  // 4. Filter and sort Players for this team
  const teamPlayers = useMemo(() => {
    if (!players?.byId || teamId === undefined) return [];
    return Object.values(players.byId).filter(
      (p) => p.generalInfo.team === teamId
    );
  }, [players, teamId]);

  const filteredAndSortedPlayers = useMemo(() => {
    let result = [...teamPlayers];

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

    // Sort
    result.sort((a, b) => comparePlayers(a, b, validSort, validDir));

    return result;
  }, [teamPlayers, position, validSort, validDir]);

  // 5. Column Definitions
  const columns = useMemo<Column<ProcessedPlayer>[]>(
    () => [
      {
        key: 'player',
        header: 'Player',
        align: 'left',
        render: (p) => <PlayerIdentity player={p} teamName={teamName} />,
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
        key: 'value5',
        header: 'Value (5 GWs)',
        sortable: true,
        align: 'right',
        render: (p) => formatValue(p.playerValue.value5, 2),
      },
      {
        key: 'value',
        header: 'Value (1 GW)',
        sortable: true,
        align: 'right',
        render: (p) => formatValue(p.playerValue.value, 2),
      },
      {
        key: 'value_remaining',
        header: 'Value (Season)',
        sortable: true,
        align: 'right',
        render: (p) => formatValue(p.playerValue.value_remaining, 2),
      },
    ],
    [teamName]
  );

  // 6. Handlers
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

  const handlePositionChange = (pos: string) => {
    updateSearchParams({ position: pos || undefined });
  };

  const handleBackToTeams = () => {
    navigateHook.navigate(Routes.Teams);
  };

  // 7. Loading, Error, and Not Found checks
  const isGlobalLoading =
    isNamesLoading || isTeamsLoading || isPlayersLoading || isFixturesLoading;
  const globalError = namesError || teamsError || playersError || fixturesError;

  if (globalError) {
    return (
      <div className="team-detail-page">
        <div className="team-detail-page__container">
          <ErrorState
            title="Failed to Load Club Details"
            message={globalError.message || 'Please check your connection and try again.'}
            onRetry={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }

  // Handle case where team ID is invalid / doesn't exist
  if (!isGlobalLoading && (!teamName || !teamData)) {
    return (
      <div className="team-detail-page">
        <div className="team-detail-page__container">
          <EmptyState
            title="Club Not Found"
            message="The requested Premier League club could not be found or does not exist."
            action={
              <Button onClick={handleBackToTeams} variant="primary" size="md">
                Back to Clubs
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const positionsList = [
    { label: 'All Players', value: '' },
    { label: 'Goalkeepers', value: 'GK' },
    { label: 'Defenders', value: 'DEF' },
    { label: 'Midfielders', value: 'MID' },
    { label: 'Forwards', value: 'FWD' },
  ];

  return (
    <div className="team-detail-page">
      <div className="team-detail-page__container">
        {/* Navigation & Action Header */}
        <div className="team-detail-page__nav-header">
          <Button onClick={handleBackToTeams} variant="ghost" size="sm">
            ← All Clubs
          </Button>
        </div>

        {isGlobalLoading ? (
          <div className="team-detail-loading">
            <TableSkeleton rows={12} columns={columns.length} />
          </div>
        ) : (
          <>
            {/* Club Hero Banner */}
            <div className="team-hero">
              <div className="team-hero__badge-wrapper">
                <TeamBadge teamName={teamName!} size="lg" />
              </div>
              <div className="team-hero__info">
                <div className="team-hero__title-row">
                  <h1 className="team-hero__name">{teamName}</h1>
                  <span className="team-hero__nickname">{teamData?.nickname}</span>
                </div>
                
                <div className="team-hero__trivia">
                  <div className="team-hero__trivia-item">
                    <span className="team-hero__trivia-label">Stadium</span>
                    <span className="team-hero__trivia-value" title={teamData?.arena}>
                      {teamData?.arena}
                    </span>
                  </div>
                  <div className="team-hero__trivia-item">
                    <span className="team-hero__trivia-label">City</span>
                    <span className="team-hero__trivia-value">{teamData?.city}</span>
                  </div>
                  <div className="team-hero__trivia-item">
                    <span className="team-hero__trivia-label">Manager</span>
                    <span className="team-hero__trivia-value">{teamData?.coach}</span>
                  </div>
                  <div className="team-hero__trivia-item">
                    <span className="team-hero__trivia-label">PL Titles</span>
                    <span className="team-hero__trivia-value highlight">
                      {teamData?.pl_titles === '0' || !teamData?.pl_titles ? '—' : teamData.pl_titles}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Split Content Grid: Roster (Left) vs Upcoming Fixtures (Right) */}
            <div className="team-detail-grid">
              {/* Left Column: Roster Explorer */}
              <div className="team-detail-column team-detail-column--main">
                <PageSection
                  title="Squad Roster"
                  subtitle={`${filteredAndSortedPlayers.length} active players on the roster.`}
                >
                  {/* Position Filter Tabs */}
                  <div className="position-tabs">
                    {positionsList.map((pos) => {
                      const isActive = position === pos.value;
                      return (
                        <Button
                          key={pos.label}
                          onClick={() => handlePositionChange(pos.value)}
                          variant={isActive ? 'primary' : 'ghost'}
                          size="sm"
                          className={`position-tab ${isActive ? 'active' : ''}`}
                        >
                          {pos.label}
                        </Button>
                      );
                    })}
                  </div>

                  {filteredAndSortedPlayers.length === 0 ? (
                    <EmptyState
                      title="No Matching Players"
                      message="No players on this team match the selected position."
                      action={
                        <Button
                          onClick={() => handlePositionChange('')}
                          variant="secondary"
                          size="md"
                        >
                          Clear Position Filter
                        </Button>
                      }
                    />
                  ) : (
                    <div className="roster-table-wrapper">
                      <DataTable
                        rows={filteredAndSortedPlayers}
                        columns={columns}
                        rowKey={(row) => row.generalInfo.id}
                        sortKey={validSort}
                        sortDir={validDir}
                        onSortChange={handleSortChange}
                        onRowClick={handleRowClick}
                      />
                    </div>
                  )}
                </PageSection>
              </div>

              {/* Right Column: Upcoming Fixtures */}
              <div className="team-detail-column team-detail-column--sidebar">
                <PageSection
                  title="Upcoming Fixtures"
                  subtitle="Next 5 scheduled matches."
                >
                  <FixtureList
                    fixtures={fixtures}
                    teamNamesById={teamNamesById}
                    compact
                    showGameweek
                    showKickoffInCompact
                  />
                </PageSection>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TeamDetailPage;
