import { describe, it, expect } from 'vitest';
import { parseIntParam } from '../app/params';

describe('parseIntParam', () => {
  it('parses a valid integer string', () => {
    expect(parseIntParam('42', 'id')).toBe(42);
  });

  it('parses zero', () => {
    expect(parseIntParam('0', 'id')).toBe(0);
  });

  it('parses negative integer', () => {
    expect(parseIntParam('-5', 'id')).toBe(-5);
  });

  it('throws 400 for a non-numeric string', () => {
    expect(() => parseIntParam('abc', 'id')).toThrow();
    try {
      parseIntParam('abc', 'id');
    } catch (err: unknown) {
      expect((err as { getStatus?: () => number }).getStatus?.()).toBe(400);
    }
  });

  it('throws 400 for a float string', () => {
    expect(() => parseIntParam('1.5', 'id')).toThrow();
    try {
      parseIntParam('1.5', 'count');
    } catch (err: unknown) {
      expect((err as { getStatus?: () => number }).getStatus?.()).toBe(400);
    }
  });

  it('throws 400 for an empty string', () => {
    expect(() => parseIntParam('', 'gw')).toThrow();
  });

  it('error message includes the param name', () => {
    try {
      parseIntParam('xyz', 'teamId');
    } catch (err: unknown) {
      expect((err as Error).message).toContain('teamId');
    }
  });
});
