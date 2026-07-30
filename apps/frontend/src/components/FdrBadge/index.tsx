import React from 'react';
import classNames from 'classnames';
import './index.scss';

export type FdrBadgeProps = {
  difficulty?: number;
  size?: 'sm' | 'md';
};

export const FdrBadge: React.FC<FdrBadgeProps> = ({
  difficulty,
  size = 'sm',
}) => {
  const displayVal = difficulty !== undefined ? String(Math.round(difficulty)) : '—';
  
  const difficultyClass = difficulty !== undefined
    ? `fdr-badge--level-${Math.min(5, Math.max(1, Math.round(difficulty)))}`
    : 'fdr-badge--undefined';

  return (
    <div
      className={classNames('fdr-badge', `fdr-badge--${size}`, difficultyClass)}
      title={difficulty !== undefined ? `FDR: ${difficulty}` : 'Difficulty Unknown'}
    >
      <span className="fdr-badge__value">{displayVal}</span>
    </div>
  );
};

export default FdrBadge;