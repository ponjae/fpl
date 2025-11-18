import { toPath } from '@fpl/utils';

/**
 * Base API path.
 */
export const BasePath = '/api';

/**
 * The available routes in the API.
 */
export const Routes = {
  Teams: '/teams',
  Team: '/teams/:team',
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
