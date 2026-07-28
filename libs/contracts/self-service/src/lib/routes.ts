import { toPath } from '@fpl/utils';

/**
 * Base API path.
 *
 * All route constants below are *relative* paths. The full public path for
 * every endpoint is `BasePath + <route>`, e.g. `/api/players`.
 * `BasePath` is applied once in `main.ts` via `Application.create({ basepath })`.
 */
export const BasePath = '/api';

/**
 * The available routes in the API.
 *
 * These are relative to `BasePath`. Full paths are `/api<route>`.
 */
export const Routes = {
  // Players — order matters in Express: register the literal '/players/top'
  // before '/players/:id' so the literal segment is not swallowed by :id.
  Players: '/players',
  TopPlayers: '/players/top',
  PlayersByTeam: '/players/team/:teamId',
  PlayersByPosition: '/players/position/:position',
  Player: '/players/:id',

  // Teams
  Teams: '/teams',
  Team: '/teams/:id',

  // Fixtures
  Fixtures: '/fixtures',
  FixturesByGameweek: '/fixtures/gameweek/:gw',
  UpcomingFixturesByTeam: '/fixtures/team/:teamId/upcoming/:count',

  // Gameweeks — order matters in Express: register '/gameweeks/current'
  // before '/gameweeks/:id' so the literal segment is not swallowed by :id.
  Gameweeks: '/gameweeks',
  CurrentGameweek: '/gameweeks/current',
  Gameweek: '/gameweeks/:id',

  // Squad optimisation
  OptimalSquad: '/squad/optimal',
  OptimizeSquad: '/squad/optimize',

  // Transfers
  TransferSuggestions: '/transfers/suggestions',
  UnderPerformers: '/transfers/underperformers',

  // Data
  RefreshData: '/data/refresh',
} as const;
export type Route = (typeof Routes)[keyof typeof Routes];

/**
 * Get the full path parameterized.
 *
 * @param route - the route path.
 * @param params - the route params.
 *
 * @returns the full path.
 */
export const getPath = (
  route: Route,
  params?: Record<string, string>
): string =>
  params ? toPath(BasePath.concat(route), params) : BasePath.concat(route);

// ---------------------------------------------------------------------------
// Error body — shared with frontend so it can type-check API error responses.
// ---------------------------------------------------------------------------

/**
 * The JSON shape returned for every non-2xx response from this API.
 *
 * Matches what `ErrorHandler.getErrorBody` in `@fpl/express-app` produces,
 * augmented with a human-readable `message` field added by the controllers.
 *
 * ```json
 * { "status": 404, "type": "app", "method": "GET", "path": "/api/players/999", "message": "Player with id 999 not found" }
 * ```
 */
export type ApiErrorBody = {
  /** HTTP status code reflected in the body for convenience. */
  status: number;
  /** Error category (e.g. `"app"`, `"validation"`). */
  type: string;
  /** HTTP method of the failing request. */
  method: string;
  /** Full path of the failing request. */
  path: string;
  /** Human-readable description of the error. */
  message: string;
};

// ---------------------------------------------------------------------------
// Position vocabulary — canonical names + accepted aliases.
// ---------------------------------------------------------------------------

/**
 * Canonical position keys used in `ProcessedData.players.byPosition`.
 */
export const CanonicalPositions = [
  'Goalkeepers',
  'Defenders',
  'Midfielders',
  'Forwards',
] as const;

export type CanonicalPosition = (typeof CanonicalPositions)[number];

/**
 * Map from lower-cased alias → canonical position key.
 *
 * Supports singular and plural, case-insensitive (callers should
 * `.toLowerCase()` the incoming param before looking up).
 */
export const PositionAliases: Record<string, CanonicalPosition> = {
  goalkeeper: 'Goalkeepers',
  goalkeepers: 'Goalkeepers',
  gk: 'Goalkeepers',
  defender: 'Defenders',
  defenders: 'Defenders',
  def: 'Defenders',
  midfielder: 'Midfielders',
  midfielders: 'Midfielders',
  mid: 'Midfielders',
  forward: 'Forwards',
  forwards: 'Forwards',
  fwd: 'Forwards',
  att: 'Forwards',
  attacker: 'Forwards',
  attackers: 'Forwards',
};

/**
 * Normalise a raw position param to a canonical key, or return `undefined`
 * if unrecognised.
 *
 * @param raw - the raw position string from the URL param.
 * @returns the canonical position, or `undefined` when unknown.
 */
export const normalizePosition = (raw: string): CanonicalPosition | undefined =>
  PositionAliases[raw.toLowerCase()];
