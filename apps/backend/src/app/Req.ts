import { Req as BaseReq } from '@fpl/express-app';

/**
 * FPL-specific request class.
 * Extends the base request with additional functionality as needed.
 */
export class Req<T = unknown> extends BaseReq<T> {
  // Add FPL-specific request methods here as needed
  // For example: getFPLTeamId(), getUserPreferences(), etc.
}
