import {
  normalizePosition,
  CanonicalPositions,
} from '@fpl/contracts/self-service';
import { describe, it, expect } from 'vitest';

describe('normalizePosition', () => {
  describe('exact canonical keys', () => {
    it.each(CanonicalPositions)('returns %s for %s', (pos) => {
      expect(normalizePosition(pos)).toBe(pos);
    });
  });

  describe('singular aliases', () => {
    it('goalkeeper → Goalkeepers', () => {
      expect(normalizePosition('goalkeeper')).toBe('Goalkeepers');
    });

    it('defender → Defenders', () => {
      expect(normalizePosition('defender')).toBe('Defenders');
    });

    it('midfielder → Midfielders', () => {
      expect(normalizePosition('midfielder')).toBe('Midfielders');
    });

    it('forward → Forwards', () => {
      expect(normalizePosition('forward')).toBe('Forwards');
    });
  });

  describe('short aliases', () => {
    it('gk → Goalkeepers', () => {
      expect(normalizePosition('gk')).toBe('Goalkeepers');
    });

    it('def → Defenders', () => {
      expect(normalizePosition('def')).toBe('Defenders');
    });

    it('mid → Midfielders', () => {
      expect(normalizePosition('mid')).toBe('Midfielders');
    });

    it('fwd → Forwards', () => {
      expect(normalizePosition('fwd')).toBe('Forwards');
    });
  });

  describe('case insensitivity', () => {
    it('GOALKEEPER → Goalkeepers', () => {
      expect(normalizePosition('GOALKEEPER')).toBe('Goalkeepers');
    });

    it('Midfielders → Midfielders', () => {
      expect(normalizePosition('Midfielders')).toBe('Midfielders');
    });

    it('DEFENDERS → Defenders', () => {
      expect(normalizePosition('DEFENDERS')).toBe('Defenders');
    });
  });

  describe('unknown values', () => {
    it('returns undefined for unknown position', () => {
      expect(normalizePosition('winger')).toBeUndefined();
    });

    it('returns undefined for empty string', () => {
      expect(normalizePosition('')).toBeUndefined();
    });

    it('returns undefined for numeric string', () => {
      expect(normalizePosition('1')).toBeUndefined();
    });
  });
});
