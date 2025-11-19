import { RequestConfig } from './types';

/**
 * Simple wrapper for an axios response.
 */
export default class Response<T> {
  private readonly status: number;
  private readonly data: T;
  private readonly headers: Headers;
  private readonly config: RequestConfig;

  /**
   * Constructor.
   *
   * @param status - HTTP status.
   * @param data - parsed body.
   * @param headers - response headers.
   * @param config - original request config.
   */
  public constructor(status: number, data: T, headers: Headers, config: RequestConfig) {
    this.status = status;
    this.data = data;
    this.headers = headers;
    this.config = config;
  }

  /**
   * Get the status response.
   *
   * @returns the status
   */
  public getStatus(): number {
    return this.status;
  }

  /**
   * Get the request config.
   *
   * @returns the request config.
   */
  public getConfig(): RequestConfig {
    return this.config;
  }

  /**
   * Get the response data.
   *
   * @returns the response data.
   */
  public getData(): T {
    return this.data;
  }

  /**
   * Get the response etag.
   *
   * @returns the ETag or undefined.
   */
  public getEtag(): string | undefined {
    return this.getHeader('etag');
  }

  /**
   * Get the headers from the response.
   *
   * @returns the headers.
   */
  public getHeaders(): Headers {
    return this.headers;
  }

  /**
   * Get a header.
   *
   * @param name - the name of the header.
   *
   * @returns the header value.
   */
  public getHeader(name: string): string | undefined {
    return this.headers.get(name) ?? undefined;
  }
}
