import React from 'react';
import { ProcessedPlayer } from '@fpl/contracts/fpl';
import classNames from 'classnames';
import PositionBadge from '../PositionBadge';
import TeamBadge from '../TeamBadge';
import './index.scss';

export type PlayerIdentityProps = {
  player: ProcessedPlayer;
  teamName?: string;
  compact?: boolean;
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

export const PlayerIdentity: React.FC<PlayerIdentityProps> = ({
  player,
  teamName,
  compact = false,
}) => {
  const { web_name, element_type, status } = player.generalInfo;
  const statusInfo = getStatusLabelAndTone(status);

  return (
    <div
      className={classNames('player-identity', {
        'player-identity--compact': compact,
      })}
    >
      {teamName && (
        <div className="player-identity__team">
          <TeamBadge teamName={teamName} size={compact ? 'sm' : 'md'} />
        </div>
      )}
      <div className="player-identity__details">
        <div className="player-identity__name-row">
          <div className="player-identity__name" title={web_name}>
            {web_name}
          </div>
          {statusInfo && (
            <span
              className={classNames(
                'player-identity__status',
                `player-identity__status--${statusInfo.tone}`
              )}
              title={statusInfo.label}
            >
              {statusInfo.label}
            </span>
          )}
        </div>
        <div className="player-identity__meta">
          {teamName && !compact && (
            <span className="player-identity__team-label">{teamName}</span>
          )}
          <PositionBadge elementType={element_type} short={compact} />
        </div>
      </div>
    </div>
  );
};

export default PlayerIdentity;
