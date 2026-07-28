import { GameweekDataEntry } from './fixture';
import { PlayerDict } from './processed';

/**
 * Response shape for `GET /api/players`.
 *
 * The full player set, pre-grouped by team, position and id so the client can
 * index without re-bucketing on every render.
 */
export type GroupedPlayers = PlayerDict & {
  lastUpdated: Date;
};

/**
 * Response shape for `POST /api/data/refresh`.
 */
export type RefreshDataResponse = {
  /** ISO timestamp of when the refresh completed. */
  refreshedAt: string;
};

/**
 * Response shape for `GET /api/gameweeks/current` and `GET /api/gameweeks/:id`.
 */
export type GameweekResponse = GameweekDataEntry;
