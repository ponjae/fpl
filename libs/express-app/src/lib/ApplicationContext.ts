import { Api, Service, getApi, getURL } from '@fpl/environment';
import { IContext } from '@fpl/fpl-express';
import { PathParams, defaultTo } from '@fpl/utils';
import { ApplicationService } from './ApplicationService';
import { Req } from './Req';

export const Environments = {
  /**
   * The server is running in our cte environment.
   */
  Cte: 'cte',
  /**
   * The server is running in our prod environment.
   */
  Prod: 'prod',
} as const;
export type Environment = (typeof Environments)[keyof typeof Environments];

export class ApplicationContext<
  T extends object = Record<string, never>,
  U extends string = string
> implements IContext<T>
{
  /**
   * The max number of service instance types held by the pool.
   */
  private static readonly MAX_POOLSIZE = 10;

  /**
   * The request map.
   */
  private readonly requestMap: WeakMap<
    Req,
    ApplicationService<ApplicationContext<T, U>>[]
  > = new WeakMap();

  /**
   * The pool of service instances.
   */
  private readonly pool: Record<
    string,
    ApplicationService<ApplicationContext<T, U>>[]
  > = {};

  /**
   * The configuration.
   */
  private readonly configuration: T;

  /**
   * The environment.
   */
  private readonly env: Environment;

  /**
   * Constructor.
   *
   * @param configuration - the configuration.
   */
  public constructor(configuration: T, env: Environment) {
    this.configuration = configuration;
    this.env = env;
  }

  /**
   * Check if server is running in local host in dev mode.
   *
   * @returns true when server is running locally, otherwise false.
   */
  public isLocalEnvironment(): boolean {
    return process.env.LOCAL_ENV === 'true';
  }

  /**
   * Get the environment.
   *
   * @returns the environment.
   */
  public getEnvironment(): Environment {
    return this.env;
  }

  /**
   * Get the service instance.
   *
   * @param Class - the class constructor.
   * @param request - the request.
   */
  public getService<S extends ApplicationService<ApplicationContext<T, U>>>(
    Class: new () => S,
    request: Req
  ): S {
    const service = defaultTo(this.pool[Class.name]?.pop(), new Class());
    const services = defaultTo(this.requestMap.get(request), []);

    // Add the service to the request map.
    services.push(service);
    // Update the request map so we know which services that were allocated.
    this.requestMap.set(request, services);

    // Init the service with the context.
    service._init(this);
    return service as S;
  }

  /**
   * Recycle the services.
   *
   * @param request - the request object.
   */
  public _recycle(request: Req): void {
    defaultTo(this.requestMap.get(request), []).forEach((service) => {
      const key = service.constructor.name;

      if (
        !this.pool[key] ||
        this.pool[key].length < ApplicationContext.MAX_POOLSIZE
      ) {
        this.pool[key] = defaultTo(this.pool[key], []).concat(service);
      }

      this.requestMap.delete(request);
    });
  }

  /**
   * Get the url.
   *
   * @param api - the api entry.
   * @param params - the required params.
   *
   * @returns the url.
   */
  public getUrl<T extends Service, U extends keyof T['api']>(
    api: T,
    name: U,
    params: Record<PathParams<T['api'][U]['path']>, string | number>
  ): URL {
    return getURL(api, name, params);
  }

  /**
   * Get the api.
   *
   * @param service - the service entry.
   * @param name - the api name.
   * @param params - the required params.
   *
   * @returns the service and api entry including the complete url.
   */
  public getApi<T extends Service, U extends keyof T['api']>(
    service: T,
    name: U,
    params: Record<PathParams<T['api'][U]['path']>, string | number>
  ): Omit<T, 'api'> & Api & { url: URL; name: U } {
    return getApi(service, name, params);
  }

  /**
   * @override
   */
  public getConfiguration(): T {
    return this.configuration;
  }
}
