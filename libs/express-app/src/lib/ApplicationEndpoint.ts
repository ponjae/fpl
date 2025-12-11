import { ErrorBody } from '@fpl/contracts/base';
import { Endpoint, IContext } from '@fpl/fpl-express';
import { ApplicationError } from './ApplicationError';

/**
 * The endpoint error body.
 */
export type EndpointErrorBody<T extends string> = Omit<
  ErrorBody<T>,
  'path' | 'method' | 'type'
> & {
  type: T;
  message: string;
  /*
   * Optional error body that will be logged. This will enable us to intercept and extract.
   * information on the specific error and log it.
   */
  errorBody?: unknown;
};

export abstract class ApplicationEndpoint<
  Context extends IContext,
  ErrorType extends string,
  ResBody,
  Arguments
> extends Endpoint<Context, ApplicationError, ResBody, Arguments> {
  /** The default error message */
  private static readonly DEFAULT_ERROR_MESSAGE = 'Unexpected';

  /** The default status */
  private static readonly DEFAULT_STATUS = 500;

  /**
   * @override
   */
  protected createError(error: unknown): ApplicationError {
    if (error instanceof ApplicationError) {
      return error;
    } else {
      const defaultErrorBody =
        ApplicationEndpoint.getDefaultErrorBody<ErrorType>(error);
      const { message, status, type } = this.onErrorResponse(
        error,
        defaultErrorBody
      );
      return new ApplicationError(message, status, {
        errorType: type,
        cause: error,
      });
    }
  }

  /**
   * Parse an errorBody for the error. Any ApplicationErrors are not handled here.
   *
   * @param error - the error received.
   * @param defaultBody - the default endpoint error body.
   *
   * @returns the error response.
   */
  protected abstract onErrorResponse(
    error: unknown,
    defaultBody: Readonly<EndpointErrorBody<ErrorType>>
  ): EndpointErrorBody<ErrorType>;

  /**
   * Get the default error body.
   *
   * @param error - the error.
   *
   * @returns the endpoint error body.
   */
  private static getDefaultErrorBody<T extends string>(
    error: unknown
  ): Readonly<EndpointErrorBody<T>> {
    let message = ApplicationEndpoint.DEFAULT_ERROR_MESSAGE;
    if (error instanceof Error) {
      message = error.message;
    }

    return {
      status: ApplicationEndpoint.DEFAULT_STATUS,
      message,
      type: 'app' as T,
    };
  }
}
