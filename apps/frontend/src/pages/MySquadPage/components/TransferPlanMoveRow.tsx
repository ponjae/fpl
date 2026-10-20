import React from 'react';
import { TransferPlanMove } from '@fpl/contracts/fpl';

import PositionBadge from '../../../components/PositionBadge';
import TeamBadge from '../../../components/TeamBadge';
import { formatPrice, formatValue } from '../../../utils';

type TransferPlanMoveRowProps = {
  move: TransferPlanMove;
  teamNamesById: Record<number, string>;
};

export const TransferPlanMoveRow: React.FC<TransferPlanMoveRowProps> = ({
  move: m,
  teamNamesById,
}) => {
  const outTeam =
    teamNamesById[m.playerOut.generalInfo.team] || 'Unknown';
  const inTeam =
    teamNamesById[m.playerIn.generalInfo.team] || 'Unknown';

  return (
    <div className="plan-move">
      <div className="plan-move__side plan-move__side--out">
        <span className="plan-move__label">Out</span>
        <span className="plan-move__name">
          {m.playerOut.generalInfo.web_name}
        </span>
        <div className="plan-move__meta">
          <TeamBadge teamName={outTeam} size="sm" />
          <PositionBadge
            elementType={m.playerOut.generalInfo.element_type}
            short
          />
          <span className="font-tabular">
            {formatPrice(m.sellingPrice)}
          </span>
        </div>
      </div>

      <div className="plan-move__arrow" aria-hidden="true">
        →
      </div>

      <div className="plan-move__side plan-move__side--in">
        <span className="plan-move__label">In</span>
        <span className="plan-move__name">
          {m.playerIn.generalInfo.web_name}
        </span>
        <div className="plan-move__meta">
          <TeamBadge teamName={inTeam} size="sm" />
          <PositionBadge
            elementType={m.playerIn.generalInfo.element_type}
            short
          />
          <span className="font-tabular">
            {formatPrice(m.purchasePrice)}
          </span>
        </div>
      </div>

      <div className="plan-move__figures font-tabular">
        <span
          className={
            m.costDelta > 0
              ? 'plan-move__cost plan-move__cost--spend'
              : 'plan-move__cost plan-move__cost--free'
          }
        >
          {m.costDelta > 0 ? 'Costs ' : 'Frees '}
          {formatPrice(Math.abs(m.costDelta))}
        </span>
        <span className="plan-move__gain">
          Score {m.valueGain >= 0 ? '+' : ''}
          {formatValue(m.valueGain, 2)}
        </span>
      </div>
    </div>
  );
};

export default TransferPlanMoveRow;
