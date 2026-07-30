import React from 'react';
import './index.scss';

export type CardSkeletonProps = {
  count?: number;
};

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ count = 1 }) => {
  const cardsArray = Array.from({ length: count });

  return (
    <div className="card-skeleton-grid">
      {cardsArray.map((_, index) => (
        <div key={`card-skeleton-${index}`} className="card-skeleton">
          <div className="card-skeleton__header">
            <div className="card-skeleton__badge-shimmer" />
            <div className="card-skeleton__title-container">
              <div className="card-skeleton__title-shimmer" />
              <div className="card-skeleton__subtitle-shimmer" />
            </div>
          </div>
          <div className="card-skeleton__body">
            <div className="card-skeleton__line-shimmer" />
            <div className="card-skeleton__line-shimmer short" />
          </div>
          <div className="card-skeleton__footer">
            <div className="card-skeleton__action-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default CardSkeleton;