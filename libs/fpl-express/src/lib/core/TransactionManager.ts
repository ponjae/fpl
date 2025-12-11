import { Request, Response } from 'express';
import Req from './Req';
import Res from './Res';

export type Transaction<S extends Req, T extends Res> = [S, T];

/**
 * The transaction manager transforms requests and responses to the request and responses
 * represented by the framework. It also keeps a pool of the requests and responses for
 * recycling purposes.
 */
export abstract class TransactionManager<S extends Req, T extends Res> {
  private static readonly SampleRate = 10000;
  private static readonly MaxPoolSize = 10;
  private static readonly HighRequestRate = 3;

  private readonly pool: Transaction<S, T>[] = [];
  private timestamp: number = Date.now();
  private requests: number = 0;
  private requestRate: number = 0;

  /**
   * Create a new transaction.
   *
   * @returns the transaction tuple.
   */
  protected abstract newTransaction(): Transaction<S, T>;

  /**
   * Start transaction.
   *
   * @param request the express request object.
   * @param response the express response object.
   */
  protected startTransaction(req: Request, res: Response): void {
    const [request, response] = this.setup(req, res);

    const now = Date.now();
    const timePassed = Math.max(now - this.timestamp, 1);
    this.requests += 1;

    // Sample the request rate.
    if (timePassed > TransactionManager.SampleRate) {
      // At least 10 second has passed.
      this.requestRate = (this.requests * 1000) / timePassed;
      this.timestamp = now;
      this.requests = 0;
    }

    (req as any)._reqObject = request;
    (res as any)._resObject = response;

    const onFinish = () => {
      if ((req as any)._reqObject) {
        delete (req as any)._reqObject;
      }

      if ((res as any)._resObject) {
        delete (res as any)._resObject;
      }

      if (
        this.pool.length < TransactionManager.MaxPoolSize &&
        this.requestRate > TransactionManager.HighRequestRate
      ) {
        // Recycle the transaction.
        this.pool.push([request, response]);
      }

      res.removeListener('finish', onFinish);
      // Transaction done.
    };

    res.on('finish', onFinish);
  }

  /**
   * Get the transaction.
   *
   * @param req the express request object.
   * @param res the express response object.
   *
   * @returns the transaction.
   *
   * @throws error when no transaction is available.
   */
  public static getTransaction<S extends Req, T extends Res>(
    req: Request,
    res: Response
  ): Transaction<S, T> {
    const request: S = (req as any)._reqObject;
    const response: T = (res as any)._resObject;

    if (request && response) {
      return [request, response];
    }
    throw new Error('Could not get http transaction.');
  }

  /**
   * Setup a transaction. The request and response objects can be either recycled
   * objects from the pool or new ones.
   *
   * @param req the request object.
   * @param res the response object.
   *
   * @returns a transaction.
   */
  private setup(req: Request, res: Response): Transaction<S, T> {
    const t = this.pool.pop() ?? this.newTransaction();

    t[0]._init(req);
    t[1]._init(res);
    return t;
  }
}
