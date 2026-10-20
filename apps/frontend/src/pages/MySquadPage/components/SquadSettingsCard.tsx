import React from 'react';

import Button from '../../../components/Button';
import { BUDGET_MAX, BUDGET_MIN } from '../utils/money';
import MoneyStepper from './MoneyStepper';

type SquadSettingsCardProps = {
  budget: number;
  onBudgetChange: (budget: number) => void;
  selectedFormation: string;
  formations: string[];
  onFormationChange: (formation: string) => void;
  canOptimize: boolean;
  onOptimize: () => void;
  isLoading: boolean;
};

export const SquadSettingsCard: React.FC<SquadSettingsCardProps> = ({
  budget,
  onBudgetChange,
  selectedFormation,
  formations,
  onFormationChange,
  canOptimize,
  onOptimize,
  isLoading,
}) => {
  return (
    <div className="validation-card">
      <h3 className="validation-card__title">Squad Settings</h3>

      {/* Budget control */}
      <div className="optimizer-control-group">
        <label className="optimizer-control-label" htmlFor="budget-input">Budget (£m)</label>
        <MoneyStepper
          id="budget-input"
          value={budget}
          min={BUDGET_MIN}
          max={BUDGET_MAX}
          disabled={isLoading}
          onChange={onBudgetChange}
        />
      </div>

      {/* Formation control */}
      <div className="optimizer-control-group">
        <label className="optimizer-control-label" htmlFor="formation-select">Formation</label>
        <div className="formation-picker">
          <select
            id="formation-select"
            className="formation-picker__select"
            value={selectedFormation}
            onChange={(e) => onFormationChange(e.target.value)}
            disabled={isLoading}
          >
            {formations.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="validation-card__actions" style={{ marginTop: 0 }}>
        <Button
          type="button"
          variant="secondary"
          onClick={onOptimize}
          disabled={!canOptimize || isLoading}
          className="analyze-btn"
        >
          Optimize formation
        </Button>
      </div>
    </div>
  );
};

export default SquadSettingsCard;
