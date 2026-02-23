import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('color.centerPointOfRect', function () {
  it('returns `undefined` when element is placed outside of viewport (left position > window dimension)', function () {
    const actual = axe.commons.color.centerPointOfRect({
      left: 9999,
      top: 0,
      width: 200,
      height: 100
    });
    expect(actual).toBeUndefined();
  });

  it('returns `{x,y}` when element is with in viewport', function () {
    const actual = axe.commons.color.centerPointOfRect({
      left: 0,
      top: 0,
      width: 200,
      height: 100
    });
    expect(actual).toBeDefined();
    expect(Object.keys(actual).sort()).toEqual(['x', 'y'].sort());
  });

  it('returns `{x,y}` when element is with in viewport (check returned coordinate values)', function () {
    const actual = axe.commons.color.centerPointOfRect({
      left: 100,
      top: 100,
      width: 250,
      height: 250
    });

    expect(actual).toBeDefined();
    expect(Object.keys(actual).sort()).toEqual(['x', 'y'].sort());
    expect(actual.x).toBe(225);
    expect(actual.y).toBe(225);
  });
});
