import { Router } from 'express';
import IErrorHandler from './IErrorHandler';
import Req from './Req';
import Res from './Res';

export default interface IController<S, T extends Req, U extends Res>
  extends IErrorHandler<S, T, U> {
  /**
   * Registers all routes for this instance.
   *
   * @param router the router instance.
   * @param useMiddleware flag for if the middlewares should be used. Useful for tests.
   */
  registerAllRoutes(router: Router, useMiddleware: boolean): void;
}
