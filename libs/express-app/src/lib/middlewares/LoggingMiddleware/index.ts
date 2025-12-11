import { RequestHandler } from 'express';
import { IMiddleware } from '@fpl/fpl-express';

export class LoggingMiddleware implements IMiddleware {
  /** The log request handler. */
  private readonly logHandler: RequestHandler;

  /**
   * Constructor.
   *
   * @param handler - the logger request handler.
   */
  public constructor(handler: RequestHandler) {
    this.logHandler = handler;
  }

  /**
   * @override
   */
  public getRequestHandler(): RequestHandler {
    return this.logHandler;
  }
}
