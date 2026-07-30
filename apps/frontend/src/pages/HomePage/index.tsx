import React, { useMemo } from 'react';
import { ProcessedPlayer } from '@fpl/contracts/fpl';
import CardSkeleton from '../../components/CardSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import FixtureList from '../../components/FixtureList';
import Hyperlink from '../../components/HyperLink';
import PageSection from '../../components/PageSection';
import StatValue from '../../components/StatValue';
import TableSkeleton from '../../components/TableSkeleton';
import { useGetFixturesByGameweek } from '../../features/fixtures/hooks';
import { useGetCurrentGameweek } from '../../features/gameweeks/hooks';
import { useGetPlayers, useGetTopPlayers } from '../../features/players/hooks';
import { useGetTeamNames } from '../../features/teams/hooks';
import { Routes } from '../../routes/types';
import {
  formatPrice,
  formatValue,
  formatPoints,
  getPositionShortLabel,
} from '../../utils';

// Shared Components

import './index.scss';

type TopPicksColumnProps = {
  title: string;
  horizon: 'value' | 'value5' | 'value_remaining';
  players: ProcessedPlayer[];
  teamNamesById: Record<number, string>;
  isLoading: boolean;
  error: any;
};

const TopPicksColumn: React.FC<TopPicksColumnProps> = ({
  title,
  horizon,
  players,
  teamNamesById,
  isLoading,
  error,
}) => {
  if (isLoading) {
    return (
      <div className="top-picks-column">
        <h3 className="top-picks-column__title">{title}</h3>
        <TableSkeleton rows={5} columns={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="top-picks-column">
        <h3 className="top-picks-column__title">{title}</h3>
        <ErrorState
          title={`Failed to Load ${title}`}
          message={
            error.message || 'Please check your connection and try again.'
          }
        />
      </div>
    );
  }

  if (!players || players.length === 0) {
    return (
      <div className="top-picks-column">
        <h3 className="top-picks-column__title">{title}</h3>
        <EmptyState
          title="No Picks Available"
          message="No active players found for this metric."
        />
      </div>
    );
  }

  return (
    <div className="top-picks-column">
      <div className="top-picks-column__header">
        <h3 className="top-picks-column__title">{title}</h3>
        <Hyperlink
          route={Routes.Players}
          searchParams={{ sort: horizon, horizon }}
          subtle
        >
          <span className="top-picks-explore-link">Explore All</span>
        </Hyperlink>
      </div>

      <div className="top-picks-list">
        {players.map((player, index) => {
          const teamName = teamNamesById[player.generalInfo.team] || 'Unknown';
          const val = player.playerValue[horizon];

          return (
            <div key={player.generalInfo.id} className="top-pick-card">
              <div className="top-pick-card__rank">{index + 1}</div>
              <div className="top-pick-card__info">
                <Hyperlink
                  route={Routes.PlayerDetail}
                  params={{ id: player.generalInfo.id }}
                  subtle
                >
                  <span
                    className="top-pick-card__name"
                    title={player.generalInfo.web_name}
                  >
                    {player.generalInfo.web_name}
                  </span>
                </Hyperlink>
                <div className="top-pick-card__meta">
                  <span className="top-pick-card__team" title={teamName}>
                    {teamName}
                  </span>
                  <span className="top-pick-card__separator">•</span>
                  <span className="top-pick-card__pos">
                    {getPositionShortLabel(player.generalInfo.element_type)}
                  </span>
                </div>
              </div>
              <div className="top-pick-card__stats">
                <span className="top-pick-card__price">
                  {formatPrice(player.generalInfo.now_cost)}
                </span>
                <span className="top-pick-card__value" title="Value metric">
                  {formatValue(val, 2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const HomePage: React.FC = () => {
  // 1. Fetching Global Context
  const {
    teamNamesById,
    isLoading: isTeamsLoading,
    error: teamsError,
  } = useGetTeamNames();
  const {
    players: allPlayers,
    isLoading: isPlayersLoading,
    error: playersError,
  } = useGetPlayers();

  // 2. Fetching Current Gameweek Details
  const {
    gameweek,
    isLoading: isGwLoading,
    error: gwError,
  } = useGetCurrentGameweek();

  // 3. Fetching Fixtures for current Gameweek (skip if gameweek undefined)
  const {
    fixtures,
    isLoading: isFixturesLoading,
    error: fixturesError,
  } = useGetFixturesByGameweek(gameweek?.id);

  // 4. Fetching Top Picks for each horizon (5 players each)
  const {
    players: nextGwPicks,
    isLoading: isNextGwLoading,
    error: nextGwError,
  } = useGetTopPlayers('value', 5);

  const {
    players: next5GwPicks,
    isLoading: isNext5GwLoading,
    error: next5GwError,
  } = useGetTopPlayers('value5', 5);

  const {
    players: restOfSeasonPicks,
    isLoading: isRestOfSeasonLoading,
    error: restOfSeasonError,
  } = useGetTopPlayers('value_remaining', 5);

  // 5. Resolving Names for top player and most-captained
  const topPlayer = useMemo(() => {
    if (!gameweek?.top_element_info?.id || !allPlayers?.byId) return undefined;
    return allPlayers.byId[gameweek.top_element_info.id];
  }, [gameweek, allPlayers]);

  const mostCaptainedPlayer = useMemo(() => {
    if (!gameweek?.most_captained || !allPlayers?.byId) return undefined;
    return allPlayers.byId[gameweek.most_captained];
  }, [gameweek, allPlayers]);

  const renderGameweekSummary = () => {
    if (isGwLoading || isPlayersLoading) {
      return <CardSkeleton count={5} />;
    }

    if (gwError || playersError) {
      const combinedError = gwError || playersError;
      return (
        <ErrorState
          title="Failed to Load Gameweek Summary"
          message={
            combinedError?.message ||
            'Please check your connection and try again.'
          }
        />
      );
    }

    if (!gameweek) {
      return (
        <EmptyState
          title="No Active Gameweek Found"
          message="There is currently no active gameweek or season data available."
        />
      );
    }

    const topPlayerName = topPlayer
      ? topPlayer.generalInfo.web_name
      : gameweek.top_element_info
      ? `Player ${gameweek.top_element_info.id}`
      : '—';

    const topPlayerPoints = gameweek.top_element_info
      ? `${formatPoints(gameweek.top_element_info.points)} pts`
      : '—';

    const mostCaptainedName = mostCaptainedPlayer
      ? mostCaptainedPlayer.generalInfo.web_name
      : gameweek.most_captained
      ? `Player ${gameweek.most_captained}`
      : '—';

    return (
      <div className="gameweek-summary-grid">
        <StatValue
          label="Current Round"
          value={`GW ${gameweek.id}`}
          hint={gameweek.finished ? 'Finished' : 'In Progress'}
          tone={gameweek.finished ? 'default' : 'success'}
        />
        <StatValue
          label="Average Score"
          value={formatPoints(gameweek.average_entry_score)}
          hint="Points"
        />
        <StatValue
          label="Highest Score"
          value={
            gameweek.highest_score === null
              ? '—'
              : formatPoints(gameweek.highest_score)
          }
          hint="Points"
        />
        <StatValue
          label="Top Performer"
          value={topPlayerName}
          hint={topPlayerPoints}
          tone="success"
        />
        <StatValue
          label="Most Captained"
          value={mostCaptainedName}
          hint="Favored pick"
        />
      </div>
    );
  };

  const renderFixtures = () => {
    if (isGwLoading || isFixturesLoading || isTeamsLoading) {
      return <TableSkeleton rows={5} columns={3} />;
    }

    if (fixturesError || teamsError) {
      const combinedError = fixturesError || teamsError;
      return (
        <ErrorState
          title="Failed to Load Fixtures"
          message={
            combinedError?.message ||
            'Please check your connection and try again.'
          }
        />
      );
    }

    if (!gameweek) {
      return (
        <EmptyState
          title="No Gameweek Data"
          message="Fixtures cannot be displayed without active gameweek information."
        />
      );
    }

    if (!fixtures || fixtures.length === 0) {
      return (
        <EmptyState
          title="No Fixtures Scheduled"
          message={`No fixtures found for Gameweek ${gameweek.id}.`}
        />
      );
    }

    return <FixtureList fixtures={fixtures} teamNamesById={teamNamesById} />;
  };

  // Data Freshness String
  const lastUpdatedNote = allPlayers?.lastUpdated
    ? `Data updated: ${new Date(allPlayers.lastUpdated).toLocaleString()}`
    : '';

  const gwSectionTitle = gameweek
    ? `Gameweek ${gameweek.id} Overview`
    : 'Gameweek Overview';
  const fixtureSectionTitle = gameweek
    ? `Gameweek ${gameweek.id} Fixtures`
    : 'Gameweek Fixtures';

  return (
    <div className="home-page">
      <div className="home-page__container">
        {/* Welcome Dashboard Header */}
        <div className="home-page__header">
          <div className="home-page__titles">
            <h1 className="home-page__title">Dashboard</h1>
            <p className="home-page__subtitle">
              Overview of active fixtures, projections, and performance metrics.
            </p>
          </div>
          {lastUpdatedNote && (
            <span className="home-page__last-updated" aria-live="polite">
              {lastUpdatedNote}
            </span>
          )}
        </div>

        {/* Gameweek Summary Section */}
        <PageSection
          title={gwSectionTitle}
          subtitle="Live and historic statistical baselines."
        >
          {renderGameweekSummary()}
        </PageSection>

        {/* Fixtures and Top Picks Grid Layout */}
        <div className="home-page-content-grid">
          {/* Column A: Fixtures */}
          <div className="home-page-column">
            <PageSection
              title={fixtureSectionTitle}
              subtitle="Team pairings and scores for the current round."
            >
              {renderFixtures()}
            </PageSection>
          </div>

          {/* Column B: Top Value Picks (Three horizons side by side inside the section) */}
          <div className="home-page-column">
            <PageSection
              title="Top Value Picks"
              subtitle="Projected points returns relative to current transfer cost."
            >
              <div className="top-picks-grid">
                <TopPicksColumn
                  title="Next GW"
                  horizon="value"
                  players={nextGwPicks}
                  teamNamesById={teamNamesById}
                  isLoading={isNextGwLoading || isTeamsLoading}
                  error={nextGwError}
                />
                <TopPicksColumn
                  title="Next 5 GWs"
                  horizon="value5"
                  players={next5GwPicks}
                  teamNamesById={teamNamesById}
                  isLoading={isNext5GwLoading || isTeamsLoading}
                  error={next5GwError}
                />
                <TopPicksColumn
                  title="Rest of Season"
                  horizon="value_remaining"
                  players={restOfSeasonPicks}
                  teamNamesById={teamNamesById}
                  isLoading={isRestOfSeasonLoading || isTeamsLoading}
                  error={restOfSeasonError}
                />
              </div>
            </PageSection>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
