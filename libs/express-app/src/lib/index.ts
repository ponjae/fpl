export * from './Application';
export * from './ApplicationContext';
export * from './ApplicationController';
export * from './ApplicationEndpoint';
export * from './ApplicationError';
export * from './ApplicationMiddleware';
export * from './ApplicationService';
export * from './ErrorHandler';
export * from './middlewares';
export * from './Req';
export * from './Res';

/**
 * Development identifier.
 */
const DEVELOPMENT = 'development';

/**
 * Check if the environment is development.
 *
 * @returns true when environment is development.
 */
export const isDev = () => process.env.NODE_ENV === DEVELOPMENT;
