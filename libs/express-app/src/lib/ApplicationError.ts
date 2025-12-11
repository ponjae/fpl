import { HttpError } from '@fpl/fpl-express';

export type ErrorOptions<T extends string = string> = {
  errorType?: T;
  cause?: unknown;
};

export class ApplicationError extends HttpError {
  /** The error type */
  private readonly errorType: string;

  /**
   * Constructor.
   *
   * @param message - the message of the error.
   * @param status - the status of the error.
   * @param options - the error options.
   */
  public constructor(message: string, status: number, options?: ErrorOptions) {
    super('ApplicationError', message, options?.cause, status);
    this.errorType = options?.errorType ?? 'app';
  }

  /**
   * Get the error type of the error.
   *
   * @returns the error type.
   */
  public getErrorType(): string {
    return this.errorType;
  }
}
