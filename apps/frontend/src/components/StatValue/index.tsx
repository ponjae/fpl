import React from 'react';
import classNames from 'classnames';
import './index.scss';

export type StatValueProps = {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
};

export const StatValue: React.FC<StatValueProps> = ({
  label,
  value,
  hint,
  tone = 'default',
}) => {
  return (
    <div className={classNames('stat-value-card', `stat-value-card--${tone}`)}>
      <span className="stat-value-label">{label}</span>
      <span className="stat-value-num">{value}</span>
      {hint && <span className="stat-value-hint">{hint}</span>}
    </div>
  );
};

export default StatValue;