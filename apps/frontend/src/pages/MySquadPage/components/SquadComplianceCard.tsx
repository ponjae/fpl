import React from 'react';
import { SQUAD_SIZE, SQUAD_RULES } from '@fpl/contracts/fpl';

import Button from '../../../components/Button';
import { getPositionShortLabel } from '../../../utils';
import { SquadValidation } from '../utils/validation';

type SquadComplianceCardProps = {
  squadSize: number;
  budget: number;
  validation: SquadValidation;
  isLoading: boolean;
  isAnalysisLoading: boolean;
  onAnalyze: () => void;
};

export const SquadComplianceCard: React.FC<SquadComplianceCardProps> = ({
  squadSize,
  budget,
  validation,
  isLoading,
  isAnalysisLoading,
  onAnalyze,
}) => {
  return (
    <div className="validation-card">
      <h3 className="validation-card__title">Squad Compliance</h3>
      <div className="validation-checklist">
        {/* Rule 1: Squad size */}
        <div className={`validation-item ${squadSize === SQUAD_SIZE ? 'validation-item--success' : 'validation-item--warning'}`}>
          <span className="validation-item__icon">
            {squadSize === SQUAD_SIZE ? '✓' : '○'}
          </span>
          <div className="validation-item__content">
            <span className="validation-item__name">Squad Size</span>
            <span className="validation-item__desc">
              {squadSize}/{SQUAD_SIZE} players selected.
            </span>
          </div>
        </div>

        {/* Rule 2: Position Counts */}
        {Object.entries(SQUAD_RULES).map(([posStr, rule]) => {
          const pos = parseInt(posStr, 10);
          const count = validation.posCounts[pos] || 0;
          const label = getPositionShortLabel(pos);
          const isPerfect = count === rule.squad;
          return (
            <div key={pos} className={`validation-item ${isPerfect ? 'validation-item--success' : 'validation-item--warning'}`}>
              <span className="validation-item__icon">
                {isPerfect ? '✓' : '○'}
              </span>
              <div className="validation-item__content">
                <span className="validation-item__name">{label} Quantity</span>
                <span className="validation-item__desc">
                  {count}/{rule.squad} selected.
                </span>
              </div>
            </div>
          );
        })}

        {/* Rule 3: Budget check */}
        <div className={`validation-item ${validation.totalCost <= budget ? 'validation-item--success' : 'validation-item--error'}`}>
          <span className="validation-item__icon">
            {validation.totalCost <= budget ? '✓' : '✗'}
          </span>
          <div className="validation-item__content">
            <span className="validation-item__name">Budget Limit</span>
            <span className="validation-item__desc">
              £{validation.totalCost.toFixed(1)}m / £{budget.toFixed(1)}m.
            </span>
          </div>
        </div>
      </div>

      {/* Specific active validation errors */}
      {validation.errors.length > 0 && (
        <div className="validation-errors-list">
          {validation.errors.map((err, idx) => (
            <div key={idx} className="validation-error-msg">
              <span className="validation-error-msg__bullet">•</span>
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Action Button */}
      <div className="validation-card__actions">
        <Button
          type="button"
          variant="primary"
          onClick={onAnalyze}
          disabled={!validation.isValid || isLoading}
          loading={isAnalysisLoading}
          className="analyze-btn"
        >
          Analyze Squad
        </Button>
      </div>
    </div>
  );
};

export default SquadComplianceCard;
