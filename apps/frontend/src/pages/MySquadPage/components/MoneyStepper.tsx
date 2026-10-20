import React from 'react';

type MoneyStepperProps = {
  /** Id of the number input, referenced by the field's label. */
  id: string;
  value: number;
  min: number;
  max: number;
  disabled: boolean;
  /** Receives the stepped or typed amount; the parent clamps it. */
  onChange: (value: number) => void;
};

/** A £m number input with -1.0 / -0.1 / +0.1 / +1.0 step buttons. */
export const MoneyStepper: React.FC<MoneyStepperProps> = ({
  id,
  value,
  min,
  max,
  disabled,
  onChange,
}) => {
  const adjustBy = (amount: number) => {
    onChange(value + amount);
  };

  return (
    <div className="budget-picker">
      <button
        type="button"
        className="budget-picker__btn"
        onClick={() => adjustBy(-1.0)}
        title="Decrease by £1.0m"
        disabled={value <= min || disabled}
      >
        -1.0
      </button>
      <button
        type="button"
        className="budget-picker__btn budget-picker__btn--small"
        onClick={() => adjustBy(-0.1)}
        title="Decrease by £0.1m"
        disabled={value <= min || disabled}
      >
        -0.1
      </button>
      <input
        id={id}
        type="number"
        className="budget-picker__input"
        value={value}
        step={0.1}
        min={min}
        max={max}
        onChange={(e) => {
          const val = parseFloat(e.target.value);
          if (!isNaN(val)) onChange(val);
        }}
        disabled={disabled}
      />
      <button
        type="button"
        className="budget-picker__btn budget-picker__btn--small"
        onClick={() => adjustBy(0.1)}
        title="Increase by £0.1m"
        disabled={value >= max || disabled}
      >
        +0.1
      </button>
      <button
        type="button"
        className="budget-picker__btn"
        onClick={() => adjustBy(1.0)}
        title="Increase by £1.0m"
        disabled={value >= max || disabled}
      >
        +1.0
      </button>
    </div>
  );
};

export default MoneyStepper;
