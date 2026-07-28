import { ProcessedPlayer, PlayerSortKey } from './player';

/**
 * Which player-value horizon to optimise against.
 *
 * Mirrors the three values produced by the evaluator:
 *   - `value`           → next gameweek
 *   - `value5`          → next five gameweeks
 *   - `value_remaining` → rest of season
 */
export const SquadHorizons = ['value', 'value5', 'value_remaining'] as const;

/**
 * The horizon to optimise a squad against.
 */
export type SquadHorizon = (typeof SquadHorizons)[number];

/**
 * Runtime check that a value is a valid SquadHorizon.
 *
 * @param value - the candidate value, typically from a query string or body.
 *
 * @returns true when the value is a supported horizon.
 */
export const isSquadHorizon = (value: unknown): value is SquadHorizon =>
  typeof value === 'string' &&
  (SquadHorizons as readonly string[]).includes(value);

/**
 * Squad composition rules, expressed in FPL terms.
 *
 * `squad` is the total number of players of that position in the 15-man squad.
 * `minStart`/`maxStart` bound how many may appear in the starting XI.
 */
export type PositionRule = {
  squad: number;
  minStart: number;
  maxStart: number;
};

/**
 * The official FPL squad structure, keyed by `element_type`.
 *
 * 1 = Goalkeeper, 2 = Defender, 3 = Midfielder, 4 = Forward.
 */
export const SQUAD_RULES: Record<number, PositionRule> = {
  1: { squad: 2, minStart: 1, maxStart: 1 },
  2: { squad: 5, minStart: 3, maxStart: 5 },
  3: { squad: 5, minStart: 3, maxStart: 5 },
  4: { squad: 3, minStart: 1, maxStart: 3 },
};

/**
 * Total players in a full FPL squad.
 */
export const SQUAD_SIZE = 15;

/**
 * Number of players in the starting XI.
 */
export const STARTING_SIZE = 11;

/**
 * Maximum number of players allowed from any single club.
 */
export const MAX_PER_CLUB = 3;

/**
 * Default budget in millions.
 */
export const DEFAULT_BUDGET = 100.0;

/**
 * Options accepted when optimising a squad.
 */
export type OptimizeSquadOptions = {
  /** Horizon to optimise against. Defaults to 'value5'. */
  horizon?: SquadHorizon;
  /** Budget in millions. Defaults to 100.0. */
  budget?: number;
  /**
   * Weight applied to bench outfield players. Defaults to 0.2.
   * Bench players contribute little, but a non-zero weight avoids the
   * optimiser filling the bench with worthless 4.0m players when budget allows
   * better cover.
   */
  benchWeight?: number;
  /**
   * Weight applied to the bench goalkeeper. Defaults to 0.01.
   * The backup keeper almost never plays, so spending budget on them is close
   * to pure waste — the old model over-valued this slot by treating it like an
   * outfield sub.
   */
  benchGkWeight?: number;
  /** Player IDs that must appear in the squad. */
  include?: number[];
  /** Player IDs that must not appear in the squad. */
  exclude?: number[];
};

/**
 * A single selected player within an optimised squad.
 */
export type SquadPick = {
  player: ProcessedPlayer;
  /** True when the player is in the starting XI. */
  starting: boolean;
  /** True when the player is the captain (always a starter). */
  captain: boolean;
  /** The value used for this player on the chosen horizon. */
  value: number;
};

/**
 * The result of a squad optimisation.
 */
export type OptimalSquad = {
  picks: SquadPick[];
  /** Formation of the starting XI, e.g. '3-5-2' (DEF-MID-FWD). */
  formation: string;
  /** Total cost of all 15 players, in millions. */
  totalCost: number;
  /** Budget the squad was optimised against. */
  budget: number;
  /** Objective score: starters + captain bonus + weighted bench. */
  totalValue: number;
  /** The horizon the squad was optimised against. */
  horizon: SquadHorizon;
  /**
   * True when the solver proved optimality. False when the result came from
   * the heuristic fallback and may be slightly sub-optimal.
   */
  optimal: boolean;
  /** Number of candidates considered after filtering and dominance pruning. */
  candidatesConsidered: number;
};

/**
 * A suggested replacement for a player being transferred out.
 */
export type TransferSuggestion = {
  playerOut: ProcessedPlayer;
  playerIn: ProcessedPlayer;
  /** Value gained on the chosen horizon (playerIn - playerOut). */
  valueGain: number;
  /** Cost difference in millions (positive means the transfer costs money). */
  costDelta: number;
};

/**
 * Options for requesting transfer suggestions.
 */
export type TransferSuggestionOptions = {
  /** The player to transfer out. */
  playerOutId: number;
  /** Money in the bank, in millions. Defaults to 0. */
  budget?: number;
  /** Horizon to rank replacements against. Defaults to 'value5'. */
  horizon?: SquadHorizon;
  /** Maximum number of suggestions. Defaults to 5. */
  limit?: number;
};

/**
 * A player in the user's squad who is underperforming relative to their price.
 */
export type UnderPerformer = {
  player: ProcessedPlayer;
  /** The value on the chosen horizon. Null when they have no fixtures. */
  value: number | null;
  /** Rank among players of the same position (1 = best). */
  positionRank: number;
  /** Total number of players in that position used for the ranking. */
  positionCount: number;
};

/**
 * Maps a SquadHorizon to the equivalent PlayerSortKey.
 *
 * They share the same names, but the alias documents the relationship and
 * keeps ranking and optimisation vocabularies explicitly linked.
 */
export const horizonToSortKey = (horizon: SquadHorizon): PlayerSortKey =>
  horizon;
