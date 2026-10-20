import React from 'react';
import { TransferPlan } from '@fpl/contracts/fpl';

import Button from '../../../components/Button';
import ErrorState from '../../../components/ErrorState';
import StatValue from '../../../components/StatValue';
import { ApiErrorBody } from '../../../features/api/types';
import {
  getNoMovePlanMessage,
  getPlanLoadingMessage,
} from '../../../features/squad/freeTransfers';
import { formatPrice, formatValue } from '../../../utils';
import TransferPlanMoveRow from './TransferPlanMoveRow';

type TransferPlanResultsProps = {
  freeTransfers: number;
  isLoading: boolean;
  error: ApiErrorBody | undefined;
  transferPlan: TransferPlan | undefined;
  teamNamesById: Record<number, string>;
  onRetry: () => void;
  onApply: () => void;
  onDismiss: () => void;
};

export const TransferPlanResults: React.FC<TransferPlanResultsProps> = ({
  freeTransfers,
  isLoading,
  error,
  transferPlan,
  teamNamesById,
  onRetry,
  onApply,
  onDismiss,
}) => {
  return (
    <div className="analysis-results-card">
      <h3 className="analysis-results-card__title">
        Transfer plan
      </h3>
      {isLoading ? (
        <div className="analysis-results-card__loading">
          <div className="analysis-spinner" />
          <span>{getPlanLoadingMessage(freeTransfers)}</span>
        </div>
      ) : error ? (
        <ErrorState
          title="Could not build a transfer plan"
          message={
            error.message ||
            'The planner could not produce a valid plan for this squad.'
          }
          onRetry={onRetry}
        />
      ) : !transferPlan ? null : transferPlan.moves.length === 0 ? (
        <div className="analysis-results-card__success">
          <span>
            {getNoMovePlanMessage(transferPlan.freeTransfers)}
          </span>
        </div>
      ) : (
        <>
          {!transferPlan.optimal && (
            <div className="plan-notice">
              The solver could not prove this plan optimal, so a
              fallback was used. The result may be sub-optimal.
            </div>
          )}

          <div className="plan-moves">
            {transferPlan.moves.map((m) => (
              <TransferPlanMoveRow
                key={m.order}
                move={m}
                teamNamesById={teamNamesById}
              />
            ))}
          </div>

          <div className="plan-summary">
            <StatValue
              label="Transfers used"
              value={`${transferPlan.transfersUsed}/${transferPlan.freeTransfers}`}
            />
            <StatValue
              label="Net spend"
              value={formatPrice(transferPlan.netSpend)}
            />
            <StatValue
              label="Bank after transfers"
              value={formatPrice(transferPlan.resultingBank)}
              tone={transferPlan.resultingBank < 0 ? 'danger' : 'default'}
            />
            <StatValue
              label="Value gain"
              value={`${
                transferPlan.totalValueGain >= 0 ? '+' : ''
              }${formatValue(transferPlan.totalValueGain, 2)}`}
              hint={`${formatValue(
                transferPlan.currentTotalValue,
                2
              )} → ${formatValue(transferPlan.resultingTotalValue, 2)}`}
              tone={
                transferPlan.totalValueGain > 0 ? 'success' : 'default'
              }
            />
            <StatValue
              label="New formation"
              value={transferPlan.resultingFormation}
            />
          </div>

          {transferPlan.priceBasis !== 'provided_selling_price' && (
            <p className="plan-disclosure">
              Sale proceeds are estimated from current prices, so your
              real bank may differ.
            </p>
          )}

          <div className="plan-actions">
            <Button
              type="button"
              variant="primary"
              onClick={onApply}
            >
              Apply plan
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onDismiss}
            >
              Dismiss
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default TransferPlanResults;
