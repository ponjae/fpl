import HttpError from './HttpError';

export default class ValidationError extends HttpError {
  /**
   * Constructor.
   *
   * @param message the message.
   */
  public constructor(message: string) {
    super('ValidationError', message, undefined, 422);
  }
}
