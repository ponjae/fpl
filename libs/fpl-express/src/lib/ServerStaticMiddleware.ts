import * as express from 'express';
import { IMiddleware } from './middlewares/types';
import { AssetDir } from './Application';

export class ServeStaticMiddleware implements IMiddleware {
  private readonly assetDir: AssetDir;

  /**
   * Constructor.
   *
   * @param dir - the asset dir.
   */
  public constructor(dir: AssetDir) {
    this.assetDir = dir;
  }

  /**
   * @override
   */
  public getRequestHandler(): express.RequestHandler {
    const { name, maxAge } = this.assetDir;
    return express.static(__dirname + '/' + name, { maxAge });
  }
}
