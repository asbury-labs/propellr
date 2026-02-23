import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('dom.getViewportSize', function () {
  it('should return an object with width and height', function () {
    const result = axe.commons.dom.getViewportSize(window);

    expect(result).toHaveProperty('width');
    expect(result).toHaveProperty('height');

    expect(typeof result.width).toBe('number');
    expect(typeof result.height).toBe('number');
  });

  it('should have some fallbacks for old browsers', function () {
    const result = axe.commons.dom.getViewportSize({
      document: {},
      innerWidth: 12,
      innerHeight: 47
    });

    expect(result.width).toBe(12);
    expect(result.height).toBe(47);

    result = axe.commons.dom.getViewportSize({
      document: {
        documentElement: {
          clientWidth: 13,
          clientHeight: 48
        }
      }
    });

    expect(result.width).toBe(13);
    expect(result.height).toBe(48);

    result = axe.commons.dom.getViewportSize({
      document: {
        body: {
          clientWidth: 22,
          clientHeight: 41
        }
      }
    });

    expect(result.width).toBe(22);
    expect(result.height).toBe(41);
  });
});
