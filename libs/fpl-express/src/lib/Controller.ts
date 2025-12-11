import { Router, Request, Response } from 'express';
import Req from './core/Req';
import Res from './core/Res';
import { RequestFunction } from './core/types';
import { IMiddleware, MiddlewareConstructor } from './middlewares/types';
import IContext from './store/IContext';
import { ErrorResponse } from './core/IErrorHandler';
import IController from './core/IController';
import Middleware from './middlewares/Middleware';
import Application from './Application';

const RouteFn = Symbol('RouteFn');
const MetaFn = Symbol('MetaFn');
const MiddlewareFn = Symbol('MiddlewareFn');

type RouteEntryProps = {
  method: Method;
  route: string;
};

type MiddlewareItem = {
  methods: string[];
  handler: IMiddleware;
  ctor: MiddlewareConstructor;
};

type MiddlewareRegistration = {
  ctor: MiddlewareConstructor;
  params: any[];
};

export type Method = 'post' | 'put' | 'patch' | 'delete' | 'get';

export namespace Decorators {
  /**
   * Route decorator. Registers a method as a route in controller subclass.
   * Must be added to a controller request function.
   *
   * @param method the method.
   * @param route the route path.
   */
  export function Route(method: Method, route: string) {
    return function (target: any, propertyKey: string) {
      target[RouteFn] = target[RouteFn] || new Map<string, RouteEntryProps>();
      target[RouteFn].set(propertyKey, {
        method,
        route,
      });
    };
  }

  /**
   * Meta decorator. Add any data that can be fetched in the Req:getMeta method.
   *
   * @param meta the meta object to add to the request.
   */
  export function Meta<T = any>(meta: T) {
    return function (target: any, propertyKey: string) {
      target[MetaFn] = target[MetaFn] || new Map<string, T>();
      target[MetaFn].set(propertyKey, meta);
    };
  }

  /**
   * Add a middleware to a specific route.
   *
   * @param middleware the middleware to add.
   */
  export function Middleware<T extends MiddlewareConstructor>(
    middleware: T,
    ...params: ConstructorParameters<T>
  ) {
    return function (target: any, propertyKey: string) {
      target[MiddlewareFn] = target[MiddlewareFn] || new Map<string, MiddlewareRegistration[]>();

      const registration: MiddlewareRegistration = { ctor: middleware, params };
      if (target[MiddlewareFn].has(propertyKey)) {
        const registrations = target[MiddlewareFn].get(propertyKey);
        registrations.push(registration);
      } else {
        target[MiddlewareFn].set(propertyKey, [registration]);
      }
    };
  }
}

/**
 * Controller base class.
 *
 * @param Context the context.
 * @param ErrorBody the error body.
 * @param ReqParam the request sensitive param.
 */
export default abstract class Controller<
  Context extends IContext,
  ErrorBody,
  RequestObject extends Req = Req,
  ResponseObject extends Res = Res,
  ReqSession = void
