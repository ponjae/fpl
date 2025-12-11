import { NextFunction } from 'express';
import { ErrorBody } from '@fpl/contracts/base';
import {
  Application as BaseApplication,
  ErrorResponse,
  IContext,
} from '@fpl/fpl-express';
import { ApplicationError } from './ApplicationError';
import { ErrorHandler } from './ErrorHandler';
import { Req } from './Req';
import { Res } from './Res';

export abstract class Application<
  Context extends IContext,
  Request extends Req,
  Response extends Res
> extends BaseApplication<Context, ErrorBody, Request, Response> {
  /**
   * @override
   */
  public onRouteNotFound(
    _app: Express.Application,
    _req: Request,
    _res: Response,
    next: NextFunction
  ): void {
    next(new ApplicationError('Route not found', 404));
  }

  /**
   * @override
   */
  public onError(
    error: Error,
    req: Request,
    _res: Response
  ): ErrorResponse<ErrorBody> {
    return ErrorHandler.getErrorBody(error, req);
  }
}
