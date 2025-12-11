import { Fixture } from '@fpl/contracts/fpl';
import { EndpointErrorBody } from '@fpl/express-app';
import { HttpError } from '@fpl/fpl-express';
import { Method, Request, RequestError } from '@fpl/network';
import { ApplicationEndpoint } from '../../../app';

export class GetFixtures extends ApplicationEndpoint<Fixture[]> {
  /**
   * @override
   */
  protected async sendRequest(): Promise<Fixture[]> {
    const response = await new Request<Fixture[]>(
      Method.Get,
      'https://fantasy.premierleague.com/api/fixtures'
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
