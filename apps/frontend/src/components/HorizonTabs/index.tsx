import React from 'react';
import { SquadHorizon } from '@fpl/contracts/fpl';
import classNames from 'classnames';
import './index.scss';

export type HorizonTabsProps = {
  value: SquadHorizon;
  onChange: (v: SquadHorizon) => void;
};

type TabOption = {
  value: SquadHorizon;
  label: string;
};

const OPTIONS: TabOption[] = [
  { value: 'value', label: 'Next GW' },
  { value: 'value5', label: 'Next 5' },
  { value: 'value_remaining', label: 'Rest of season' },
];

export const HorizonTabs: React.FC<HorizonTabsProps> = ({
  value,
  onChange,
}) => {
  return (
    <div
      className="horizon-tabs"
      role="tablist"
      aria-label="Squad optimization horizon"
    >
      {OPTIONS.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={isActive}
            className={classNames('horizon-tab-button', {
              'is-active': isActive,
            })}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

export default HorizonTabs;
