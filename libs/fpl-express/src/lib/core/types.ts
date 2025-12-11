import Req from './Req';
import Res from './Res';

/**
 * The request function to register to a controller.
 *
 * @param req the request object.
 * @param res the response object.
 */
export type RequestFunction<Request extends Req = Req, Response extends Res = Res, Param = any> = (
  req: Request,
  res: Response,
  param: Param
) => Promise<void>;
