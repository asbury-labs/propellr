import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('splitRects', () => {
  const splitRects = axe.commons.math.splitRects;

  it('returns the original rect if there is no clipping rect', () => {
    const rectA = new DOMRect(0, 0, 100, 50);
    const rects = splitRects(rectA, []);
    expect(rects).toHaveLength(1);
    expect(rects[0]).toEqual(rectA);
  });

  it('returns the original rect if there is no overlap', () => {
    const rectA = new DOMRect(0, 0, 100, 50);
    const rectB = new DOMRect(0, 50, 50, 50);
    const rects = splitRects(rectA, [rectB]);
    expect(rects).toHaveLength(1);
    expect(rects[0]).toEqual(rectA);
  });

  it('throws if there are too many overlapping rects', () => {
    const rects = [];
    for (let i = 0; i < 100; i++) {
      rects.push(new DOMRect(i, i, 50, 50));
    }
    const rectA = new DOMRect(0, 0, 1000, 1000);

    expect(() => {
      splitRects(rectA, rects);
    }).toThrow('splitRects: Too many rects');
  });

  describe('with one overlapping rect', () => {
    it('returns one rect if overlaps covers two corners', () => {
      const rectA = new DOMRect(0, 0, 100, 50);
      const rectB = new DOMRect(40, 0, 100, 50);
      const rects = splitRects(rectA, [rectB]);
      expect(rects).toHaveLength(1);
      expect(rects[0]).toEqual(new DOMRect(0, 0, 40, 50));
    });

    it('returns two rects if overlap covers one corner', () => {
      const rectA = new DOMRect(0, 0, 100, 100);
      const rectB = new DOMRect(50, 50, 50, 50);
      const rects = splitRects(rectA, [rectB]);
      expect(rects).toHaveLength(2);
      expect(rects[0]).toEqual(new DOMRect(0, 0, 100, 50));
      expect(rects[1]).toEqual(new DOMRect(0, 0, 50, 100));
    });

    it('returns three rects if overlap covers an edge, but no corner', () => {
      const rectA = new DOMRect(0, 0, 100, 150);
      const rectB = new DOMRect(50, 50, 50, 50);
      const rects = splitRects(rectA, [rectB]);
      expect(rects).toHaveLength(3);
      expect(rects[0]).toEqual(new DOMRect(0, 0, 100, 50));
      expect(rects[1]).toEqual(new DOMRect(0, 100, 100, 50));
      expect(rects[2]).toEqual(new DOMRect(0, 0, 50, 150));
    });

    it('returns four rects if overlap sits in the middle, touching no corner', () => {
      const rectA = new DOMRect(0, 0, 150, 150);
      const rectB = new DOMRect(50, 50, 50, 50);
      const rects = splitRects(rectA, [rectB]);
      expect(rects).toHaveLength(4);
      expect(rects[0]).toEqual(new DOMRect(0, 0, 150, 50));
      expect(rects[1]).toEqual(new DOMRect(100, 0, 50, 150));
      expect(rects[2]).toEqual(new DOMRect(0, 100, 150, 50));
      expect(rects[3]).toEqual(new DOMRect(0, 0, 50, 150));
    });

    it('returns no rects if overlap covers the entire input rect', () => {
      const rectA = new DOMRect(0, 0, 100, 50);
      const rectB = new DOMRect(-50, -50, 400, 400);
      const rects = splitRects(rectA, [rectB]);
      expect(rects).toHaveLength(0);
    });
  });

  describe('with multiple overlaps', () => {
    it('can return a single rect two overlaps each cover an edge', () => {
      const rectA = new DOMRect(0, 0, 150, 50);
      const rectB = new DOMRect(0, 0, 50, 50);
      const rectC = new DOMRect(100, 0, 50, 50);
      const rects = splitRects(rectA, [rectB, rectC]);
      expect(rects).toHaveLength(1);
      expect(rects[0]).toEqual(new DOMRect(50, 0, 50, 50));
    });

    it('can recursively clips regions', () => {
      const rectA = new DOMRect(0, 0, 150, 100);
      const rectB = new DOMRect(0, 50, 50, 50);
      const rectC = new DOMRect(100, 50, 50, 50);
      const rects = splitRects(rectA, [rectB, rectC]);
      expect(rects).toHaveLength(3);
      expect(rects[0]).toEqual(new DOMRect(0, 0, 150, 50));
      expect(rects[1]).toEqual(new DOMRect(50, 0, 100, 50));
      expect(rects[2]).toEqual(new DOMRect(50, 0, 50, 100));
    });

    it('returns no rects if overlap covers the entire input rect', () => {
      const rectA = new DOMRect(0, 0, 100, 50);
      const rectB = new DOMRect(50, 50, 200, 200);
      const rectC = new DOMRect(-50, -50, 200, 200);
      const rects = splitRects(rectA, [rectB, rectC]);
      expect(rects).toHaveLength(0);
    });
  });
});
