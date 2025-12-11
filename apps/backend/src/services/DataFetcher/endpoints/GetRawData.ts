import { AllData } from '@fpl/contracts/fpl';
import { EndpointErrorBody } from '@fpl/express-app';
import { HttpError } from '@fpl/fpl-express';
import { Method, Request, RequestError } from '@fpl/network';
import { ApplicationEndpoint } from '../../../app';

export class GetRawData extends ApplicationEndpoint<AllData> {
  /**
   * @override
   */
  protected async sendRequest(): Promise<AllData> {
    const response = await new Request<AllData>(
      Method.Get,
      'https://fantasy.premierleague.com/api/bootstrap-static/'
    ).send();

    return response.getData();
  }

  /**
   * @override
   */
  protected onErrorResponse(
    error: unknown,
    defaultBody: Readonly<EndpointErrorBody<string>>
  ): EndpointErrorBody<string> {
    let status = defaultBody.status;
    let message = defaultBody.message;

    if (error instanceof RequestError || error instanceof HttpError) {
      status = error.getStatus();
      message = error.getMessage();
    }

    return {
      type: 'API',
      status,
      message,
    };
  }
}
