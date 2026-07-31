import React, { useMemo } from 'react';
import { useGetTeams, useGetTeamNames } from '../../features/teams/hooks';
import { Routes } from '../../routes/types';
import TeamBadge from '../../components/TeamBadge';
import CardSkeleton from '../../components/CardSkeleton';
import ErrorState from '../../components/ErrorState';
import PageSection from '../../components/PageSection';
import Hyperlink from '../../components/HyperLink';
import Text from '../../components/Text';
import './index.scss';

export const TeamsPage: React.FC = () => {
  const {
    teams,
    isLoading: isTeamsLoading,
    error: teamsError,
  } = useGetTeams();

  const {
    teamNamesById,
    isLoading: isNamesLoading,
    error: namesError,
  } = useGetTeamNames();

  const isLoading = isTeamsLoading || isNamesLoading;
  const error = teamsError || namesError;

  const teamsList = useMemo(() => {
    if (!teamNamesById) return [];
    return Object.entries(teamNamesById)
      .map(([id, name]) => {
        const numericId = Number(id);
        const trivia = teams?.[name];
        return {
          id: numericId,
          name,
          trivia,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [teamNamesById, teams]);

  if (error) {
    return (
      <div className="teams-page">
        <div className="teams-page__container">
          <ErrorState
            title="Failed to Load Clubs"
            message={error.message || 'Please check your connection and try again.'}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="teams-page">
      <div className="teams-page__container">
        <PageSection
          title="Premier League Clubs"
          subtitle={
            isLoading
              ? 'Loading clubs data...'
              : 'Explore squads, fixtures, and statistics for all 20 competing teams.'
          }
        >
          {isLoading ? (
            <CardSkeleton count={8} />
          ) : (
            <div className="teams-grid">
              {teamsList.map((team) => {
                const nickname = team.trivia?.nickname || '—';
                const arena = team.trivia?.arena || '—';
                const city = team.trivia?.city || '—';

                return (
                  <div key={team.id} className="team-card">
                    <Hyperlink
                      route={Routes.TeamDetail}
                      params={{ id: team.id }}
                      subtle
                    >
                      <div className="team-card__content">
                        <div className="team-card__header">
                          <TeamBadge teamName={team.name} size="lg" />
                          <div className="team-card__titles">
                            <Text variant="primary" tagName="h3" className="team-card__name">
                              {team.name}
                            </Text>
                            <Text variant="secondary" tagName="span" className="team-card__nickname">
                              {nickname}
                            </Text>
                          </div>
                        </div>
                        <div className="team-card__body">
                          <div className="team-card__info-row">
                            <span className="team-card__info-label">Arena</span>
                            <span className="team-card__info-value" title={arena}>
                              {arena}
                            </span>
                          </div>
                          <div className="team-card__info-row">
                            <span className="team-card__info-label">City</span>
                            <span className="team-card__info-value">
                              {city}
                            </span>
                          </div>
                        </div>
                        <div className="team-card__footer">
                          <span className="team-card__action">View Club →</span>
                        </div>
                      </div>
                    </Hyperlink>
                  </div>
                );
              })}
            </div>
          )}
        </PageSection>
      </div>
    </div>
  );
};

export default TeamsPage;
