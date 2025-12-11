import {
  Application as BaseApplication,
  ApplicationContext as BaseApplicationContext,
  ApplicationController as BaseApplicationController,
  ApplicationEndpoint as BaseApplicationEndpoint,
  ApplicationMiddleware as BaseApplicationMiddleware,
  ApplicationService as BaseApplicationService,
  toApplicationError,
} from '@fpl/express-app';
import { Transaction } from '@fpl/fpl-express';
import { Req } from './Req';
import { Res } from './Res';

/**
 * The FPL application context implementation.
 */
export class ApplicationContext extends BaseApplicationContext<
  Record<string, never>,
  never
> {
  /**
   * Constructor.
   *
   * @param env - the environment configuration.
   */
  public constructor() {
    super({});
  }
}

/**
 * The FPL backend application.
 */
export class Application extends BaseApplication<ApplicationContext, Req, Res> {
  /**
   * @override
   */
  protected newTransaction(): Transaction<Req, Res> {
    return [new Req(), new Res()];
  }
}

/**
 * The FPL backend application controller.
 */
export class ApplicationController extends BaseApplicationController<
  ApplicationContext,
  Req,
  Res
> {}

/**
 * The FPL backend application service.
 */
export class ApplicationService extends BaseApplicationService<ApplicationContext> {}

/**
 * The FPL backend application middleware.
 */
export abstract class ApplicationMiddleware extends BaseApplicationMiddleware<
  ApplicationContext,
  Req,
  Res
> {}

/**
 * The FPL backend application endpoint.
 */
export abstract class ApplicationEndpoint<
  ResBody,
  Arguments = void
> extends BaseApplicationEndpoint<
  ApplicationContext,
  string,
  ResBody,
  Arguments
> {}

/**
 * Throw application error helper.
 *
 * @param msg - the error message.
 * @param status - the HTTP status code.
 */
export const toAppError = toApplicationError;
export { Req, Res };
