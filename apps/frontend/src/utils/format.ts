/**
 * Formatting utilities for display values.
 *
 * NOTE: `now_cost` from the FPL API is stored in tenths of millions (e.g. 55
 * = £5.5m). DataProcessor divides by 10 before storing, so all `ProcessedPlayer`
 * cost values are already in millions. Do NOT divide again here.
 */

/**
 * Format a player price (already in millions) as a currency string.
 *
 * Always rendered to one decimal place, matching FPL's own price display, so
 * a 5.0m player reads `"£5.0m"` rather than `"£5m"` and float artefacts from
 * the backend's division are not surfaced.
 *
 * @param nowCost - cost in millions (e.g. `5.5`).
 * @returns formatted string, e.g. `"£5.5m"`.
 */
export const formatPrice = (nowCost: number): string =>
  `£${nowCost.toFixed(1)}m`;

/**
 * Format a numeric value to a fixed number of decimal places.
 *
 * Null or undefined values — e.g. `PlayerValue.value` when a player has no
 * fixtures in the target horizon — are rendered as an em-dash (`"—"`) rather
 * than zero, because "no fixtures" is semantically different from a value of 0.
 *
 * @param value - the value to format, or `null`/`undefined` for no data.
 * @param digits - decimal places (default `2`).
 * @returns formatted string, or `"—"` when the value is absent.
 */
export const formatValue = (
  value: number | null | undefined,
  digits = 2
): string => {
  if (value == null) return '—';
  return value.toFixed(digits);
};

/**
 * Format a points total as a plain integer string.
 *
 * @param value - the points value.
 * @returns formatted string, e.g. `"142"`.
 */
export const formatPoints = (value: number): string => String(Math.round(value));

/**
 * Format a percentage value (0–100) with one decimal place.
 *
 * @param value - the percentage value (e.g. `45.3`).
 * @returns formatted string, e.g. `"45.3%"`.
 */
export const formatPercent = (value: number): string => `${value.toFixed(1)}%`;
