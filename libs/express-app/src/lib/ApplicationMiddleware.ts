import { IContext, Middleware } from '@fpl/fpl-express';
import { Req } from './Req';
import { Res } from './Res';

/**
 * Application middleware base class.
 */
export abstract class ApplicationMiddleware<
  Context extends IContext,
  Request extends Req,
  Response extends Res
> extends Middleware<Context, Request, Response> {}
