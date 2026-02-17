import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('axe.utils.parseTabindex', () => {
  it('should return 0 for "0"', () => {
    expect(axe.utils.parseTabindex('0')).toBe(0);
  });

  it('should return 1 for "+1"', () => {
    expect(axe.utils.parseTabindex('+1')).toBe(1);
  });

  it('should return -1 for "-1"', () => {
    expect(axe.utils.parseTabindex('-1')).toBe(-1);
  });

  it('should return null for null', () => {
    expect(axe.utils.parseTabindex(null)).toBe(null);
  });

  it('should return null for an empty string', () => {
    expect(axe.utils.parseTabindex('')).toBe(null);
  });

  it('should return null for a whitespace string', () => {
    expect(axe.utils.parseTabindex('   ')).toBe(null);
  });

  it('should return null for non-numeric strings', () => {
    expect(axe.utils.parseTabindex('abc')).toBe(null);
  });

  it('should return the first valid digit(s) for decimal numbers', () => {
    expect(axe.utils.parseTabindex('2.5')).toBe(2);
  });

  it('should return 123 for "123abc"', () => {
    expect(axe.utils.parseTabindex('123abc')).toBe(123);
  });
});
