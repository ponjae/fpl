import { defaultTo } from '@fpl/utils';
import fetchMock, { FetchMock } from 'fetch-mock';
import Request from './Request';
import RequestError from './RequestError';
import { Method, TimeoutTime } from './types';

const mock = <T extends object>(method: Method, url: URL, body: T, status: number, delay = 0) =>
  fetchMock.mockGlobal()[method](
    url.toString(),
    {
      body,
      status,
    },
    { delay }
  );

describe('Request', () => {
  let instance: FetchMock;

  afterEach(() => {
    instance.hardReset();
  });

  describe('Successful response', () => {
    const reqUrl = new URL('https://server.com/api/fetch');
    beforeEach(() => {
      instance = mock(Method.Post, reqUrl, { success: true }, 200);
    });

    it('should be able to send', async () => {
      const response = await new Request(Method.Post, reqUrl).send();

      expect(response.getData()).toEqual({ success: true });
    });

    it('should be able to send basic authentication', async () => {
      const response = await new Request(Method.Post, reqUrl)
        .withBasicAuthentication('user', 'password')
        .send();

      const { headers } = response.getConfig();

      if (headers instanceof Headers) {
        expect(headers.get('Authorization')).toBe('Basic dXNlcjpwYXNzd29yZA==');
      } else {
        throw new Error('Wrong type of headers');
      }
    });

    it('should be able to send bearer token', async () => {
      const response = await new Request(Method.Post, reqUrl)
        .withAuthorization('Bearer', 'fakebearer')
        .send();

      const { headers } = response.getConfig();

      if (headers instanceof Headers) {
        expect(headers.get('Authorization')).toBe('Bearer fakebearer');
      } else {
        throw new Error('Wrong type of headers');
      }
    });

    it('should be able to send body, the body is send as string', async () => {
      const response = await new Request(Method.Post, reqUrl).withBody({ value: 3 }).send();

      const { body } = response.getConfig();
      expect(body).toEqual(JSON.stringify({ value: 3 }));
    });
  });

  describe('Query params', () => {
    const reqUrl = new URL('https://server.com/api/fetch');

    beforeEach(() => {
      const matchedUrl = new URL(reqUrl);
      matchedUrl.searchParams.append('a', 'a');
      matchedUrl.searchParams.append('b', 'b');

      instance = mock(Method.Post, matchedUrl, { success: true }, 200);
    });

    it('should be able to send url search params', async () => {
      const response = await new Request(Method.Post, reqUrl)
        .withQueryParams({ a: 'a', b: 'b' })
        .send();

      const {
        url: { searchParams },
      } = response.getConfig();

      expect(searchParams.size).toBe(2);
      expect(searchParams.get('a')).toBe('a');
      expect(searchParams.get('b')).toBe('b');
    });
  });

  describe('Error from server', () => {
    const reqUrl = new URL('https://server.com/api/fetch');

    beforeEach(() => {
      instance = mock(Method.Post, reqUrl, { error: 'Bad request' }, 400);
    });

    it('should throw a request error', async () => {
      const response = await new Request(Method.Post, reqUrl).send().catch((error) => error);

      expect(response).toBeInstanceOf(RequestError);
      expect(response).toHaveProperty('status', 400);
      expect(response).toHaveProperty('message', 'Bad Request');
    });

    it('should redact auth headers and body by default', async () => {
      const response = await new Request(Method.Post, reqUrl)
        .withAuthorization('Bearer', 'bearer')
        .withBody({ value: 'some sensitive value' })
        .send()
        .catch((error) => error);

      let authHeaderValue = '';
      if (response instanceof RequestError) {
        const { headers, body } = response.getConfig();

        if (headers instanceof Headers) {
          authHeaderValue = defaultTo(headers.get('Authorization'), '');
        }
        expect(authHeaderValue).toBe('[redacted]');
        expect(body).toBe('[redacted]');
      } else {
        throw new Error('Wrong type of error');
      }
    });

    it('should not redact auth headers and body when set', async () => {
      const response = await new Request(Method.Post, reqUrl)
        .withAuthorization('Bearer', 'bearer')
        .withBody({ value: 'some sensitive value' })
        .withoutRedaction()
        .send()
        .catch((error) => error);

      let authHeaderValue = '';
      if (response instanceof RequestError) {
        const { headers, body } = response.getConfig();

        if (headers instanceof Headers) {
          authHeaderValue = defaultTo(headers.get('Authorization'), '');
        }

        expect(authHeaderValue).toBe('Bearer bearer');
        expect(body).toBe(JSON.stringify({ value: 'some sensitive value' }));
      } else {
        throw new Error('Wrong type of error');
      }
    });
  });

  describe('Retry handling', () => {
    const reqUrl = new URL('https://server.com/api/fetch');

    beforeEach(() => {
      instance = mock(Method.Get, reqUrl, { error: 'Bad request' }, 429);
    });

    it('should retry 3 times by default', async () => {
      let attempts = 0;
      await new Request(Method.Get, reqUrl)
        .withPerformanceCallback((_, __, attempt) => (attempts = attempt))
        .send()
        .catch((error) => error);

      expect(attempts).toBe(3);
    });

    it('should not retry when set not to', async () => {
      let attempts = 0;
      await new Request(Method.Get, reqUrl)
        .withPerformanceCallback((_, __, attempt) => (attempts = attempt))
        .withRetries(0)
        .send()
        .catch((error) => error);

      expect(attempts).toBe(1);
    });
  });

  describe('Request timeout', () => {
    const reqUrl = new URL('https://server.com/api/fetch');

    beforeEach(() => {
      instance = mock(Method.Get, reqUrl, { error: 'Bad request' }, 429, 2000);
    });

    it('should timeout with status 408', async () => {
      const error = await new Request(Method.Get, reqUrl)
        .withTimeout(TimeoutTime.Short)
        .withRetries(0)
        .send()
        .catch((error) => error);

      if (error instanceof RequestError) {
        expect(error.getStatus()).toBe(408);
      } else {
        throw new Error('Wrong type of error');
      }
    });
  });
});
