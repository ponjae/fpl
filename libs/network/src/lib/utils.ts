import { Buffer } from 'buffer';
import { AuthenticationTypes } from './types';

const Base64 = 'base64';
const Utf8 = 'utf-8';

export type BasicAuthCredentials = {
  username: string;
  password: string;
};

/**
 * Base64 encode a string.
 *
 * @param s - the string to encode.
 *
 * @returns the base 64 encoded string
 */
export const base64Encode = (s: string) => Buffer.from(s).toString(Base64);

/**
 * Base64 decode a string.
 *
 * @param s - the string to decode.
 *
 * @returns the decoded string.
 */
export const base64Decode = (s: string) =>
  Buffer.from(s, Base64).toString(Utf8);

/**
 * Check if basic authentication header is valid.
 *
 * @param expectedCredentials - the expected credentials.
 * @param headerValue - the received credentials.
 *
 * @returns true if expected credentials match the auth header value, otherwise false.
 */
export const isValidCredentials = (
  expectedCredentials: BasicAuthCredentials,
  headerValue?: string
) => {
  const { username, password } = expectedCredentials;
  const credentials = `${username}:${password}`;

  return `Basic ${base64Encode(credentials)}` === headerValue;
};

/**
 * Get the basic authentication credentials from a auth header.
 *
 * @param headerValue - the auth header value.
 *
 * @returns the basic auth or undefined.
 */
export const getBasicAuthentication = (headerValue?: string) => {
  let credentials: BasicAuthCredentials | undefined = undefined;

  if (headerValue) {
    const [type, base64Val] = headerValue.split(' ');

    if (type === AuthenticationTypes.Basic && base64Val) {
      const [username, password] = base64Decode(base64Val).split(':');

      if (username && password) {
        credentials = { username, password };
      }
    }
  }
  return credentials;
};

/**
 * Get the bearer token.
 *
 * @param headerValue - the auth header value.
 *
 * @returns the token or undefined.
 */
export const getBearerToken = (headerValue?: string) => {
  let token: string | undefined;

  if (headerValue) {
    const [type, bearerToken] = headerValue.split(' ');
    if (type === AuthenticationTypes.Bearer) {
      token = bearerToken;
    }
  }

  return token;
};
