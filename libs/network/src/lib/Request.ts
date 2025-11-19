import { defaultTo, wait } from '@fpl/utils';
import IRequest from './IRequest';
import RequestError from './RequestError';
import Response from './Response';
import {
  AuthenticationType,
  Dictionary,
  Method,
  TimeoutTime,
  PerformanceCallback,
  RequestConfig,
  RetryDelayFunction,
} from './types';
import { base64Encode } from './utils';

/**
 * The network request implementation. It defines generics for the response body.
 */
export default class Request<ResBody> implements IRequest<ResBody> {
  /**
   * The method of the request.
   */
  private readonly method: Method;

  /**
   * The url of the request.
   */
  private readonly url: URL;

  /**
   * The headers of the request.
   */
  private readonly headers = new Headers();

  /**
   * The timeout time.
   */
  private timeoutTime: TimeoutTime;

  /**
   * The number of retries.
   */
  private retries: number;

  /**
   * Optional retry statuses
   */
  private retryStatuses: number[];

  /**
   * Flag for if retries of timeout should be done.
   */
  private retryTimeout: boolean;

  /**
   * The retry delay function.
   */
  private retryDelayFn: RetryDelayFunction;

  /**
   * The body of the request.
   */
  private body?: unknown;

  /**
   * The if it should follow redirects.
   */
  private followRedirects: boolean;

  /**
   * The redaction option.
   */
  private withRedaction: boolean;

  /**
   * The performance callback.
   */
  private performanceCallback?: PerformanceCallback;

  /**
   * The default retries.
   */
  private static readonly DEFAULT_RETRIES = 3;

  /**
   * The max number of retries.
   */
  private static readonly MAX_RETRIES = 10;

  /**
   * Constructor
   *
   * @param method - the method of the request
   * @param url - the url of the request
   */
  public constructor(method: Method, url: string);
  public constructor(method: Method, url: URL);
  public constructor(method: Method, url: string | URL) {
    this.method = method;
    this.url = new URL(url);
    this.timeoutTime = TimeoutTime.Medium;
    this.retries = Request.DEFAULT_RETRIES;
    this.retryStatuses = [];
    this.retryTimeout = false;
    this.retryDelayFn = (attempt) => Math.min(Math.pow(2, attempt) * 100, TimeoutTime.Long);
    this.followRedirects = false;
    this.withRedaction = true;
  }

  /**
   * @override
   */
  public withoutRedaction(): IRequest<ResBody> {
    this.withRedaction = false;
    return this;
  }

  /**
   * @override
   */
  public withTimeout(timeoutTime: TimeoutTime): IRequest<ResBody> {
    this.timeoutTime = timeoutTime;
    return this;
  }

  /**
   * @override
   */
  public withRetries(retries: number, ...status: number[]): IRequest<ResBody> {
    this.retries = Math.abs(Math.max(retries, 0));
    this.retryStatuses = status;
    return this;
  }

  /**
   * @override
   */
  public withRetryTimeout(retry: boolean): IRequest<ResBody> {
    this.retryTimeout = retry;
    return this;
  }

  /**
   * @override
   */
  public withRetryDelayFunction(fn: RetryDelayFunction): IRequest<ResBody> {
    this.retryDelayFn = fn;
    return this;
  }

  /**
   * @override
   */
  public withBasicAuthentication(username: string, password: string): IRequest<ResBody> {
    const token = base64Encode(`${username}:${password}`);
    return this.withAuthorization('Basic', token);
  }

  /**
   * @override
   */
  public withAuthorization(type: AuthenticationType, authorization: string): IRequest<ResBody> {
    return this.withHeader('Authorization', `${type} ${authorization}`);
  }

  /**
   * @override
   */
  public withHeader(name: string, value: string): IRequest<ResBody> {
    this.headers.append(name, value);
    return this;
  }

  /**
   * @override
   */
  public withQueryParam(key: string, value?: string | number | boolean): IRequest<ResBody> {
    this.url.searchParams.append(key, defaultTo(value?.toString(), ''));
    return this;
  }

  /**
   * @override
   */
  public withQueryParams(params: Dictionary): IRequest<ResBody> {
    Object.entries(params).forEach((entry) => this.url.searchParams.append(...entry));
    return this;
  }

  /**
   * @override
   */
  public withFollowRedirects(redirects: boolean): IRequest<ResBody> {
    this.followRedirects = redirects;
    return this;
  }

  /**
   * @override
   */
  public withPerformanceCallback(cb: PerformanceCallback | undefined): IRequest<ResBody> {
    this.performanceCallback = cb;
    return this;
  }

  /**
   * @override
   */
  public withUrlEncodedForm(data: Dictionary): IRequest<ResBody> {
    const body = new URLSearchParams();

    for (const [key, value] of Object.entries(data)) {
      body.append(key, value);
    }
    return this.withBody(body, 'application/x-www-form-urlencoded');
  }

