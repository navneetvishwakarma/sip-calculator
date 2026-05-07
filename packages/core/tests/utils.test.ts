import { describe, it, expect } from 'vitest';
import { monthlyRate, formatINR } from '../src/utils';

describe('monthlyRate', () => {
  it('converts 12% annual to 0.01 monthly', () => {
    expect(monthlyRate(12)).toBeCloseTo(0.01, 10);
  });
  it('converts 0% annual to 0', () => {
    expect(monthlyRate(0)).toBe(0);
  });
});

describe('formatINR', () => {
  it('formats zero', () => expect(formatINR(0)).toBe('₹0'));
  it('formats sub-10L with Indian grouping', () => {
    expect(formatINR(50000)).toBe('₹50,000');
    expect(formatINR(999999)).toBe('₹9,99,999');
  });
  it('switches to Lakh at 10L threshold (OQ-2)', () => {
    expect(formatINR(1000000)).toBe('₹10 Lakh');
    expect(formatINR(1250000)).toBe('₹12.5 Lakh');
  });
  it('switches to Crore at 1Cr threshold', () => {
    expect(formatINR(10000000)).toBe('₹1 Crore');
    expect(formatINR(12345678)).toBe('₹1.23 Crore');
  });
  it('handles negative values', () => {
    expect(formatINR(-1000000)).toBe('-₹10 Lakh');
  });
});
