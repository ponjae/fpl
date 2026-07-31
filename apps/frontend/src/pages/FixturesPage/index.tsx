import React, { useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGetGameweeks, useGetCurrentGameweek } from '../../features/gameweeks/hooks';
import { useGetFixturesByGameweek } from '../../features/fixtures/hooks';
import { useGetTeamNames } from '../../features/teams/hooks';
import { useGetPlayers } from '../../features/players/hooks';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import PageSection from '../../components/PageSection';
import StatValue from '../../components/StatValue';
import TableSkeleton from '../../components/TableSkeleton';
import CardSkeleton from '../../components/CardSkeleton';
import FixtureList from '../../components/FixtureList';
import { formatValue } from '../../utils';
import './index.scss';

export const FixturesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const gwParam = searchParams.get('gw');

  // Fetch API Data
  const {
    gameweeks,
    isLoading: isGameweeksLoading,
    error: gameweeksError,
  } = useGetGameweeks();

  const {
    gameweek: currentGameweek,
    isLoading: isCurrentGameweekLoading,
    error: currentGameweekError,
  } = useGetCurrentGameweek();

  const {
    teamNamesById,
    isLoading: isTeamsLoading,
    error: teamsError,
  } = useGetTeamNames();

  const {
    players,
    isLoading: isPlayersLoading,
    error: playersError,
  } = useGetPlayers();

  // Validate and get active gameweek ID on read
  const activeGwId = useMemo(() => {
    if (!gameweeks) return undefined;
    
    if (gwParam) {
      const parsed = parseInt(gwParam, 10);
      if (!isNaN(parsed) && gameweeks[parsed]) {
        return parsed;
      }
    }
    
    if (currentGameweek) {
      return currentGameweek.id;
    }
    
    // Fallback if current is not loaded/found
    const keys = Object.keys(gameweeks).map(Number);
    if (keys.length > 0) {
      return Math.min(...keys);
    }
    
    return undefined;
  }, [gwParam, gameweeks, currentGameweek]);

  // Sync / write parameter back to URL if empty or garbage
  useEffect(() => {
    if (activeGwId !== undefined && String(activeGwId) !== gwParam) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('gw', String(activeGwId));
      setSearchParams(newParams, { replace: true });
    }
  }, [activeGwId, gwParam, setSearchParams, searchParams]);

  // Fetch fixtures for the active gameweek
  const {
    fixtures,
    isLoading: isFixturesLoading,
    error: fixturesError,
  } = useGetFixturesByGameweek(activeGwId);

  const activeGwData = useMemo(() => {
    return activeGwId !== undefined ? gameweeks?.[activeGwId] : undefined;
  }, [gameweeks, activeGwId]);

  // Helper to update parameter with { replace: true }
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

  const handlePrev = () => {
    if (activeGwId && activeGwId > 1) {
      updateSearchParams({ gw: String(activeGwId - 1) });
    }
  };

  const handleNext = () => {
    if (activeGwId && activeGwId < 38) {
      updateSearchParams({ gw: String(activeGwId + 1) });
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSearchParams({ gw: e.target.value });
  };

  // Helper to lookup player names safely
  const getPlayerName = useCallback(
    (id: number | null | undefined) => {
      if (id === null || id === undefined) return '—';
      if (isPlayersLoading) return 'Loading...';
      return players?.byId?.[id]?.generalInfo?.web_name || '—';
    },
    [players, isPlayersLoading]
  );

  // Error Check
  const globalError =
    gameweeksError ||
    currentGameweekError ||
    teamsError ||
    fixturesError ||
    playersError;

  if (globalError) {
    return (
      <div className="fixtures-page padded-container">
        <ErrorState
          title="Failed to Load Fixtures"
          message={globalError.message}
        />
      </div>
    );
  }

  const isGlobalLoading =
    isGameweeksLoading || isCurrentGameweekLoading || isTeamsLoading;

  const renderControlBar = () => {
    if (isGlobalLoading) {
      return <div className="fixtures-control-bar-placeholder" />;
    }

    const gameweekKeys = Object.keys(gameweeks || {})
      .map(Number)
      .sort((a, b) => a - b);

    const isCurrent = activeGwId === currentGameweek?.id;
    const isFinished = activeGwData?.finished;

    return (
      <div className="fixtures-control-bar">
        <div className="fixtures-control-bar__navigation">
          <Button
            variant="secondary"
            size="md"
            onClick={handlePrev}
            disabled={activeGwId === undefined || activeGwId <= 1}
          >
            Previous GW
          </Button>

          <div className="fixtures-control-bar__select-wrapper">
            <select
              value={activeGwId || ''}
              onChange={handleSelectChange}
              className="fixtures-control-bar__select"
              aria-label="Select Gameweek"
            >
              {gameweekKeys.map((id) => (
                <option key={id} value={id}>
                  Gameweek {id}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="secondary"
            size="md"
            onClick={handleNext}
            disabled={activeGwId === undefined || activeGwId >= 38}
          >
            Next GW
          </Button>
        </div>

        {activeGwId && (
          <div className="fixtures-control-bar__status">
            {isCurrent && (
              <span className="gw-badge gw-badge--current">Current Gameweek</span>
            )}
            {isFinished ? (
              <span className="gw-badge gw-badge--finished">Finished</span>
            ) : (
              !isCurrent && (
                <span className="gw-badge gw-badge--upcoming">Upcoming</span>
              )
            )}
          </div>
        )}
      </div>
    );
  };

  const renderGameweekSummary = () => {
    if (isGlobalLoading || isPlayersLoading) {
      return <CardSkeleton count={1} />;
    }

    if (!activeGwData) {
      return (
        <EmptyState
          title="No Gameweek Data"
          message="Detailed statistics are not available for this gameweek."
        />
      );
    }

    // A gameweek is played if it is finished OR if it has a non-null, non-zero highest score
    const isPlayed =
      activeGwData.finished ||
      (activeGwData.highest_score !== null && activeGwData.highest_score !== 0);

    const averageScore = isPlayed
      ? formatValue(activeGwData.average_entry_score, 0)
      : '—';
    const highestScore =
      activeGwData.highest_score !== null
        ? formatValue(activeGwData.highest_score, 0)
        : '—';
    const mostCaptained = getPlayerName(activeGwData.most_captained);

    const topScorerName = activeGwData.top_element_info
      ? getPlayerName(activeGwData.top_element_info.id)
      : '—';
    const topScorerPoints = activeGwData.top_element_info
      ? `(${activeGwData.top_element_info.points} pts)`
      : '';
    const topScorer = activeGwData.top_element_info
      ? `${topScorerName} ${topScorerPoints}`
      : '—';

    // Helper for safe Chip count loading
    const getChipCount = (chipName: string) => {
      if (!isPlayed) return '—';
      const chip = activeGwData.chip_plays.find(
        (c) => c.chip_name === chipName
      );
      return chip ? chip.num_played.toLocaleString() : '0';
    };

    return (
      <div className="gameweek-summary">
        <div className="gameweek-summary__stats">
          <StatValue
            label="Average score"
            value={averageScore}
            tone={isPlayed ? 'success' : 'default'}
          />
          <StatValue
            label="Highest score"
            value={highestScore}
            tone={isPlayed ? 'warning' : 'default'}
          />
          <StatValue label="Most captained" value={mostCaptained} />
          <StatValue label="Top scorer" value={topScorer} />
        </div>

        <div className="gameweek-summary__chips">
          <h4 className="gameweek-summary__chips-title">Active Chips</h4>
          <div className="gameweek-summary__chips-grid">
            <div className="chip-stat">
              <span className="chip-stat__label">Wildcard</span>
              <span className="chip-stat__value">
                {getChipCount('wildcard')}
              </span>
            </div>
            <div className="chip-stat">
              <span className="chip-stat__label">Free Hit</span>
              <span className="chip-stat__value">
                {getChipCount('freehit')}
              </span>
            </div>
            <div className="chip-stat">
              <span className="chip-stat__label">Triple Captain</span>
              <span className="chip-stat__value">
                {getChipCount('3xc')}
              </span>
            </div>
            <div className="chip-stat">
              <span className="chip-stat__label">Bench Boost</span>
              <span className="chip-stat__value">
                {getChipCount('bboost')}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFixtures = () => {
    if (isGlobalLoading || isFixturesLoading) {
      return <TableSkeleton rows={10} columns={3} />;
    }

    if (!fixtures || fixtures.length === 0) {
      return (
        <EmptyState
          title="No Fixtures Found"
          message={`We couldn't retrieve the schedule for Gameweek ${activeGwId}.`}
        />
      );
    }

    return (
      <FixtureList
        fixtures={fixtures}
        teamNamesById={teamNamesById}
        compact={false}
        groupByDay={true}
      />
    );
  };

  return (
    <div className="fixtures-page">
      <div className="fixtures-page__container">
        {/* Controls Header Block */}
        <div className="fixtures-page__header">
          <div className="fixtures-page__titles">
            <h1 className="fixtures-page__title">Fixtures & Results</h1>
            <p className="fixtures-page__subtitle">
              Browse full Premier League schedules, match scores, and gameweek baselines.
            </p>
          </div>
          {renderControlBar()}
        </div>

        {/* Statistical Summary Panel */}
        <PageSection
          title="Gameweek Overview"
          subtitle="Key performance indices and chip deployments."
        >
          {renderGameweekSummary()}
        </PageSection>

        {/* Scheduled Fixtures Block */}
        <PageSection
          title="Match Schedule"
          subtitle="Fixture pairings and scores in chronological order."
        >
          {renderFixtures()}
        </PageSection>
      </div>
    </div>
  );
};

export default FixturesPage;
