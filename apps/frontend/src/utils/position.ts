/**
 * Utilities for resolving FPL `element_type` ids to human-readable labels.
 *
 * FPL element type mapping (confirmed via `SQUAD_RULES` in
 * `libs/contracts/fpl/src/lib/types/squad.ts`):
 *   1 = Goalkeeper
 *   2 = Defender
 *   3 = Midfielder
 *   4 = Forward
 */

/**
 * Full position label for a given `element_type`.
 *
 * @param elementType - FPL element type id (1–4).
 * @returns human-readable position name, or `"Unknown"` for unrecognised ids.
 */
export const getPositionLabel = (elementType: number): string => {
  switch (elementType) {
    case 1:
      return 'Goalkeeper';
    case 2:
      return 'Defender';
    case 3:
      return 'Midfielder';
    case 4:
      return 'Forward';
    default:
      return 'Unknown';
  }
};

/**
 * Short position abbreviation for a given `element_type`.
 *
 * @param elementType - FPL element type id (1–4).
 * @returns abbreviated position label.
 */
export const getPositionShortLabel = (
  elementType: number
): 'GK' | 'DEF' | 'MID' | 'FWD' => {
  switch (elementType) {
    case 1:
      return 'GK';
    case 2:
      return 'DEF';
    case 3:
      return 'MID';
    case 4:
    default:
      return 'FWD';
  }
};
