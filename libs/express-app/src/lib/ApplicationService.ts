import { IContext } from '@fpl/fpl-express';

/**
 * The application service baseclass. The service should hold api endpoints.
 */
export abstract class ApplicationService<T extends IContext> {
  /**
   * The app context.
   */
  private context?: T;

  /**
   * Init the application service.
   *
   * @param context - the context instance.
   */
  public _init(context: T): void {
    this.context = context;
  }

  /**
   * Get the context.
   *
   * @returns the context.
   */
  protected getContext(): T {
    return this.context!;
  }
}
