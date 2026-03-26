import { Request } from 'express';
import ValidationError from '../error/ValidationError';

export type Cookies = Record<string, string>;

/**
 * Simple wrapper class of a express request.
 */
export default class Req<Body = any> {
  /** The wrapped request object. */
  private req?: Request;

  /**
   * Init the request object.
   *
   * @param req - the request object.
   */
  public _init(req: Request): void {
    this.req = req;
  }

  /**
   * Get the request object.
   *
   * @returns the request object.
   */
  public getRequestObject(): Request {
    return this.req!;
  }

  /**
   * Get cookie value.
   *
   * @param name the cookie name.
   *
   * @returns the cookie value.
   */
  public getCookieValue(name: string): string | undefined {
    return this.getCookies()[name];
  }

  /**
   * Get all cookies.
   *
   * @returns Get the cookies.
   */
  public getCookies(): Cookies {
    return this.req!.cookies || {};
  }

  /**
   * Get all signed cookies.
   *
   * @returns the signed cookies.
   */
  public getSignedCookies(): Cookies {
    return this.req!.signedCookies || {};
  }

  /**
   * Get the body of the request.
   *
   * @param validateFn - optional validation function.
   *
   * @returns the body of the request.
   *
   * @throws error when validation function exists and it fails.
   */
  public getBody(): Body;
  public getBody(validateFn: (body: unknown) => body is Body): Body;
  getBody(validateFn?: (body: unknown) => body is Body): Body {
    const body = this.req!.body;
    if (!validateFn || validateFn(body)) {
      return body;
    }
    throw new ValidationError('Invalid body');
  }

  /**
   * Get a route param.
   *
   * @param name - the name of the param.
   * @param validateFn - optional validation function of the value.
   *
   * @returns the value of the param.
   *
   * @throws error when validation function exists and fails.
   */
  public getParamValue<T extends string>(name: string): T;
  public getParamValue<T extends string>(
    name: string,
    validateFn: (value: unknown) => value is T
  ): T;
  getParamValue<T extends string>(
    name: string,
    validateFn?: (value: unknown) => value is T
  ): T {
    const value = this.req!.params[name];

    if (!validateFn || validateFn(value)) {
      return value as T;
    }
    throw new ValidationError('Invalid param');
  }

  /**
   * Get a query param value.
   *
   * @param name - the name of the query param.
   *
   * @returns the value of the query param.
   */
  public getQueryParamValue(name: string): string | undefined {
    return this.req!.query[name] as string | undefined;
  }

  /**
   * Get a the header value.
   *
   * @param name - the name of the header.
   * @returns the header value(s).
   */
  public getHeaderValue(name: string): string | undefined {
    return this.req!.header(name);
  }

  /**
   * Get the request path.
   *
   * @returns the path.
   */
  public getPath(): string {
    return this.req!.path;
  }

  /**
   * Get the base url.
   *
   * @returns the base url.
   */
  public getBaseUrl(): string {
    return this.req!.baseUrl;
  }

  /**
   * Get the request method.
   *
   * @returns the request method.
   */
  public getMethod(): string {
    return this.req!.method;
  }
}
