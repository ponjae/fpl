import { ErrorBody } from '@fpl/contracts/base';
import { Controller, ErrorResponse } from '@fpl/fpl-express';
import { ApplicationContext } from './ApplicationContext';
import { ErrorHandler } from './ErrorHandler';
import { Req } from './Req';
import { Res } from './Res';

export class ApplicationController<
  Context extends ApplicationContext,
  Request extends Req,
  Response extends Res
> extends Controller<Context, ErrorBody, Request, Response> {
  /**
   * @override
   */
  protected onStartRequest(_req: Request, _res: Response): void {}

  /**
   * @override
   */
  public onError(
    error: Error,
    req: Request,
    _: Response
  ): ErrorResponse<ErrorBody> {
    return ErrorHandler.getErrorBody(error, req);
  }

  /**
   * @override
   */
  public override onEndRequest(
    request: Request,
    _response: Response,
    _meta: unknown
  ): void {
    const context = this.getContext();
    context._recycle(request);
  }
}
