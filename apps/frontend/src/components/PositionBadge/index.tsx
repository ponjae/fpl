import React from 'react';
import classNames from 'classnames';
import { getPositionLabel, getPositionShortLabel } from '../../utils';
import './index.scss';

export type PositionBadgeProps = {
  elementType: number;
  short?: boolean;
};

export const PositionBadge: React.FC<PositionBadgeProps> = ({
  elementType,
  short = false,
}) => {
  const label = short ? getPositionShortLabel(elementType) : getPositionLabel(elementType);
  const positionClass = `position-badge--${getPositionShortLabel(elementType).toLowerCase()}`;

  return (
    <span className={classNames('position-badge', positionClass)}>
      {label}
    </span>
  );
};

export default PositionBadge;