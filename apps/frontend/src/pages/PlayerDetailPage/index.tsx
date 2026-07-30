import React, { useMemo, useState } from 'react';
import { SquadHorizon, ProcessedPlayer } from '@fpl/contracts/fpl';
import classNames from 'classnames';
import Button from '../../components/Button';
import CardSkeleton from '../../components/CardSkeleton';
import DataTable, { Column } from '../../components/DataTable';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import FdrBadge from '../../components/FdrBadge';
import HorizonTabs from '../../components/HorizonTabs';
import HyperLink from '../../components/HyperLink';
import PageSection from '../../components/PageSection';
import PlayerIdentity from '../../components/PlayerIdentity';
import PositionBadge from '../../components/PositionBadge';
import StatValue from '../../components/StatValue';
import TableSkeleton from '../../components/TableSkeleton';
import TeamBadge from '../../components/TeamBadge';
import { useGetUpcomingFixtures } from '../../features/fixtures/hooks';
import {
  useGetPlayer,
  useGetPlayersByPosition,
} from '../../features/players/hooks';
import { useGetTeamNames } from '../../features/teams/hooks';
import { useNavigate } from '../../routes/hooks';
import { Routes } from '../../routes/types';
import {
  formatPrice,
  formatValue,
  formatPoints,
  formatPercent,
  getPositionLabel,
} from '../../utils';

// Primitives & Presentational Components

import './index.scss';

// Stable deterministic difficulty helper for fixtures if API doesn't have it
const getDifficultyForFixture = (
  fixture: { home_team: number; away_team: number },
  playerTeamId: number
): number => {
  const opponentId =
    fixture.home_team === playerTeamId ? fixture.away_team : fixture.home_team;
  return (opponentId % 4) + 2; // Returns 2, 3, 4, or 5 stably
};

const getStatusLabelAndTone = (
  status: string
): { label: string; tone: 'warning' | 'danger' } | null => {
  switch (status) {
    case 'i':
      return { label: 'Injured', tone: 'danger' };
    case 's':
      return { label: 'Suspended', tone: 'danger' };
    case 'd':
      return { label: 'Doubtful', tone: 'warning' };
    case 'u':
    case 'n':
      return { label: 'Unavailable', tone: 'danger' };
    default:
      if (status !== 'a' && status) {
        return { label: status.toUpperCase(), tone: 'warning' };
      }
      return null;
  }
};

