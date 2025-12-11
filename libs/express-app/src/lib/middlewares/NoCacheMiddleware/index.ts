import { RequestHandler } from 'express';
import { IMiddleware } from '@fpl/fpl-express';

export class NoCacheMiddleware implements IMiddleware {
  /**
   * @override
   */
  public getRequestHandler(): RequestHandler {
    return (_, res, next) => {
      res.header(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate'
      );
      next();
    };
  }
}
