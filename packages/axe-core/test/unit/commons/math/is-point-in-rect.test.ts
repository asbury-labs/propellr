import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('isPointInRect', () => {
  const isPointInRect = axe.commons.math.isPointInRect;

  it('returns true when the point is inside the rect', () => {
    const rect = new DOMRect(10, 20, 10, 20);
    const point = new DOMPoint(15, 30);
    expect(isPointInRect(point, rect)).toBe(true);
  });

  it('returns true when the point is on the edge', () => {
    const rect = new DOMRect(10, 20, 10, 20);
    expect(isPointInRect(new DOMPoint(10, 20), rect)).toBe(true);
    expect(isPointInRect(new DOMPoint(20, 40), rect)).toBe(true);
  });

  it('returns false when the point is vertically outside the rect', () => {
    const rect = new DOMRect(10, 20, 10, 20);
    const point = new DOMPoint(15, 50);
    expect(isPointInRect(point, rect)).toBe(false);
  });

  it('returns false when the point is horizontally outside the rect', () => {
    const rect = new DOMRect(10, 20, 10, 20);
    const point = new DOMPoint(25, 30);
    expect(isPointInRect(point, rect)).toBe(false);
  });
});
