import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { teamNameToBadgeKey } from '../../utils';
import './index.scss';

const badges = import.meta.glob<{ default: string }>('../../assets/badges/*.png', {
  eager: true,
});

export type TeamBadgeProps = {
  teamName: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
};

export const TeamBadge: React.FC<TeamBadgeProps> = ({
  teamName,
  size = 'md',
  showLabel = false,
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [teamName]);

  const badgeKey = teamNameToBadgeKey(teamName);
  const badgePath = badgeKey ? badges[`../../assets/badges/${badgeKey}`]?.default : undefined;

  const initial = teamName
    ? teamName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 2).toUpperCase()
    : '??';

  const showFallback = hasError || !badgePath;

  return (
    <div className={classNames('team-badge-container', `team-badge-container--${size}`)}>
      <div className={classNames('team-badge-icon', `team-badge-icon--${size}`)}>
        {showFallback ? (
          <div className="team-badge-fallback" title={teamName}>
            {initial}
          </div>
        ) : (
          <img
            src={badgePath}
            alt={`${teamName} Badge`}
            className="team-badge-img"
            onError={() => setHasError(true)}
          />
        )}
      </div>
      {showLabel && (
        <span className={classNames('team-badge-label', `team-badge-label--${size}`)}>
          {teamName}
        </span>
      )}
    </div>
  );
};

export default TeamBadge;