import React from 'react';
import { SQUAD_SIZE } from '@fpl/contracts/fpl';

import StatValue from '../../../components/StatValue';
import { formatPrice } from '../../../utils';

type SquadMetricsProps = {
  isLoading: boolean;
  budget: number;
  budgetRemaining: number;
  totalCost: number;
  squadSize: number;
};

export const SquadMetrics: React.FC<SquadMetricsProps> = ({
  isLoading,
  budget,
  budgetRemaining,
  totalCost,
  squadSize,
}) => {
  return (
    <div className="squad-metrics">
      <div className="squad-metrics__item">
        <StatValue
          label="Remaining Bank"
          value={isLoading ? '—' : `${formatPrice(budgetRemaining)}`}
          hint={`Squad Cost: ${formatPrice(totalCost)}`}
          tone={totalCost > budget ? 'danger' : 'success'}
        />
      </div>
      <div className="squad-metrics__item">
        <StatValue
          label="Squad Size"
          value={isLoading ? '—' : `${squadSize}/${SQUAD_SIZE}`}
          hint="Full squad is required to analyze"
          tone={squadSize === SQUAD_SIZE ? 'success' : 'warning'}
        />
      </div>
    </div>
  );
};

export default SquadMetrics;
