import { describe, it, expect } from 'vitest';
import { getURL, Service } from './environment';

describe('environment', () => {
  const service: Service = {
    provider: 'test',
    host: 'http://host.com/',
    api: {
      test: {
        path: '/api/entity',
      },
    },
  };
  describe('getURL', () => {
    it('should create a valid url from service', () => {
      const url = getURL(service, 'test', {});
      expect(url.toString()).toEqual('http://host.com/api/entity');
    });
  });
});
