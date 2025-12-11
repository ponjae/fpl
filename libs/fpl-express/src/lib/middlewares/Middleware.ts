import { RequestHandler, NextFunction, Request, Response } from 'express';
import { IMiddleware, MaybeAsync } from './types';
import Req from '../core/Req';
import Res from '../core/Res';
import Application from '../Application';
import IContext from '../store/IContext';

export default abstract class Middleware<
  T extends IContext,
  RequestObject extends Req = Req,
  ResponseObject extends Res = Res
> implements IMiddleware
{
  private context?: T;

  /**
   * Run the middleware.
   *
   * @param req the request object.
   * @param res the response object.
   * @param next the next function.
   */
  protected abstract run(
    req: RequestObject,
    res: ResponseObject,
    next: NextFunction
  ): MaybeAsync;

  /**
   * Optional error handler.
   *
   * @param error the error received.
   * @param req the request object.
   * @param res the response object.
   * @param next the next function.
   */
  protected onError(
    error: unknown,
    _req: RequestObject,
    _res: ResponseObject,
    next: NextFunction
  ): MaybeAsync {
    return next(error);
  }

  /**
   * Get the context.
   *
   * @returns the context.
   *
   * @throws error when the context is not setup.
   */
  public getContext(): T {
    if (this.context) {
      return this.context;
    }
    throw new Error('The context is not initialized');
  }

  /**
   * The request handler.
   *
   * @param req the request object.
   * @param res the response object.
   * @param next the next function.
   */
  private async request(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const [request, response] = Application.getTransaction<
      RequestObject,
      ResponseObject
    >(req, res);
    try {
      await this.run(request, response, next);
    } catch (error) {
      await this.onError(error, request, response, next);
    }
  }

  /**
   * @override
   */
  public getRequestHandler(): RequestHandler {
    return this.request.bind(this);
  }

  /**
   * Framework init method.
   *
   * @param context
   */
  public _setContext(context: T) {
    this.context = context;
  }
}
