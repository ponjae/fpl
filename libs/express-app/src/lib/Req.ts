import { Req as BaseReq } from '@fpl/fpl-express';
import { isObject } from '@fpl/utils';

export class Req<T = unknown> extends BaseReq<T> {
  /**
   * Get the full path of the request.
   * The full path is the base path and the route path.
   *
   * @returns the full path.
   */
  public getFullPath(): string {
    const req = this.getRequestObject();
    return req.baseUrl + req.path;
  }

  /**
   * Check if the request has query params.
   *
   * @returns true if the request has query params, otherwise false.
   */
  public hasQueryParams(): boolean {
    const req = this.getRequestObject();
    return isObject(req.query) && Object.keys(req.query).length > 0;
  }
}