> implements IController<ErrorBody, RequestObject, ResponseObject>
{
  private readonly context: Context;

  /**
   * Constructor.
   *
   * @param context the app context.
   */
  public constructor(context: Context) {
    this.context = context;
  }

  /**
   * @override
   */
  public registerAllRoutes(router: Router, useMiddleware: boolean): void {
    const prototype = Object.getPrototypeOf(this);
    const routeData = prototype[RouteFn] as Map<string, RouteEntryProps>;
    const metadata = prototype[MetaFn] as Map<string, unknown>;
    const mwData = prototype[MiddlewareFn] as Map<string, MiddlewareRegistration[]>;
    const mws = useMiddleware ? Controller.getMiddlewareInstances(this.context, mwData) : [];

    if (routeData) {
      routeData.forEach((meta, method) => {
        const requestMeta = metadata?.get(method);
        this.addRoute(
          router,
          meta.method,
          meta.route,
          requestMeta,
          (this as any)[method] as RequestFunction<RequestObject, ResponseObject>,
          mws.filter(({ methods }) => methods.includes(method)).map(({ handler }) => handler)
        );
      });
    } else {
      throw new Error('No route functions registered.');
    }

    delete prototype[RouteFn];
    delete prototype[MetaFn];
    delete prototype[MiddlewareFn];
  }

  /**
   * Add a route.
   *
   * @param router the router instance.
   * @param method the method.
   * @param route the route path.
   * @param fn the request function.
   * @param middlewares the middlewares.
   */
  private addRoute(
    router: Router,
    method: Method,
    route: string,
    meta: any,
    fn: RequestFunction<RequestObject, ResponseObject, ReqSession>,
    middlewares: IMiddleware[]
  ): void {
    router[method](
      route,
      middlewares.map((mw) => mw.getRequestHandler()),
      this.request.bind(this, meta, fn.bind(this))
    );
  }

  /**
   * The request that is actually sent.
   *
   * @param meta the meta data added for the registration.
   * @param requestFn the request function.
   * @param req the express request object.
   * @param res the express response object.
   */
  private async request(
    meta: any,
    requestFn: RequestFunction<RequestObject, ResponseObject, ReqSession>,
    req: Request,
    res: Response
  ): Promise<void> {
    const [request, response] = Application.getTransaction<RequestObject, ResponseObject>(req, res);

    try {
      const session = this.onStartRequest(request, response, meta);
      await requestFn(request, response, session);
      this.onSuccess(request, response, meta, session);
    } catch (error) {
      const { body, status } = this.onError(error, request, response, meta);
      response.send(body, status);
    } finally {
      this.onEndRequest(request, response, meta);
    }
  }

  /**
   * Get the context.
   *
   * @returns the context.
   */
  protected getContext(): Context {
    return this.context;
  }

  /**
   * Start request callback.
   *
   * @param req the request object.
   * @param res the response object.
   * @param meta the meta added by decorators.
   *
   * @returns the request session.
   */
  protected abstract onStartRequest(req: RequestObject, res: ResponseObject, meta: any): ReqSession;

  /**
   * Callback when the request has ended.
   *
   * @param request the request object.
   * @param response the response object.
   * @param meta the meta added by decorators.
   */
  protected onEndRequest(_request: RequestObject, _response: ResponseObject, _meta: any): void {}

  /**
   * End request callback.
   *
   * @param _req the request object.
   * @param _meta the meta added by decorators.
   * @param _session the request session.
   */
  protected onSuccess(
    _req: RequestObject,
    _res: ResponseObject,
    _meta: any,
    _session: ReqSession
  ): void {}

  /**
   * @override
   */
  public abstract onError(
    error: unknown,
    req: RequestObject,
    res: ResponseObject,
    meta: any
  ): ErrorResponse<ErrorBody>;

  /**
   * Groups middleware routes with the instances of the actual middleware.
   *
   * @param context the context.
   * @param map the map of all constructors.
   *
   * @returns middlewares items.
   */
  private static getMiddlewareInstances<T extends IContext>(
    context: T,
    map: Map<string, MiddlewareRegistration[]> | undefined
  ): MiddlewareItem[] {
    const items: MiddlewareItem[] = [];

    if (map) {
      for (const [method, registrations] of Array.from(map)) {
        for (const registration of registrations) {
          const { ctor, params } = registration;
          const index = items.findIndex((item) => item.ctor === ctor);

          if (index >= 0) {
            const { methods, ...rest } = items[index];
            items[index] = { methods: methods.concat(method), ...rest };
          } else if (typeof ctor === 'function') {
            const handler = new ctor(...params);

            if (handler instanceof Middleware) {
              handler._setContext(context);
            }
            items.push({ methods: [method], handler: handler, ctor });
          } else {
            throw new Error('Could not instantiate middleware');
          }
        }
      }
    }
    return items;
  }
}
