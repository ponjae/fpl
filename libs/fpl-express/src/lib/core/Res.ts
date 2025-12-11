import { CookieOptions, Response } from 'express';

/**
 * Simple wrapper class for an express response.
 */
export default class Res<T = any> {
  /** The wrapped response object. */
  private res?: Response<T>;

  /**
   * Init the response object.
   *
   * @param res the response object.
   */
  public _init(res: Response<T>): void {
    this.res = res;
  }

  /**
   * Get the response object.
   *
   * @returns the response object.
   */
  public getResponseObject(): Response<T> {
    return this.res!;
  }

  /**
   * Set a cookie value.
   *
   * @param name the name of the cookie.
   * @param value the value of the cookie.
   * @param options the cookie options.
   */
  public setCookie(name: string, value: any, options: CookieOptions): void {
    this.res!.cookie(name, value, options);
  }

  /**
   * Clear a cookie.
   *
   * @param name the name of the cookie.
   */
  public clearCookie(name: string): void {
    this.res!.clearCookie(name);
  }

  /**
   * Set a header.
   *
   * @param name the name of the header.
   * @param value the value of the header.
   */
  public setHeader(name: string, value: any): void {
    this.res!.setHeader(name, value);
  }

  /**
   * Redirect to a path.
   *
   * @param path the path to redirect to.
   * @param code the status code.
   */
  public redirect(path = '/'): void {
    this.res!.redirect(path);
  }

  /**
   * Send the response data.
   *
   * @param data the data to send.
   * @param status the optional status.
   */
  public send(data: T, status = 200): void {
    this.res!.status(status).json(data);
  }
}
