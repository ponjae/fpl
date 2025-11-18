import { replace, toPath, type PathParams } from './text';

describe('utils - Text', () => {
  describe('replace', () => {
    it('should replace single placeholder in template', () => {
      const template = 'Hello :name';
      const regexp = /:(\w+)/g;
      const replacements = { name: 'World' };

      expect(replace(template, regexp, replacements)).toBe('Hello World');
    });

    it('should replace multiple placeholders in template', () => {
      const template = 'Hello :name, you are :age years old';
      const regexp = /:(\w+)/g;
      const replacements = { name: 'Alice', age: 30 };

      expect(replace(template, regexp, replacements)).toBe(
        'Hello Alice, you are 30 years old'
      );
    });

    it('should handle numeric replacements', () => {
      const template = 'User :id has :score points';
      const regexp = /:(\w+)/g;
      const replacements = { id: 123, score: 9999 };

      expect(replace(template, regexp, replacements)).toBe(
        'User 123 has 9999 points'
      );
    });

    it('should leave unreplaced placeholders unchanged', () => {
      const template = 'Hello :name, welcome to :place';
      const regexp = /:(\w+)/g;
      const replacements = { name: 'Bob' };

      expect(replace(template, regexp, replacements)).toBe(
        'Hello Bob, welcome to :place'
      );
    });

    it('should handle empty replacements object', () => {
      const template = 'Hello :name';
      const regexp = /:(\w+)/g;
      const replacements = {};

      expect(replace(template, regexp, replacements)).toBe('Hello :name');
    });

    it('should handle template with no placeholders', () => {
      const template = 'Hello World';
      const regexp = /:(\w+)/g;
      const replacements = { name: 'Alice' };

      expect(replace(template, regexp, replacements)).toBe('Hello World');
    });
  });

  describe('toPath', () => {
    it('should populate path with single parameter', () => {
      const path = '/users/:id';
      const params = { id: 123 };

      expect(toPath(path, params)).toBe('/users/123');
    });

    it('should populate path with multiple parameters', () => {
      const path = '/users/:userId/posts/:postId';
      const params = { userId: 42, postId: 999 };

      expect(toPath(path, params)).toBe('/users/42/posts/999');
    });

    it('should handle string parameters', () => {
      const path = '/category/:name/item/:sku';
      const params = { name: 'electronics', sku: 'ABC123' };

      expect(toPath(path, params)).toBe('/category/electronics/item/ABC123');
    });

    it('should handle path with no parameters', () => {
      const path = '/home';
      const params = {} as Record<never, string | number>;

      expect(toPath(path, params)).toBe('/home');
    });

    it('should handle complex nested paths', () => {
      const path = '/api/:version/users/:userId/settings/:setting';
      const params = { version: 'v1', userId: 123, setting: 'preferences' };

      expect(toPath(path, params)).toBe(
        '/api/v1/users/123/settings/preferences'
      );
    });

    it('should handle numeric zero as parameter', () => {
      const path = '/page/:number';
      const params = { number: 0 };

      expect(toPath(path, params)).toBe('/page/0');
    });
  });

  describe('PathParams type', () => {
    it('should correctly infer path parameters types', () => {
      type Test1 = PathParams<'/users/:id'>;
      const param1: Test1 = 'id';
      expect(param1).toBe('id');

      type Test2 = PathParams<'/users/:userId/posts/:postId'>;
      const param2: Test2 = 'userId';
      const param3: Test2 = 'postId';
      expect(param2).toBe('userId');
      expect(param3).toBe('postId');
    });
  });
});
