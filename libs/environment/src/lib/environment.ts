import { PathParams, toPath } from '@fpl/utils';

export type BucketConfiguration = {
  name: string;
  path: Record<string, string>;
};

export type Service = {
  provider: string;
  host: string;
  clientId?: string;
  secrets?: Record<string, string>;
  api: Record<string, Api>;
};

export type Api = {
  path: string;
};

export type SchedulerConfiguration = {
  location: string;
  name: string;
};

/**
 * Get the url from a service api entry.
 *
 * @param service - the service.
 * @param name - the api name.
 * @param params - the path params.
 *
 * @returns the URL object.
 *
 * @throws error when api name does not exist.
 */
export const getURL = <T extends Service, U extends keyof T['api']>(
  service: T,
  name: U,
  params: Record<PathParams<T['api'][U]['path']>, string | number>
) => {
  const api = service.api[String(name)];
  if (!api) {
    throw new Error('Api does not exist');
  }

  return new URL(toPath(api.path, params), service.host);
};

/**
 * Get the url from a service api entry.
 *
 * @param service - the service.
 * @param name - the api name.
 * @param params - the path params.
 *
 * @returns the url.
 *
 * @throws error when api name does not exist.
 */
export const getUrl = <T extends Service, U extends keyof T['api']>(
  service: T,
  name: U,
  params: Record<PathParams<T['api'][U]['path']>, string | number>
) => getURL(service, name, params);

/**
 * Get the api/service entry including the complete url.
 *
 * @param service - the service entry.
 * @param name - the api name.
 * @param params - the required params.
 *
 * @returns the service and api entry including the complete url.
 */
export const getApi = <T extends Service, U extends keyof T['api']>(
  service: T,
  name: U,
  params: Record<PathParams<T['api'][U]['path']>, string | number>
): Omit<T, 'api'> & Api & { url: URL; name: U } => {
  const { api, ...rest } = service;
  return {
    ...rest,
    ...api[name as string],
    url: getUrl(service, name, params),
    name,
  };
};
