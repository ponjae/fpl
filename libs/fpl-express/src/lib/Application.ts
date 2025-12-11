import express from 'express';
import { NextFunction, Request, Response, Router } from 'express';
import IErrorHandler, { ErrorResponse } from './core/IErrorHandler';
import Req from './core/Req';
import Res from './core/Res';
import IController from './core/IController';
import Middleware from './middlewares/Middleware';
import IContext from './store/IContext';
import { IMiddleware } from './middlewares/types';
import { TransactionManager } from './core/TransactionManager';

export type AssetDir = {
  name: string;
  maxAge?: number;
};

export type RouteOptions = {
  basepath?: string;
  disableRouteMiddleware?: boolean;
  mergeParams?: boolean;
  routerMiddleware?: IMiddleware;
};

export type Transaction<S extends Req, T extends Res> = [S, T];

export default abstract class Application<
    Context extends IContext,
    ErrorBody,
    RequestObject extends Req = Req,
    ResponseObject extends Res = Res
  >
  extends TransactionManager<RequestObject, ResponseObject>
  implements IErrorHandler<ErrorBody, RequestObject, ResponseObject>
{
  /** The default route/router options. */
  private static readonly DefaultRouterOptions: RouteOptions = {
    basepath: '',
    disableRouteMiddleware: false,
    mergeParams: false,
  };
  private readonly controllers: IController<ErrorBody, RequestObject, ResponseObject>[];
  private readonly middlewares: IMiddleware[];

  /**
   * Constructor.
   *
   * @param controllers the controllers.
   * @param middlewares the middlewares.
   */
  public constructor(
    controllers: IController<ErrorBody, RequestObject, ResponseObject>[],
    middlewares: IMiddleware[]
  ) {
    super();
    this.controllers = controllers;
    this.middlewares = middlewares;
  }

  /**
   * Start the application.
   *
   * @param context the context.
   * @param options the route options.
   *
   * @returns the express app instance.
   */
  public create(
    context: Context,
    options: RouteOptions = Application.DefaultRouterOptions
  ): express.Application {
    const { mergeParams, basepath, disableRouteMiddleware, routerMiddleware } = options;
    const app = express();
    const router = Router({ mergeParams });

    // Generic middleware for setting the request object.
    app.use((req, res, next) => {
      this.startTransaction(req, res);
      next();
    });

    if (this.middlewares.length > 0) {
      app.use(
        ...this.middlewares.map((mw) => {
          if (mw instanceof Middleware) {
            mw._setContext(context);
          }
          return mw.getRequestHandler();
        })
      );
    }

    this.controllers.forEach((controller) =>
      controller.registerAllRoutes(router, !disableRouteMiddleware)
    );

    const path = basepath ?? '';
    if (routerMiddleware) {
      if (routerMiddleware instanceof Middleware) {
        routerMiddleware._setContext(context);
      }
      app.use(path, routerMiddleware.getRequestHandler(), router);
    } else {
      app.use(path, router);
    }

    app.use('*', (req, res, next) => {
      try {
        const [request, response] = TransactionManager.getTransaction<
          RequestObject,
          ResponseObject
        >(req, res);

        this.onRouteNotFound(app, request, response, next);
      } catch (error) {
        next(error);
      }
    });

    app.use((err: Error, req: Request, res: Response, _: NextFunction) => {
      try {
        const [request, response] = TransactionManager.getTransaction<
          RequestObject,
          ResponseObject
        >(req, res);

        const errorResponse = this.onError(err, request, response);
        response.send(errorResponse.body, errorResponse.status);
      } catch (error) {
        res.status(500).send('Request failed');
      }
    });

    return app;
  }

  /**
   * @override
   */
  public abstract onError(
    error: Error,
    req: RequestObject,
    res: ResponseObject
  ): ErrorResponse<ErrorBody>;

  /**
   * Callback when a route is not found.
   *
   * @param app the express application.
   * @param req the request instance.
   * @param res the response instance.
   * @param next the next function.
   */
  public abstract onRouteNotFound(
    app: Express.Application,
    req: RequestObject,
    res: ResponseObject,
    next: NextFunction
  ): void;
}
