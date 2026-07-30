import React from 'react';
import { FixtureEntry } from '@fpl/contracts/fpl';
import classNames from 'classnames';
import TeamBadge from '../TeamBadge';
import './index.scss';

export type FixtureListProps = {
  fixtures: FixtureEntry[];
  teamNamesById: Record<number, string>;
  compact?: boolean;
};

export const FixtureList: React.FC<FixtureListProps> = ({
  fixtures,
  teamNamesById,
  compact = false,
}) => {
  if (!fixtures || fixtures.length === 0) {
    return (
      <div className="fixture-list-empty">
        No fixtures scheduled for this gameweek.
      </div>
    );
  }

  // Sort fixtures: finished ones can go first or we can keep their default order.
  // Usually, keeping the default API order is best.

  return (
    <div
      className={classNames('fixture-list', {
        'fixture-list--compact': compact,
      })}
    >
      {fixtures.map((fixture, index) => {
        const homeName =
          teamNamesById[fixture.home_team] || `Team ${fixture.home_team}`;
        const awayName =
          teamNamesById[fixture.away_team] || `Team ${fixture.away_team}`;

        return (
          <div
            key={`${fixture.home_team}-${fixture.away_team}-${index}`}
            className="fixture-row"
          >
            {/* Home Team */}
            <div className="fixture-team fixture-team--home">
              <span className="fixture-team-name" title={homeName}>
                {homeName}
              </span>
              <TeamBadge teamName={homeName} size={compact ? 'sm' : 'md'} />
            </div>

            {/* Score or VS */}
            <div className="fixture-status">
              {fixture.finished ? (
                <div className="fixture-score">
                  <span className="fixture-score-val">
                    {fixture.home_score ?? 0}
                  </span>
                  <span className="fixture-score-dash">-</span>
                  <span className="fixture-score-val">
                    {fixture.away_score ?? 0}
                  </span>
                </div>
              ) : (
                <div className="fixture-vs">VS</div>
              )}
            </div>

            {/* Away Team */}
            <div className="fixture-team fixture-team--away">
              <TeamBadge teamName={awayName} size={compact ? 'sm' : 'md'} />
              <span className="fixture-team-name" title={awayName}>
                {awayName}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FixtureList;
