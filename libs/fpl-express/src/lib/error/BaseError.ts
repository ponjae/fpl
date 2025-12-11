export default abstract class BaseError extends Error {
  /**
   * Constructor.
   *
   * @param name the name of the error.
   * @param message the error message.
   * @param cause the cause of the error.
   */
  public constructor(name: string, message: string, cause?: unknown) {
    super(message, { cause });
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = name;
  }

  /**
   * Get the message of the error.
   *
   * @returns the message.
   */
  public getMessage(): string {
    return this.message || 'Unknown reason';
  }

  /**
   * Get the cause of the error.
   *
   * @returns the cause of the error.
   */
  public getCause(): unknown {
    return this.cause;
  }
}
