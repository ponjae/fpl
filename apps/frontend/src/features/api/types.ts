import { PlayerSortKey, SortDirection, SquadHorizon } from '@fpl/contracts/fpl';

/**
 * Shared argument shapes for api endpoints.
 *
 * Keeping these in one place avoids each feature re-declaring the same
 * `{ id }` / `{ teamId }` shapes and keeps query keys consistent.
 */
export type IdArg = { id: number };
export type TeamIdArg = { teamId: number };
export type PositionArg = { position: string };
export type GameweekArg = { gw: number };

export type UpcomingFixturesArg = TeamIdArg & { count: number };

export type TopPlayersArg = {
  sortKey: PlayerSortKey;
  limit?: number;
  direction?: SortDirection;
};

export type OptimalSquadArg = {
  horizon?: SquadHorizon;
  budget?: number;
};

/**
 * The error body returned by every backend endpoint on failure.
 *
 * Mirrors `ApiErrorBody` from `@fpl/contracts/self-service`, narrowed to what
 * the UI actually needs.
 */
export type ApiErrorBody = {
  status: number;
  type?: string;
  message?: string;
};
