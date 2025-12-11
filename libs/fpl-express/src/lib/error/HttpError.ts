import BaseError from './BaseError';

/**
 * A http error that defines an error with a status code.
 */
export default abstract class HttpError extends BaseError {
  private readonly status: number;

  /**
   * Constructor.
   *
   * @param name the name of the error.
   * @param message the message to send.
   * @param cause the cause of the error.
   * @param status the optional http status (defaults to 500).
   */
  public constructor(
    name: string,
    message: string,
    cause?: unknown,
    status = 500
  ) {
    super(name, message, cause);
    this.status = status;
  }

  /**
   * Get the status of the error.
   *
   * @returns the status of the error.
   */
  public getStatus(): number {
    return this.status;
  }
}
