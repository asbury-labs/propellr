import { describe, it, afterEach, expect } from 'vitest';

declare const axe: any;
//@todo better coverage
describe('dom.getElementCoordinates', function () {
  const fixture = document.getElementById('fixture');

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('should calculate bounding box based on element position', function () {
    const el, coords;

    fixture.innerHTML =
      '<div id="div" style="position: absolute; top: -1px; left: -1px;">' +
      '<span id="coords0" style="position:absolute; top: -999px; left: -999px; width: 1000px; height: 1000px;">' +
      'Absolute</span>' +
      '</div>';

    el = document.getElementById('coords0');
    coords = axe.commons.dom.getElementCoordinates(el);
    expect(coords.left).toBeCloseTo(-1000, 0.5);
    expect(coords.top).toBeCloseTo(-1000, 0.5);
    expect(coords.width).toBeCloseTo(1000, 0.5);
    expect(coords.height).toBeCloseTo(1000, 0.5);
    expect(coords.right).toBeCloseTo(0, 0.5);
    expect(coords.bottom).toBeCloseTo(0, 0.5);

    el = document.getElementById('div');
    coords = axe.commons.dom.getElementCoordinates(el);
    expect(Math.round(coords.left)).toBe(-1);
    expect(Math.round(coords.top)).toBe(-1);
  });

  it('should take into account scroll offsets', function () {
    const el,
      coords,
      offset = axe.commons.dom.getScrollOffset(window.document);

    fixture.innerHTML =
      '<div id="div" style="position: absolute; top: -1px; left: -1px;">' +
      '<span id="coords0" style="position:absolute; top: -999px; left: -999px; width: 1000px; height: 1000px;">' +
      'Absolute</span>' +
      '</div>';

    el = document.getElementById('coords0');
    coords = axe.commons.dom.getElementCoordinates(el);
    expect(coords.left).toBeCloseTo(-1000, 0.5);
    expect(coords.top).toBeCloseTo(-1000, 0.5);
    expect(coords.width).toBeCloseTo(1000, 0.5);
    expect(coords.height).toBeCloseTo(1000, 0.5);
    expect(coords.right).toBeCloseTo(0, 0.5);
    expect(coords.bottom).toBeCloseTo(0, 0.5);

    window.scrollTo(0, 150);
    coords = axe.commons.dom.getElementCoordinates(el);
    expect(coords.left).toBeCloseTo(-1000, 0.5);
    expect(coords.top).toBeCloseTo(-1000, 0.5);
    expect(coords.width).toBeCloseTo(1000, 0.5);
    expect(coords.height).toBeCloseTo(1000, 0.5);
    expect(coords.right).toBeCloseTo(0, 0.5);
    expect(coords.bottom).toBeCloseTo(0, 0.5);

    window.scrollTo(offset.left, offset.top);
  });
});