  /**
   * @override
   */
  public withBody<T>(body: T, contentType?: string): IRequest<ResBody> {
    this.body = body;
    return contentType ? this.withHeader('Content-Type', contentType) : this;
  }

  /**
   * @override
   */
  public withJsonBody<T extends object>(body: T): IRequest<ResBody> {
    return this.withBody(body, 'application/json');
  }

  /**
   * @override
   */
  public withIfNoneMatch(etag: string): IRequest<ResBody> {
    return this.withHeader('If-None-Match', etag);
  }

  /**
   * @override
   */
  public async send(debug = false): Promise<Response<ResBody>> {
    let attempt = 0;
    for (;;) {
      try {
        const request = this.newRequest();

        if (debug) {
          console.debug(
            'Request config:',
            JSON.stringify(
              {
                ...request,
                url: this.url.toString(),
                timeout: this.timeoutTime,
                retries: this.retries,
                attempt,
              },
              null,
              2
            )
          );
        }

        return await this.execute({ url: this.url, ...request }, attempt);
      } catch (error) {
        if (attempt + 1 < Math.min(this.retries, Request.MAX_RETRIES) && this.shouldRetry(error)) {
          await wait(this.retryDelayFn(attempt), undefined);
        } else {
          throw error;
        }
      } finally {
        attempt++;
      }
    }
  }

  /**
   * Execute the request.
   *
   * @param config - the request config.
   * @param attempt - the attempt number.
   *
   * @throws error when request fails.
   */
  private async execute(config: RequestConfig, attempt: number): Promise<Response<ResBody>> {
    const timestamp = Date.now();

    let httpStatus = 500;
    try {
      const { url, ...request } = config;
      const response = await fetch(url, request);

      const body = await Request.getResponseBody(response);

      const { ok, status, statusText, headers } = response;
      httpStatus = status;
      if (ok) {
        return new Response(status, body as ResBody, headers, config);
      }
      throw this.newRequestError(statusText, status, headers, body, config);
    } catch (error) {
      if (Request.isTimeoutError(error)) {
        httpStatus = 408;

        throw this.newRequestError(
          `Timeout, response took longer than ${this.timeoutTime}ms`,
          httpStatus,
          new Headers(),
          undefined,
          config
        );
      }
      throw error;
    } finally {
      this.performanceCallback?.(Date.now() - timestamp, httpStatus, attempt + 1);
    }
  }

  /**
   * Check if the request should be retried.
   *
   * @param error - the error received.
   *
   * @returns true if the request should be retried, false otherwise.
   */
  private shouldRetry(error: unknown): boolean {
    let retry = false;

    if (error instanceof RequestError) {
      const status = error.getStatus();
      retry =
        status === 429 ||
        (status >= 500 && status <= 599) ||
        (status === 408 && this.retryTimeout) ||
        this.retryStatuses.includes(status);
    }
    return retry;
  }

  /**
   * Create a new request body.
   */
  private newRequest(): RequestInit {
    let body: RequestInit['body'] | undefined;

    if (
      this.body instanceof FormData ||
      this.body instanceof URLSearchParams ||
      typeof this.body === 'string' ||
      this.body instanceof Blob
    ) {
      body = this.body;
    } else if (this.body) {
      body = JSON.stringify(this.body);
    }

    return {
      method: this.method.toUpperCase(),
      headers: this.headers,
      redirect: this.followRedirects ? 'follow' : 'manual',
      signal: AbortSignal.timeout(this.timeoutTime),
      body,
    };
  }

  /**
   * Get the response body.
   *
   * @param response - the received response.
   *
   * @returns the response body.
   */
  private static async getResponseBody(response: globalThis.Response): Promise<unknown> {
    const { headers } = response;
    const contentType = headers.get('Content-Type');

    const body = await response.text();
    return contentType?.includes('json') ? JSON.parse(body) : body;
  }

  /**
   * Generate a new request error.
   *
   * @param message - the error message.
   * @param status - the response status.
   * @param headers - the response headers.
   * @param body - the error response body.
   * @param config - the request config.
   *
   * @returns the request error.
   */
  private newRequestError(
    message: string,
    status: number,
    headers: Headers,
    body: unknown,
    config: RequestConfig
  ): RequestError {
    if (this.withRedaction) {
      if (config.headers instanceof Headers && config.headers.has('Authorization')) {
        config.headers.set('Authorization', '[redacted]');
      }
      if (config.body) {
        config.body = '[redacted]';
      }
    }
    return new RequestError(message, status, headers, body, config);
  }

  /**
   * Check if an error is an abort error.
   *
   * @param error - the error.
   *
   * @returns true if abort error, otherwise false.
   */
  private static isTimeoutError(error: unknown): boolean {
    return (
      error instanceof DOMException &&
      (error.name === 'TimeoutError' || error.name === 'AbortError')
    );
  }
}
