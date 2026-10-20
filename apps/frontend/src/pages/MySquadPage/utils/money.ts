/** Limits for the squad budget input, in £m. */
export const BUDGET_MIN = 50.0;
export const BUDGET_MAX = 150.0;

/** Limits for the money-in-the-bank input, in £m. */
export const BANK_MIN = 0;
export const BANK_MAX = 100.0;

/** Clamps a £m amount to the given range and rounds it to one decimal. */
export const clampMoney = (value: number, min: number, max: number): number =>
  parseFloat(Math.max(min, Math.min(max, value)).toFixed(1));
