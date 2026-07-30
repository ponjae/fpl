import { describe, expect, it } from 'vitest';
import { getPositionLabel, getPositionShortLabel } from './position';

describe('getPositionLabel', () => {
  it('returns Goalkeeper for element_type 1', () => {
    expect(getPositionLabel(1)).toBe('Goalkeeper');
  });

  it('returns Defender for element_type 2', () => {
    expect(getPositionLabel(2)).toBe('Defender');
  });

  it('returns Midfielder for element_type 3', () => {
    expect(getPositionLabel(3)).toBe('Midfielder');
  });

  it('returns Forward for element_type 4', () => {
    expect(getPositionLabel(4)).toBe('Forward');
  });

  it('returns Unknown for unrecognised element_type', () => {
    expect(getPositionLabel(99)).toBe('Unknown');
  });
});

describe('getPositionShortLabel', () => {
  it('returns GK for element_type 1', () => {
    expect(getPositionShortLabel(1)).toBe('GK');
  });

  it('returns DEF for element_type 2', () => {
    expect(getPositionShortLabel(2)).toBe('DEF');
  });

  it('returns MID for element_type 3', () => {
    expect(getPositionShortLabel(3)).toBe('MID');
  });

  it('returns FWD for element_type 4', () => {
    expect(getPositionShortLabel(4)).toBe('FWD');
  });

  it('returns FWD as fallback for unrecognised element_type', () => {
    expect(getPositionShortLabel(99)).toBe('FWD');
  });
});
