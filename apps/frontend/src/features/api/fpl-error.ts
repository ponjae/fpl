/**
 * Error thrown when a request fails in a way the UI cannot recover from.
 *
 * Intended to be caught by a React error boundary so the app can show a
 * dedicated error screen rather than a half-rendered page.
 */
export class FplError extends Error {
  public constructor(message = 'Something went wrong') {
    super(message);
    this.name = 'FplError';
  }
}
