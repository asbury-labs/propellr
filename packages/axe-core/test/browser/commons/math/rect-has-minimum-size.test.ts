import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('rectHasMinimumSize', () => {
  const rectHasMinimumSize = axe.commons.math.rectHasMinimumSize;

  it('returns true if rect is large enough', () => {
    const rect = new DOMRect(10, 20, 10, 20);
    expect(rectHasMinimumSize(10, rect)).toBe(true);
  });

  it('returns true for rounding margin', () => {
    const rect = new DOMRect(10, 20, 9.95, 20);
    expect(rectHasMinimumSize(10, rect)).toBe(true);
  });

  it('returns false if width is too small', () => {
    const rect = new DOMRect(10, 20, 5, 20);
    expect(rectHasMinimumSize(10, rect)).toBe(false);
  });

  it('returns false if height is too small', () => {
    const rect = new DOMRect(10, 20, 10, 5);
    expect(rectHasMinimumSize(10, rect)).toBe(false);
  });

  it('returns false when below rounding margin', () => {
    const rect = new DOMRect(10, 20, 9.94, 20);
    expect(rectHasMinimumSize(10, rect)).toBe(false);
  });
});
