import { json, RequestHandler } from 'express';
import { IMiddleware } from '@fpl/fpl-express';

export class JsonBodyMiddleware implements IMiddleware {
  private static readonly SIZE: string = '10kb';

  /**
   * @override
   */
  public getRequestHandler(): RequestHandler {
    return json({
      limit: JsonBodyMiddleware.SIZE,
      type: ['json', 'application/json', 'application/csp-report'],
    });
  }
}
