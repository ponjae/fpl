import React from 'react';
import { SquadHorizon } from '@fpl/contracts/fpl';

import Button from '../../../components/Button';
import HorizonTabs from '../../../components/HorizonTabs';

type SquadToolbarProps = {
  horizon: SquadHorizon;
  onHorizonChange: (horizon: SquadHorizon) => void;
  hasPicks: boolean;
  hasOptimalSquad: boolean;
  isLoading: boolean;
  onAutofill: () => void;
  onClear: () => void;
};

export const SquadToolbar: React.FC<SquadToolbarProps> = ({
  horizon,
  onHorizonChange,
  hasPicks,
  hasOptimalSquad,
  isLoading,
  onAutofill,
  onClear,
}) => {
  return (
    <div className="squad-toolbar">
      <div className="squad-toolbar__horizon">
        <span className="squad-toolbar__lbl">Horizon:</span>
        <HorizonTabs value={horizon} onChange={onHorizonChange} />
      </div>
      <div className="squad-toolbar__actions">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onAutofill}
          disabled={isLoading || !hasOptimalSquad}
        >
          Auto-fill Optimal
        </Button>
        {hasPicks && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={isLoading}
          >
            Clear All
          </Button>
        )}
      </div>
    </div>
  );
};

export default SquadToolbar;
