import React, { useMemo } from 'react';
import { ProcessedPlayer } from '@fpl/contracts/fpl';
import classNames from 'classnames';
import EmptyState from '../../../../components/EmptyState';
import ErrorState from '../../../../components/ErrorState';
import Hyperlink from '../../../../components/HyperLink';
import PositionBadge from '../../../../components/PositionBadge';
import TeamBadge from '../../../../components/TeamBadge';
import { Routes } from '../../../../routes/types';
import { ApiErrorBody } from '../../../api/types';
import {
  buildLeaderboard,
  formatCount,
  formatRank,
  LEADERBOARD_SIZE,
  StatLeaderboardConfig,
  toOrdinal,
} from '../../leaderboard';
import './index.scss';

export type StatLeaderboardProps = {
  config: StatLeaderboardConfig;
  players: ProcessedPlayer[];
  teamNamesById: Record<number, string>;
  isLoading: boolean;
  error?: ApiErrorBody;
  onRetry?: () => void;
};

/**
 * One season-to-date leaderboard card (goals, FPL assists or FPL points).
 *
 * Presentational: the page owns the query and passes the result in, so each
 * card loads, fails and retries independently of the others.
 */
export const StatLeaderboard: React.FC<StatLeaderboardProps> = ({
  config,
  players,
  teamNamesById,
  isLoading,
  error,
  onRetry,
}) => {
  const headingId = `stat-board-${config.key}`;
  const board = useMemo(
    () => buildLeaderboard(players, config.key),
    [players, config.key]
  );

  const renderBody = () => {
    if (isLoading) {
      return (
        <div
          className="stat-board__skeleton"
          role="status"
          aria-label={`Loading ${config.title.toLowerCase()}`}
        >
          {Array.from({ length: LEADERBOARD_SIZE }, (_, i) => (
            <div key={i} className="stat-board__skeleton-row" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <ErrorState
          title={`Couldn't load ${config.title.toLowerCase()}`}
          message={
            error.message || 'Please check your connection and try again.'
          }
          onRetry={onRetry}
        />
      );
    }

    if (board.entries.length === 0) {
      return (
        <EmptyState title="Nothing to rank yet" message={config.emptyMessage} />
      );
    }

    const leaderValue = board.entries[0].value;
    const cutoff = board.entries[board.entries.length - 1];
    const hasTies = board.entries.some((e) => e.isTied);

    return (
      <>
        <ol className="stat-board__list" aria-labelledby={headingId}>
          {board.entries.map((entry, index) => {
            const { id, web_name, team, element_type } =
              entry.player.generalInfo;
            const teamName = teamNamesById[team];
            const share = Math.max(
              4,
              Math.round((entry.value / leaderValue) * 100)
            );
            const rankLabel = `${entry.isTied ? 'Joint ' : ''}${toOrdinal(
              entry.rank
            )}`;

            return (
              <li
                key={id}
                className={classNames('stat-board__row', {
                  'stat-board__row--leader': entry.rank === 1,
                })}
                style={
                  {
                    '--share': `${share}%`,
                    '--i': index,
                  } as React.CSSProperties
                }
              >
                <span className="stat-board__rank" title={rankLabel}>
                  <span aria-hidden="true">{formatRank(entry)}</span>
                  <span className="stat-board__sr">{rankLabel}</span>
                </span>

                <span className="stat-board__badge" aria-hidden="true">
                  {teamName ? (
                    <TeamBadge teamName={teamName} size="sm" />
                  ) : (
                    <span className="stat-board__badge-placeholder" />
                  )}
                </span>

                <span className="stat-board__who">
                  <Hyperlink route={Routes.PlayerDetail} params={{ id }} subtle>
                    <span className="stat-board__name" title={web_name}>
                      {web_name}
                    </span>
                  </Hyperlink>
                  <span className="stat-board__meta">
                    {teamName ? (
                      <Hyperlink
                        route={Routes.TeamDetail}
                        params={{ id: team }}
                        subtle
                      >
                        <span className="stat-board__team" title={teamName}>
                          {teamName}
                        </span>
                      </Hyperlink>
                    ) : (
                      <span className="stat-board__team stat-board__team--unknown">
                        Unknown club
                      </span>
                    )}
                    <PositionBadge elementType={element_type} short />
                  </span>
                </span>

                <span className="stat-board__count">
                  <span aria-hidden="true">{entry.value}</span>
                  <span className="stat-board__sr">
                    {formatCount(entry.value, config.unit)}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>

        {(hasTies || board.hiddenTiedCount > 0) && (
          <div className="stat-board__notes">
            {board.hiddenTiedCount > 0 && cutoff && (
              <p className="stat-board__note stat-board__note--strong">
                {board.hiddenTiedIsLowerBound ? 'At least ' : ''}
                {board.hiddenTiedCount} more player
                {board.hiddenTiedCount === 1 ? '' : 's'} also on{' '}
                {formatCount(cutoff.value, config.unit)}, tied for{' '}
                {toOrdinal(cutoff.rank)}.
              </p>
            )}
            <p className="stat-board__note">
              “=” marks a shared rank. Tied players are listed alphabetically.
            </p>
          </div>
        )}
      </>
    );
  };

  return (
    <section
      className={classNames('stat-board', `stat-board--${config.accent}`)}
      aria-labelledby={headingId}
      aria-busy={isLoading || undefined}
    >
      <header className="stat-board__header">
        <div className="stat-board__titles">
          <h2 id={headingId} className="stat-board__title">
            {config.title}
          </h2>
          <p className="stat-board__description">{config.description}</p>
        </div>
        <span className="stat-board__metric" aria-hidden="true">
          {config.metricLabel}
        </span>
      </header>
      <div className="stat-board__body">{renderBody()}</div>
    </section>
  );
};

export default StatLeaderboard;