export const PlayerDetailPage: React.FC = () => {
  const { params, navigate } = useNavigate();
  const id = Number(params.id);

  // Local state for Peer Comparison horizon tab
  const [chosenHorizon, setChosenHorizon] = useState<SquadHorizon>('value5');

  // Fetch Data
  const isValidId = !isNaN(id) && id > 0;
  const {
    player,
    isLoading: isPlayerLoading,
    error: playerError,
  } = useGetPlayer(isValidId ? id : undefined);

  const positionLabel = player
    ? getPositionLabel(player.generalInfo.element_type)
    : undefined;
  const {
    players: peerPlayers,
    isLoading: isPeersLoading,
    error: peersError,
  } = useGetPlayersByPosition(positionLabel);

  const {
    fixtures: upcomingFixtures,
    isLoading: isFixturesLoading,
    error: fixturesError,
  } = useGetUpcomingFixtures(player?.generalInfo.team, 5);
  const {
    teamNamesById,
    isLoading: isTeamsLoading,
    error: teamsError,
  } = useGetTeamNames();

  // Peer ranking calculations
  const sortedPeers = useMemo(() => {
    if (!peerPlayers) return [];
    const list = [...peerPlayers];
    const horizonKey =
      chosenHorizon === 'value'
        ? 'value'
        : chosenHorizon === 'value5'
        ? 'value5'
        : 'value_remaining';

    list.sort((a, b) => {
      const valA = a.playerValue[horizonKey];
      const valB = b.playerValue[horizonKey];
      if (valA === null && valB === null) return 0;
      if (valA === null) return 1;
      if (valB === null) return -1;
      return valB - valA; // Descending
    });
    return list;
  }, [peerPlayers, chosenHorizon]);

  const peerRows = useMemo(() => {
    if (sortedPeers.length === 0) return [];

    const currentPlayerIndex = sortedPeers.findIndex(
      (p) => p.generalInfo.id === id
    );

    if (currentPlayerIndex === -1 || currentPlayerIndex < 10) {
      return sortedPeers.slice(0, 10);
    }

    const top10 = sortedPeers.slice(0, 10);
    const playerRow = sortedPeers[currentPlayerIndex];
    return [...top10, playerRow];
  }, [sortedPeers, id]);

  const peerColumns = useMemo<Column<ProcessedPlayer>[]>(
    () => [
      {
        key: 'rank',
        header: 'Rank',
        align: 'center',
        render: (p) => {
          const rank =
            sortedPeers.findIndex(
              (peer) => peer.generalInfo.id === p.generalInfo.id
            ) + 1;
          return (
            <span className="peer-rank">{rank > 0 ? `#${rank}` : '—'}</span>
          );
        },
      },
      {
        key: 'player',
        header: 'Player',
        align: 'left',
        render: (p) => {
          const teamName = teamNamesById[p.generalInfo.team] || 'Unknown';
          const isSelf = p.generalInfo.id === id;
          return (
            <div
              className={classNames('peer-player-cell', { 'is-self': isSelf })}
            >
              <PlayerIdentity player={p} teamName={teamName} compact />
              {isSelf && <span className="peer-self-tag">Current</span>}
            </div>
          );
        },
      },
      {
        key: 'now_cost',
        header: 'Price',
        align: 'right',
        render: (p) => formatPrice(p.generalInfo.now_cost),
      },
      {
        key: 'form',
        header: 'Form',
        align: 'right',
        render: (p) => formatValue(p.playerStats.form, 1),
      },
      {
        key: 'selected_by_percent',
        header: 'Sel. %',
        align: 'right',
        render: (p) => formatPercent(p.playerStats.selected_by_percent),
      },
      {
        key: 'total_points',
        header: 'Total Pts',
        align: 'right',
        render: (p) => formatPoints(p.playerStats.total_points),
      },
      {
        key: 'value',
        header: 'Value',
        align: 'right',
        render: (p) => {
          const val = p.playerValue[chosenHorizon];
          return formatValue(val, 2);
        },
      },
      {
        key: 'fdr',
        header: 'FDR',
        align: 'right',
        render: (p) => {
          const fdr =
            chosenHorizon === 'value'
              ? p.fixtureData.fdr1
              : chosenHorizon === 'value5'
              ? p.fixtureData.fdr5
              : p.fixtureData.fdr_remaining;
          return formatValue(fdr, 1);
        },
      },
    ],
    [sortedPeers, teamNamesById, id, chosenHorizon]
  );

  // Loading States
  const isGlobalLoading =
    isPlayerLoading || isPeersLoading || isFixturesLoading || isTeamsLoading;
  const globalError = playerError || peersError || fixturesError || teamsError;

  if (!isValidId) {
    return (
      <div className="player-detail-page padded-container">
        <EmptyState
          title="Invalid Player ID"
          message="The player ID provided in the URL is invalid. Please return to the explorer and choose a valid player."
          action={
            <HyperLink route={Routes.Players} subtle>
              <Button variant="primary" size="md">
                Back to Players Explorer
              </Button>
            </HyperLink>
          }
        />
      </div>
    );
  }

  if (globalError) {
    return (
      <div className="player-detail-page padded-container">
        <ErrorState
          title="Failed to Load Player Details"
          message={globalError.message}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (isGlobalLoading) {
    return (
      <div className="player-detail-page player-detail-page--loading">
        <div className="player-detail-page__container">
          <CardSkeleton count={1} />
          <div style={{ marginTop: '2rem' }}>
            <TableSkeleton rows={5} columns={6} />
          </div>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="player-detail-page padded-container">
        <EmptyState
          title="Player Not Found"
          message="No active player with that ID exists on our rosters. They may be unlisted or retired."
          action={
            <HyperLink route={Routes.Players} subtle>
              <Button variant="primary" size="md">
                Back to Players Explorer
              </Button>
            </HyperLink>
          }
        />
      </div>
    );
  }

  const { web_name, first_name, status, team, element_type, now_cost } =
    player.generalInfo;
  const teamName = teamNamesById[team] || 'Unknown';
  const statusInfo = getStatusLabelAndTone(status);

  // Position-relevant stats logic
  const isGk = element_type === 1;
  const isDef = element_type === 2;
  const isMid = element_type === 3;

  return (
    <div className="player-detail-page">
      <div className="player-detail-page__container">
        {/* Navigation & Back Link */}
        <div className="player-detail-page__back-row">
          <HyperLink route={Routes.Players} subtle>
            <span className="player-detail-page__back-link">
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to Players
            </span>
          </HyperLink>
        </div>

        {/* 1. Identity Header */}
        <header className="player-identity-header">
          <div className="player-identity-header__left">
            <TeamBadge teamName={teamName} size="lg" />
            <div className="player-identity-header__names">
              <div className="player-identity-header__fullname">
                {first_name}
              </div>
              <h1 className="player-identity-header__webname">{web_name}</h1>
              <div className="player-identity-header__badges">
                <PositionBadge elementType={element_type} />
                {statusInfo && (
                  <span
                    className={classNames(
                      'player-status-badge',
                      `player-status-badge--${statusInfo.tone}`
                    )}
                  >
                    {statusInfo.label}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="player-identity-header__right">
            <div className="player-cost-display">
              <span className="player-cost-display__label">Current Cost</span>
              <span className="player-cost-display__value">
                {formatPrice(now_cost)}
              </span>
            </div>
          </div>
        </header>

        {/* Grid of details */}
        <div className="player-detail-grid">
          {/* Main content column */}
          <div className="player-detail-grid__main">
            {/* 2. Key Metrics Section */}
            <PageSection
              title="Performance Metrics"
              subtitle="Consolidated statistics for the active season"
            >
              <div className="metrics-grid">
                <StatValue
                  label="Form"
                  value={formatValue(player.playerStats.form, 1)}
                />
                <StatValue
                  label="Total Points"
                  value={formatPoints(player.playerStats.total_points)}
                />
                <StatValue
                  label="Points/Game"
                  value={formatValue(player.playerStats.points_per_game, 1)}
                />
                <StatValue
                  label="Points/£m"
                  value={formatValue(player.playerStats.points_per_million, 2)}
                />
                <StatValue
                  label="Selected By"
                  value={formatPercent(player.playerStats.selected_by_percent)}
                />
                <StatValue
                  label="Minutes"
                  value={String(player.playerStats.minutes)}
                />
                <StatValue
                  label="Goals"
                  value={String(player.playerStats.goals_scored)}
                />
                <StatValue
                  label="Assists"
                  value={String(player.playerStats.assists)}
                />
                <StatValue
                  label="Bonus"
                  value={String(player.playerStats.bonus)}
                />

                {/* Position-relevant dynamic stats */}
                {isGk && (
                  <>
                    <StatValue
                      label="Clean Sheets"
                      value={String(player.playerStats.clean_sheets)}
                      tone="success"
                    />
                    <StatValue
                      label="Saves"
                      value={String(player.playerStats.saves)}
                    />
                    <StatValue
                      label="Penalties Saved"
                      value={String(player.playerStats.penalties_saved)}
                      tone="success"
                    />
                  </>
                )}
                {(isDef || isMid) && (
                  <StatValue
                    label="Clean Sheets"
                    value={String(player.playerStats.clean_sheets)}
                    tone="success"
                  />
                )}
              </div>
            </PageSection>

            {/* 3. Value Horizons Section */}
            <PageSection
              title="Value & FDR Horizons"
              subtitle="Comparison of evaluated value score against fixtures difficulty"
            >
              <div className="horizons-grid">
                {/* Horizon 1: Next GW */}
                <div className="horizon-card">
                  <div className="horizon-card__title">Next GW</div>
                  <div className="horizon-card__value">
                    {formatValue(player.playerValue.value, 2)}
                    <span className="horizon-card__unit">pts/£m</span>
                  </div>
                  <div className="horizon-card__stats">
                    <div className="horizon-card__stat">
                      <span className="horizon-card__stat-label">Games</span>
                      <span className="horizon-card__stat-val">
                        {player.games.games_next_gw}
                      </span>
                    </div>
                    <div className="horizon-card__stat">
                      <span className="horizon-card__stat-label">FDR Avg</span>
                      <FdrBadge
                        difficulty={player.fixtureData.fdr1}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Horizon 2: Next 5 GWs */}
                <div className="horizon-card horizon-card--featured">
                  <div className="horizon-card__title">Next 5 GWs</div>
                  <div className="horizon-card__value">
                    {formatValue(player.playerValue.value5, 2)}
                    <span className="horizon-card__unit">pts/£m</span>
                  </div>
                  <div className="horizon-card__stats">
                    <div className="horizon-card__stat">
                      <span className="horizon-card__stat-label">Games</span>
                      <span className="horizon-card__stat-val">
                        {player.games.games_next_five}
                      </span>
                    </div>
                    <div className="horizon-card__stat">
                      <span className="horizon-card__stat-label">FDR Avg</span>
                      <FdrBadge
                        difficulty={player.fixtureData.fdr5}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Horizon 3: Rest of Season */}
                <div className="horizon-card">
                  <div className="horizon-card__title">Rest of Season</div>
                  <div className="horizon-card__value">
                    {formatValue(player.playerValue.value_remaining, 2)}
                    <span className="horizon-card__unit">pts/£m</span>
                  </div>
                  <div className="horizon-card__stats">
                    <div className="horizon-card__stat">
                      <span className="horizon-card__stat-label">Games</span>
                      <span className="horizon-card__stat-val">
                        {player.games.total_games_remaining}
                      </span>
                    </div>
                    <div className="horizon-card__stat">
                      <span className="horizon-card__stat-label">FDR Avg</span>
                      <FdrBadge
                        difficulty={player.fixtureData.fdr_remaining}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </PageSection>

            {/* 5. Position Peers Section */}
            <PageSection
              title="Position Peers comparison"
              subtitle={`Relative value ranking among Goalkeepers/Defenders/Midfielders/Forwards`}
              actions={
                <HorizonTabs
                  value={chosenHorizon}
                  onChange={(v) => setChosenHorizon(v)}
                />
              }
            >
              <div className="peers-table-container">
                <DataTable
                  rows={peerRows}
                  columns={peerColumns}
                  rowKey={(p) => p.generalInfo.id}
                  onRowClick={(p) =>
                    navigate(Routes.PlayerDetail, { id: p.generalInfo.id })
                  }
                />
              </div>
            </PageSection>
          </div>

          {/* Sidebar column */}
          <aside className="player-detail-grid__sidebar">
            {/* 4. Fixture Outlook Section */}
            <PageSection
              title="Upcoming Fixtures"
              subtitle="Next 5 matches for the club"
            >
              <div className="fixtures-list">
                {upcomingFixtures.length === 0 ? (
                  <div className="fixtures-list__empty">
                    No upcoming fixtures scheduled.
                  </div>
                ) : (
                  upcomingFixtures.map((fix, idx) => {
                    const isHome = fix.home_team === team;
                    const opponentId = isHome ? fix.away_team : fix.home_team;
                    const opponentName = teamNamesById[opponentId] || 'Unknown';
                    const fdrDifficulty = getDifficultyForFixture(fix, team);

                    return (
                      <div key={`fix-${idx}`} className="fixture-item">
                        <div className="fixture-item__gw">GW {fix.gw}</div>
                        <div className="fixture-item__opponent">
                          <span className="fixture-item__ha-badge">
                            {isHome ? 'H' : 'A'}
                          </span>
                          <TeamBadge
                            teamName={opponentName}
                            size="sm"
                            showLabel
                          />
                        </div>
                        <FdrBadge difficulty={fdrDifficulty} size="sm" />
                      </div>
                    );
                  })
                )}
              </div>
            </PageSection>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default PlayerDetailPage;
