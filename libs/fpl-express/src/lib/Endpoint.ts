import ValidationError from './error/ValidationError';
import IContext from './store/IContext';

/**
 * The endpoint error transform function, which takes an error in and transforms
 * it to another error. The original error is also added as param.
 */
export type EndpointErrorTransform<I extends Error, O extends Error> = (
  error: I,
  cause: unknown
) => O;

/**
 * The output validation callback that can be registered with the endpoint.
 */
export type OutputValidationCallback = (body: unknown) => boolean;

/**
 * The input validation callback.
 */
export type InputValidationCallback<Body> = (body: Body) => boolean;

/**
 * An endpoint defines an api endpoint and it should be able to call the
 * endpoint successfully and also handle any error it can throw.
 *
 * EndPoint lifecycle:
 * 1. onStartCall - Before the actual call is sent.
 * 2. sendRequest - This is where the actual call is sent.
 * 3. onResponse - When the call is successful.
 * 4. onError - When the call is not successful.
 * 5. onEndCall - Always called.
 *
 * @param ResBody the result body type.
 * @param Context the application context type.
 * @param Arguments the arguments to the call.
 */
export default abstract class Endpoint<
  Context extends IContext,
  E extends Error,
  ResBody,
  Arguments = any
> {
  private arguments?: Arguments;
  private readonly context: Context;
  private errorTransform?: EndpointErrorTransform<E, Error>;
  private outputValidationCb?: OutputValidationCallback;
  private inputValidationCb?: InputValidationCallback<Arguments>;

  /**
   * Constructor.
   *
   * @param context - the context.
   */
  public constructor(context: Context) {
    this.context = context;
  }

  /**
   * Get the context.
   *
   * @returns the context.
   */
  public getContext(): Context {
    return this.context;
  }

  /**
   * Optional output validation callback.
   *
   * @param callback - the validation callback to register.
   *
   * @returns the endpoint instance.
   */
  public withOutputValidation(callback: OutputValidationCallback): this {
    this.outputValidationCb = callback;
    return this;
  }

  /**
   * Optional input validation callback.
   *
   * @param callback - the input validation callback.
   *
   * @returns the endpoint instance.
   */
  public withInputValidation(
    callback: InputValidationCallback<Arguments>
  ): this {
    this.inputValidationCb = callback;
    return this;
  }

  /**
   * Optional error transformer, when transform is registered it
   * can transform the error into any desired error.
   *
   * @param transform - the error transform.
   *
   * @returns the endpoint instance.
   */
  public withErrorTransform<O extends Error>(
    transform: EndpointErrorTransform<E, O>
  ): this {
    this.errorTransform = transform;
    return this;
  }

  /**
   * Call the endpoint.
   *
   * @param args - the arguments.
   *
   * @throws ApplicationError when the request fails.
   *
   * @returns the result body.
   */
  public async call(args: Arguments): Promise<ResBody> {
    let response: ResBody | undefined;
    let isSuccessful = true;

    try {
      this.arguments = args;
      this.onStartCall(args);
      response = await this.sendRequest(args);
      this.onResponse(response);
      return response;
    } catch (error) {
      isSuccessful = false;
      const typedError = this.getTypedError(error);
      const transformedError = this.errorTransform?.(typedError, error);

      throw transformedError ?? typedError;
    } finally {
      try {
        await this.onEndCall(response, isSuccessful);
      } catch (_error) {
        // Nop - just a pre-caution.
      }
    }
  }

  /**
   * Get the arguments used for this endpoint.
   * Note that this method should not be called before call.
   *
   * @returns the arguments.
   *
   * @throws error when no arguments are set.
   */
  protected getArguments(): Arguments {
    if (this.arguments) {
      return this.arguments;
    }
    throw new Error('No arguments');
  }

  /**
   * Send request callback.
   *
   * @param args the request arguments.
   *
   * @returns the response object.
   */
  protected abstract sendRequest(args: Arguments): Promise<ResBody>;

  /**
   * Callback before the call is started. No errors need to be caught instead handle it in the onError function.
   *
   * @param args - the arguments.
   *
   * @throws
   */
  protected onStartCall(args: Arguments): void {
    if (this.inputValidationCb && !this.inputValidationCb(args)) {
      throw new ValidationError('Input validation failed');
    }
  }

  /**
   * Callback when the response is received.
   *
   * @param response the response.
   */
  protected onResponse(response: ResBody): void {
    if (this.outputValidationCb && !this.outputValidationCb(response)) {
      throw new ValidationError('Output validation failed');
    }
  }

  /**
   * Callback when the call has ended.
   *
   * @param response - the response received.
   * @param isCallSuccessful - flag for the call was successful.
   */
  protected async onEndCall(
    _response: ResBody | undefined,
    _isCallSuccessful: boolean
  ): Promise<void> {}

  /**
   * Callback when an error is received.
   *
   * @param error - the error received.
   */
  protected onError(_error: unknown): void {}

  /**
   * Create the typed error from the received http error.
   *
   * @param error - the error received.
   *
   * @returns the typed error.
   */
  protected abstract createError(error: unknown): E;

  /**
   * Get the typed error to throw.
   *
   * @param error - the error received.
   *
   * @returns the typed error.
   */
  private getTypedError(error: unknown): E {
    this.onError(error);
    return this.createError(error);
  }
}
