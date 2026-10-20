import { PlayerSortKey, ProcessedPlayer } from '@fpl/contracts/fpl';

/**
 * Season-to-date counting stats shown on the /stats page.
 *
 * Each one is a `PlayerSortKey`, so the backend's top-players endpoint can rank
 * by it directly, and each one lives on `playerStats`.
 */
export type StatLeaderboardKey = Extract<
  PlayerSortKey,
  'goals_scored' | 'assists' | 'total_points'
>;

export type StatLeaderboardConfig = {
  key: StatLeaderboardKey;
  /** Section heading. */
  title: string;
  /** One-line explanation under the heading. */
  description: string;
  /** Column header for the count. */
  metricLabel: string;
  /** Singular / plural unit used in sentences, e.g. "3 goals". */
  unit: { one: string; many: string };
  /** Shown when nobody has a positive count yet. */
  emptyMessage: string;
  /** Visual accent, maps to a modifier class. */
  accent: 'goals' | 'assists' | 'points';
};

/** How many rows each leaderboard shows. */
export const LEADERBOARD_SIZE = 10;

/**
 * How many players to request per leaderboard.
 *
 * More than `LEADERBOARD_SIZE` so a tie at the cut-off can be detected and
 * reported honestly ("+4 more on 3 goals") instead of silently picking an
 * arbitrary subset of tied players.
 */
export const LEADERBOARD_FETCH_LIMIT = 40;

export const STAT_LEADERBOARDS: readonly StatLeaderboardConfig[] = [
  {
    key: 'goals_scored',
    title: 'Top scorers',
    description: 'Most goals scored this season.',
    metricLabel: 'Goals',
    unit: { one: 'goal', many: 'goals' },
    emptyMessage: 'No goals have been scored yet this season.',
    accent: 'goals',
  },
  {
    key: 'assists',
    title: 'Most FPL assists',
    description:
      'Assists as counted by FPL, which also credits things like winning a penalty.',
    metricLabel: 'FPL assists',
    unit: { one: 'FPL assist', many: 'FPL assists' },
    emptyMessage: 'No FPL assists have been recorded yet this season.',
    accent: 'assists',
  },
  {
    key: 'total_points',
    title: 'Most FPL points',
    description: 'Total FPL points earned this season.',
    metricLabel: 'Points',
    unit: { one: 'point', many: 'points' },
    emptyMessage: 'No FPL points have been scored yet this season.',
    accent: 'points',
  },
] as const;

export type LeaderboardEntry = {
  player: ProcessedPlayer;
  value: number;
  /** Standard competition rank: tied players share a rank, the next rank skips (1, 2, 2, 4). */
  rank: number;
  /** True when at least one other listed-or-fetched player has the same value. */
  isTied: boolean;
};

export type Leaderboard = {
  entries: LeaderboardEntry[];
  /**
   * Players with the same value as the last shown row who did not fit in the
   * table. Zero when the cut-off is clean.
   */
  hiddenTiedCount: number;
  /**
   * True when every fetched player beyond the cut-off was still tied, so there
   * may be even more tied players the API did not return. Render "at least".
   */
  hiddenTiedIsLowerBound: boolean;
};

/**
 * Read a leaderboard stat from a player.
 *
 * @param player - the player.
 * @param key - the stat to read.
 *
 * @returns the stat value.
 */
export const getStatValue = (
  player: ProcessedPlayer,
  key: StatLeaderboardKey
): number => player.playerStats[key];

/**
 * Turn the backend's ranked players into a display-ready leaderboard.
 *
 * - Players with a zero (or negative / non-numeric) count are dropped: a
 *   "top scorer" with no goals is noise, and early in the season it would fill
 *   the table with arbitrary names.
 * - Order is re-applied locally (value desc, then name, then id) so ties read
 *   alphabetically instead of in arbitrary backend order.
 * - Ranks follow standard competition ranking (1, 2, 2, 4).
 *
 * @param players - players returned by the top-players endpoint.
 * @param key - the stat being ranked.
 * @param size - how many rows to show.
 * @param fetchLimit - the `limit` the players were requested with.
 *
 * @returns the leaderboard rows plus tie information at the cut-off.
 */
export const buildLeaderboard = (
  players: ProcessedPlayer[],
  key: StatLeaderboardKey,
  size = LEADERBOARD_SIZE,
  fetchLimit = LEADERBOARD_FETCH_LIMIT
): Leaderboard => {
  const scored = players
    .map((player) => ({ player, value: getStatValue(player, key) }))
    .filter(
      (row) =>
        typeof row.value === 'number' &&
        Number.isFinite(row.value) &&
        row.value > 0
    )
    .sort(
      (a, b) =>
        b.value - a.value ||
        a.player.generalInfo.web_name.localeCompare(
          b.player.generalInfo.web_name
        ) ||
        a.player.generalInfo.id - b.player.generalInfo.id
    );

  const ranked: LeaderboardEntry[] = [];
  scored.forEach((row, index) => {
    const prev = ranked[index - 1];
    const rank = prev && prev.value === row.value ? prev.rank : index + 1;
    const isTied =
      (prev !== undefined && prev.value === row.value) ||
      scored[index + 1]?.value === row.value;
    ranked.push({ ...row, rank, isTied });
  });

  const entries = ranked.slice(0, size);
  const cutoff = entries[entries.length - 1];

  if (!cutoff || ranked.length <= size) {
    return { entries, hiddenTiedCount: 0, hiddenTiedIsLowerBound: false };
  }

  const hidden = ranked.slice(size).filter((e) => e.value === cutoff.value);
  const lastFetched = ranked[ranked.length - 1];
  const hiddenTiedIsLowerBound =
    hidden.length > 0 &&
    players.length >= fetchLimit &&
    lastFetched.value === cutoff.value;

  return {
    entries,
    hiddenTiedCount: hidden.length,
    hiddenTiedIsLowerBound,
  };
};

/**
 * Human-readable rank label. Tied ranks are prefixed with "=" as in football tables.
 *
 * @param entry - the leaderboard row.
 *
 * @returns e.g. "1" or "=4".
 */
export const formatRank = (entry: Pick<LeaderboardEntry, 'rank' | 'isTied'>) =>
  entry.isTied ? `=${entry.rank}` : String(entry.rank);

/**
 * Format an ordinal for screen-reader rank labels.
 *
 * @param n - a positive integer.
 *
 * @returns e.g. "1st", "2nd", "11th".
 */
export const toOrdinal = (n: number): string => {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
};

/**
 * Pluralise a stat unit.
 *
 * @param value - the count.
 * @param unit - singular and plural forms.
 *
 * @returns e.g. "1 goal" or "3 goals".
 */
export const formatCount = (
  value: number,
  unit: { one: string; many: string }
): string => `${value} ${value === 1 ? unit.one : unit.many}`;
