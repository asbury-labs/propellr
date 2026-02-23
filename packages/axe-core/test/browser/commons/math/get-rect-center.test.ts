import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('getRectCenter', () => {
  const getRectCenter = axe.commons.math.getRectCenter;

  it('returns the center point of a rect', () => {
    const rect = new DOMRect(10, 20, 10, 20);
    const center = new DOMPoint(15, 30);
    expect(getRectCenter(rect)).toEqual(center);
  });
});
