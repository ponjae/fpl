import { ErrorBody } from '@fpl/contracts/base';
import { ErrorResponse, HttpError } from '@fpl/fpl-express';
import { ApplicationError } from './ApplicationError';
import { Req } from './Req';

export class ErrorHandler {
  private static readonly DEFAULT_ERROR_MESSAGE = 'Unexpected error';

  /**
   * Handle the error.
   *
   * @param error - the error received of unknown type.
   * @param req - the request object.
   *
   * @returns the error response.
   */
  public static getErrorBody<T extends Req>(
    error: unknown,
    req: T
  ): ErrorResponse<ErrorBody> {
    const path = req.getFullPath();
    const method = req.getMethod();

    // Setup default values.
    let type = 'app';
    let status = 500;

    if (error instanceof HttpError) {
      status = error.getStatus();

      if (error instanceof ApplicationError) {
        type = error.getErrorType();
      }
    }

    if (status === 408) {
      /*
       * We do not want to pass the dependency status of 408 (timeout) to client since,
       * the client will do retries. It is not our server that timed out (wouldn't be here then)
       * it is always a dependency.
       *
       * Opted for 424 (failed dependency) in this case.
       */
      status = 424;
    }

    const body: ErrorBody = { status, type, method, path };

    return { status, body };
  }
}
