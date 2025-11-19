import Response from './Response';
import {
  AuthenticationType,
  Dictionary,
  PerformanceCallback,
  RetryDelayFunction,
  TimeoutTime,
} from './types';

/**
 * Request wrapper.
 *
 * @param ResBody - the response type.
 */
export default interface IRequest<ResBody> {
  /**
   * Deactivates redaction.
   *
   * @returns the request instance.
   */
  withoutRedaction(): IRequest<ResBody>;

  /**
   * Add a timeout time to the request.
   *
   * @param timeout - the timeout time.
   *
   * @returns the request instance.
   */
  withTimeout(timeout: TimeoutTime): IRequest<ResBody>;

  /**
   * Add the number of retries. An retry will occur for an error with status greater than 499 or a timeout occurs.
   * An optional list is added for any other status.
   *
   * @param retries - the number of retries or less than 1 if no retries should be done.
   * @param status - the optional status that a retry should occur on.
   *
   * @returns the request instance.
   */
  withRetries(retries: number, ...status: number[]): IRequest<ResBody>;

  /**
   * Add retry of timeouts. Default is false.
   *
   * @param retry - true if retry of timeouts should be done, otherwise false.
   *
   * @returns the request instance.
   */
  withRetryTimeout(retry: boolean): IRequest<ResBody>;

  /**
   * Add a retry delay function. Default is a exponential delay.
   *
   * @param fn - the retry delay function.
   *
   * @returns the request instance.
   */
  withRetryDelayFunction(fn: RetryDelayFunction): IRequest<ResBody>;

  /**
   * Add basic authentication to the request.
   *
   * @param username - the username.
   * @param password - the password.
   *
   * @returns the request instance.
   */
  withBasicAuthentication(
    username: string,
    password: string
  ): IRequest<ResBody>;

  /**
   * Add authorization header.
   *
   * @param type - the authentication type.
   * @param authorization - the authorization.
   *
   * @returns the request instance.
   */
  withAuthorization(
    type: AuthenticationType,
    authorization: string
  ): IRequest<ResBody>;

  /**
   * Add url encoded form data.
   *
   * @param data - the url encoded form data.
   *
   * @returns the request instance.
   */
  withUrlEncodedForm(data: Dictionary): IRequest<ResBody>;

  /**
   * Add a body to the request.
   *
   * @param body - the body.
   *
   * @returns the request instance.
   */
  withBody<T>(body: T, contentType?: string): IRequest<ResBody>;

  /**
   * Add a json body to the request.
   *
   * @param body - the json body.
   *
   * @returns the request instance.
   */
  withJsonBody<T extends object>(body: T): IRequest<ResBody>;

  /**
   * Add a query param to the url.
   *
   * @param key - the query parameter.
   * @param value - the query parameter value.
   *
   * @returns the request instance.
   */
  withQueryParam(
    key: string,
    value?: string | number | boolean
  ): IRequest<ResBody>;

  /**
   * Add query params to the url.
   *
   * @param params - the query parameters.
   *
   * @returns the request instance.
   */
  withQueryParams(params: Dictionary): IRequest<ResBody>;

  /**
   * Adds a header to the request.
   *
   * @param name - the header name.
   * @param value - the header value.
   *
   * @returns the request instance.
   */
  withHeader(name: string, value: string): IRequest<ResBody>;

  /**
   * Adds If-None-Match header
   *
   * @param etag - the etag value.
   *
   * @returns the request instance.
   */
  withIfNoneMatch(etag: string): IRequest<ResBody>;

  /**
   * If the redirects should be followed.
   *
   * @param follow- if the redirects should be followed.
   *
   * @returns the request instance.
   */
  withFollowRedirects(follow: boolean): IRequest<ResBody>;

  /**
   * Add a performance callback.
   *
   * Called every time a request is done (successful or not). Includes the
   * duration and status code (if available).
   *
   * @param cb - the performance callback.
   *
   * @returns the request instance.
   */
  withPerformanceCallback(
    cb: PerformanceCallback | undefined
  ): IRequest<ResBody>;

  /**
   * Send the request.
   *
   * @param debug - flag for if debug prints is enabled.
   *
   * @returns the response.
   *
   * @throws RequestError
   * @throws ValidationError
   */
  send(debug?: boolean): Promise<Response<ResBody>>;
}
