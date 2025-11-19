import { RequestConfig } from './types';

/**
 * Error thrown when a request is made.
 */
export default class RequestError extends Error {
  private readonly status: number;
  private readonly headers: Headers;
  private readonly body: unknown;
  private readonly config: RequestConfig;

  /**
   * Constructor.
   *
   * @param message - the message.
   * @param status - the response status.
   * @param headers - the response headers.
   * @param body - the response body.
   * @param config - the request config.
   */
  public constructor(
    message: string,
    status: number,
    headers: Headers,
    body: unknown,
    config: RequestConfig
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'RequestError';
    this.config = config;
    this.body = body;
    this.status = status;
    this.headers = new Headers(headers);
  }

  /**
   * Get the message.
   *
   * @returns the message of the error.
   */
  public getMessage(): string {
    return this.message;
  }

  /**
   * Get the status of the request error.
   *
   * @returns the status.
   */
  public getStatus(): number {
    return this.status || 500;
  }

  /**
   * Get the headers of the request error.
   *
   * @returns the headers.
   */
  public getHeaders(): Headers {
    return this.headers;
  }

  /**
   * Get the body of the request error.
   *
   * @returns the body.
   */
  public getBody(): unknown {
    return this.body;
  }

  /**
   * Get the request config.
   *
   * @returns the request config.
   */
  public getConfig(): RequestConfig {
    return this.config;
  }
}
