import React, { useMemo } from 'react';
import { FixtureEntry } from '@fpl/contracts/fpl';
import classNames from 'classnames';
import TeamBadge from '../TeamBadge';
import './index.scss';

export type FixtureListProps = {
  fixtures: FixtureEntry[];
  teamNamesById: Record<number, string>;
  compact?: boolean;
  groupByDay?: boolean;
  showGameweek?: boolean;
  showKickoffInCompact?: boolean;
};

export const FixtureList: React.FC<FixtureListProps> = ({
  fixtures,
  teamNamesById,
  compact = false,
  groupByDay,
  showGameweek = false,
  showKickoffInCompact = false,
}) => {
  const groupByDayValue = groupByDay ?? !compact;

  // Helper to format kickoff details
  const getKickoffInfo = (fixture: FixtureEntry) => {
    if (!fixture.kickoff_time) {
      return {
        timeStr: 'TBC',
        fullStr: 'TBC',
      };
    }

    try {
      const date = new Date(fixture.kickoff_time);
      if (isNaN(date.getTime())) {
        return {
          timeStr: 'TBC',
          fullStr: 'TBC',
        };
      }
      
      const timeStr = date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });

      const fullStr = date.toLocaleDateString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }) + `, ${timeStr}`;

      return { timeStr, fullStr };
    } catch {
      return {
        timeStr: 'TBC',
        fullStr: 'TBC',
      };
    }
  };

  // Helper to render a single fixture row
  const renderFixtureRow = (fixture: FixtureEntry, index: number) => {
    const homeName =
      teamNamesById[fixture.home_team] || `Team ${fixture.home_team}`;
    const awayName =
      teamNamesById[fixture.away_team] || `Team ${fixture.away_team}`;

    const { timeStr, fullStr } = getKickoffInfo(fixture);

    const displayHeader = showGameweek || (compact && showKickoffInCompact);

    const teamsMarkup = (
      <>
        {/* Home Team */}
        <div className="fixture-team fixture-team--home">
          <span className="fixture-team-name" title={homeName}>
            {homeName}
          </span>
          <TeamBadge teamName={homeName} size={compact ? 'sm' : 'md'} />
        </div>

        {/* Score or VS & Kickoff */}
        <div className="fixture-status-container">
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
          {!compact && !displayHeader && (
            <div className="fixture-kickoff" title={fullStr}>
              {groupByDayValue ? timeStr : fullStr}
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="fixture-team fixture-team--away">
          <TeamBadge teamName={awayName} size={compact ? 'sm' : 'md'} />
          <span className="fixture-team-name" title={awayName}>
            {awayName}
          </span>
        </div>
      </>
    );

    if (displayHeader) {
      return (
        <div
          key={`${fixture.home_team}-${fixture.away_team}-${index}`}
          className="fixture-row fixture-row--with-header"
        >
          <div className="fixture-header">
            {showGameweek && (
              <span className="fixture-gw">Gameweek {fixture.gw}</span>
            )}
            {showKickoffInCompact && compact && (
              <span className="fixture-header-time">
                {fullStr}
              </span>
            )}
          </div>
          <div className="fixture-teams">
            {teamsMarkup}
          </div>
        </div>
      );
    }

    return (
      <div
        key={`${fixture.home_team}-${fixture.away_team}-${index}`}
        className="fixture-row"
      >
        {teamsMarkup}
      </div>
    );
  };

  // If grouping is requested, organize by day
  const groupedFixtures = useMemo(() => {
    if (!groupByDayValue || !fixtures || fixtures.length === 0) return null;

    const groups: { dayLabel: string; date: Date | null; items: FixtureEntry[] }[] = [];

    fixtures.forEach((fixture) => {
      let dayLabel = 'To Be Confirmed';
      let dateObj: Date | null = null;

      if (fixture.kickoff_time) {
        dateObj = new Date(fixture.kickoff_time);
        dayLabel = dateObj.toLocaleDateString(undefined, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        });
      }

      let group = groups.find((g) => g.dayLabel === dayLabel);
      if (!group) {
        group = { dayLabel, date: dateObj, items: [] };
        groups.push(group);
      }
      group.items.push(fixture);
    });

    // Sort groups chronologically (nulls/TBC last)
    groups.sort((a, b) => {
      if (a.date === null && b.date === null) return 0;
      if (a.date === null) return 1;
      if (b.date === null) return -1;
      return a.date.getTime() - b.date.getTime();
    });

    // Sort items within each group chronologically
    groups.forEach((group) => {
      group.items.sort((a, b) => {
        if (!a.kickoff_time && !b.kickoff_time) return 0;
        if (!a.kickoff_time) return 1;
        if (!b.kickoff_time) return -1;
        return new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime();
      });
    });

    return groups;
  }, [fixtures, groupByDayValue]);

  if (!fixtures || fixtures.length === 0) {
    return (
      <div className="fixture-list-empty">
        No fixtures scheduled for this gameweek.
      </div>
    );
  }

  return (
    <div
      className={classNames('fixture-list', {
        'fixture-list--compact': compact,
        'fixture-list--grouped': groupByDayValue,
      })}
    >
      {groupByDayValue && groupedFixtures ? (
        groupedFixtures.map((group, groupIdx) => (
          <div key={group.dayLabel || groupIdx} className="fixture-day-group">
            <h3 className="fixture-day-title">{group.dayLabel}</h3>
            <div className="fixture-day-fixtures">
              {group.items.map((fixture, idx) => renderFixtureRow(fixture, idx))}
            </div>
          </div>
        ))
      ) : (
        <div className="fixture-flat-list">
          {fixtures.map((fixture, idx) => renderFixtureRow(fixture, idx))}
        </div>
      )}
    </div>
  );
};

export default FixtureList;
