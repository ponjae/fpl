import Req from './Req';
import Res from './Res';

export interface ErrorResponse<ErrorBody> {
  status: number;
  body: ErrorBody;
}

export default interface IErrorHandler<
  ErrorBody,
  RequestObject extends Req,
  ResponseObject extends Res
> {
  /**
   * Callback when an error occurs.
   *
   * @param error the error thrown in request function.
   * @param req the request object.
   * @param res the response object.
   * @param meta the meta passed from controller.
   *
   * @returns the error body.
   */
  onError(
    error: unknown,
    req: RequestObject,
    res: ResponseObject,
    meta: any
  ): ErrorResponse<ErrorBody>;
}
