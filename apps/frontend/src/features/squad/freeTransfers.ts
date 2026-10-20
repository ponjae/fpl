import { SquadHorizon, TransferPlanRequest } from '@fpl/contracts/fpl';

/**
 * Free-transfer bounds for the transfer planner.
 *
 * 0 is a real FPL state (all free transfers used this gameweek). The planner
 * never models points hits, so with 0 free transfers the only honest plan is
 * to keep the current squad.
 */
export const MIN_FREE_TRANSFERS = 0;
export const MAX_FREE_TRANSFERS = 5;
export const DEFAULT_FREE_TRANSFERS = 1;

/** Every selectable free-transfer count, in order: 0..5. */
export const FREE_TRANSFER_OPTIONS: readonly number[] = Array.from(
  { length: MAX_FREE_TRANSFERS - MIN_FREE_TRANSFERS + 1 },
  (_, i) => MIN_FREE_TRANSFERS + i
);

/**
 * Whether a value is a valid free-transfer count (integer 0..5).
 *
 * @param value - the candidate value.
 *
 * @returns true when valid.
 */
export const isValidFreeTransfers = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= MIN_FREE_TRANSFERS &&
  value <= MAX_FREE_TRANSFERS;

/**
 * Read a stored free-transfer count, keeping 0 and falling back on garbage.
 *
 * @param value - the raw persisted value.
 * @param fallback - used when the value is missing or out of range.
 *
 * @returns a valid free-transfer count.
 */
export const normalizeStoredFreeTransfers = (
  value: unknown,
  fallback = DEFAULT_FREE_TRANSFERS
): number => (isValidFreeTransfers(value) ? value : fallback);

/**
 * Clamp user input to a valid free-transfer count.
 *
 * @param value - the requested count.
 *
 * @returns the rounded count clamped to 0..5, or undefined for NaN.
 */
export const clampFreeTransfers = (value: number): number | undefined => {
  if (!Number.isFinite(value)) return undefined;
  return Math.max(
    MIN_FREE_TRANSFERS,
    Math.min(MAX_FREE_TRANSFERS, Math.round(value))
  );
};

type PlanPick = { id: number; sellingPrice?: number };

/**
 * Build the body for `POST /transfers/plan`.
 *
 * `sellingPrice` is omitted entirely when unset (the backend rejects
 * non-positive values), and `freeTransfers` is passed through as-is — 0 included.
 *
 * @param picks - the saved squad picks.
 * @param bank - money in the bank, in millions.
 * @param freeTransfers - free transfers available (0..5).
 * @param horizon - the value horizon to plan on.
 *
 * @returns the request body.
 */
export const buildTransferPlanRequest = (
  picks: PlanPick[],
  bank: number,
  freeTransfers: number,
  horizon: SquadHorizon
): TransferPlanRequest => ({
  squad: picks.map((p) =>
    p.sellingPrice !== undefined
      ? { playerId: p.id, sellingPrice: p.sellingPrice }
      : { playerId: p.id }
  ),
  bank,
  freeTransfers,
  horizon,
});

/**
 * Copy shown while a plan is being computed.
 *
 * @param freeTransfers - the free transfers the plan was requested with.
 *
 * @returns the loading label.
 */
export const getPlanLoadingMessage = (freeTransfers: number): string =>
  freeTransfers === 0
    ? 'Checking your squad with no free transfers…'
    : `Planning up to ${freeTransfers} transfer${
        freeTransfers === 1 ? '' : 's'
      }…`;

/**
 * Copy shown when a plan contains no moves.
 *
 * With 0 free transfers the planner cannot make any move, so saying "no
 * transfer improves your squad" would be untrue — nothing was compared.
 *
 * @param freeTransfers - the free transfers the plan was computed with.
 *
 * @returns the no-move message.
 */
export const getNoMovePlanMessage = (freeTransfers: number): string =>
  freeTransfers === 0
    ? 'You have no free transfers, so your current squad stays as it is. Paid transfers (points hits) are not considered, so no moves are suggested.'
    : 'No transfer improves your squad on this horizon. Keeping your current squad is the best option.';

/**
 * Footnote under the "Plan transfers" button.
 *
 * @param freeTransfers - the currently selected free transfers.
 *
 * @returns the planner note.
 */
export const getPlannerNote = (freeTransfers: number): string =>
  freeTransfers === 0
    ? 'With 0 free transfers the plan keeps your current squad — paid transfers (points hits) are never suggested.'
    : 'Plans use at most your free transfers, so a points hit is never suggested.';
