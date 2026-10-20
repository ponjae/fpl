import React from 'react';
import { useGetTopPlayers } from '../../features/players/hooks';
import StatLeaderboard from '../../features/stats/components/StatLeaderboard';
import {
  LEADERBOARD_FETCH_LIMIT,
  STAT_LEADERBOARDS,
  StatLeaderboardConfig,
} from '../../features/stats/leaderboard';
import { useGetTeamNames } from '../../features/teams/hooks';
import './index.scss';

type BoardSectionProps = {
  config: StatLeaderboardConfig;
  teamNamesById: Record<number, string>;
  isTeamsLoading: boolean;
};

/**
 * Owns the query for a single leaderboard so a failure in one stat never
 * blanks the others.
 */
const BoardSection: React.FC<BoardSectionProps> = ({
  config,
  teamNamesById,
  isTeamsLoading,
}) => {
  const { players, isLoading, error, refetch } = useGetTopPlayers(
    config.key,
    LEADERBOARD_FETCH_LIMIT
  );

  return (
    <StatLeaderboard
      config={config}
      players={players}
      teamNamesById={teamNamesById}
      isLoading={isLoading || isTeamsLoading}
      error={error}
      onRetry={refetch}
    />
  );
};

export const StatsPage: React.FC = () => {
  const {
    teamNamesById,
    isLoading: isTeamsLoading,
    error: teamsError,
  } = useGetTeamNames();

  return (
    <div className="stats-page">
      <div className="stats-page__container">
        <header className="stats-page__header">
          <span className="stats-page__eyebrow">Season so far</span>
          <h1 className="stats-page__title">Stats</h1>
          <p className="stats-page__subtitle">
            The Premier League’s leading goalscorers, FPL assist makers and FPL
            point earners this season.
          </p>
        </header>

        {teamsError && (
          <p className="stats-page__notice" role="status">
            Club names couldn’t be loaded, so players are shown without their
            club.
          </p>
        )}

        <div className="stats-page__grid">
          {STAT_LEADERBOARDS.map((config) => (
            <BoardSection
              key={config.key}
              config={config}
              teamNamesById={teamNamesById}
              isTeamsLoading={isTeamsLoading}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatsPage;
