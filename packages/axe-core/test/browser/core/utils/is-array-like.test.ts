import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('axe.utils.isArrayLike', () => {
  const isArrayLike = axe.utils.isArrayLike;

  it('is true for an array', () => {
    expect(isArrayLike([])).toBe(true);
  });

  it('is true for an array-like object', () => {
    expect(isArrayLike({ length: 1 })).toBe(true);
  });

  it('is false for strings (which also have .length)', () => {
    expect(isArrayLike('string')).toBe(false);
  });

  it('is false for a Node with .length', () => {
    const div = document.createElement('div');
    div.length = 123;
    expect(isArrayLike(div)).toBe(false);
  });

  it('is false for non-array-like objects', () => {
    expect(isArrayLike({})).toBe(false);
    expect(isArrayLike(null)).toBe(false);
    expect(isArrayLike(undefined)).toBe(false);
    expect(isArrayLike(1)).toBe(false);
    expect(isArrayLike(true)).toBe(false);
    expect(isArrayLike(false)).toBe(false);
  });
});
