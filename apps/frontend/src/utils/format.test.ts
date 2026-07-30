import { describe, expect, it } from 'vitest';
import { formatPercent, formatPoints, formatPrice, formatValue } from './format';

describe('formatPrice', () => {
  it('renders cost already in millions — does NOT divide by 10', () => {
    expect(formatPrice(5.5)).toBe('£5.5m');
  });

  it('pads whole-million costs to one decimal place', () => {
    expect(formatPrice(10)).toBe('£10.0m');
  });

  it('pads low-cost players to one decimal place', () => {
    expect(formatPrice(4.0)).toBe('£4.0m');
  });

  it('does not leak float artefacts from the backend division', () => {
    expect(formatPrice(5.500000000000001)).toBe('£5.5m');
  });
});

describe('formatValue', () => {
  it('formats a numeric value to 2 decimal places by default', () => {
    expect(formatValue(3.14159)).toBe('3.14');
  });

  it('respects custom digit count', () => {
    expect(formatValue(3.14159, 1)).toBe('3.1');
  });

  it('renders null as an em-dash — NOT as 0', () => {
    expect(formatValue(null)).toBe('—');
  });

  it('renders undefined as an em-dash — NOT as 0', () => {
    expect(formatValue(undefined)).toBe('—');
  });

  it('renders zero as "0.00" (zero is a valid value)', () => {
    expect(formatValue(0)).toBe('0.00');
  });
});

describe('formatPoints', () => {
  it('formats integer points', () => {
    expect(formatPoints(142)).toBe('142');
  });

  it('rounds float points', () => {
    expect(formatPoints(142.7)).toBe('143');
  });
});

describe('formatPercent', () => {
  it('formats a percentage with one decimal', () => {
    expect(formatPercent(45.3)).toBe('45.3%');
  });

  it('formats 100%', () => {
    expect(formatPercent(100)).toBe('100.0%');
  });
});
