import { RequestHandler } from 'express';

/**
 * The base middleware interface.
 */
export interface IMiddleware {
  /**
   * Get the request handler.
   *
   * @returns the request handler middleware.
   */
  getRequestHandler(): RequestHandler;
}

export type MaybeAsync<T = void> = Promise<T> | T;

export type MiddlewareConstructor = new (...args: any[]) => IMiddleware;
