import { describe, it, afterEach, expect } from 'vitest';
import { queryFixture } from '../../../testutils';

declare const axe: any;
describe('color.getOwnBackgroundColor', function () {
  const fixture = document.getElementById('fixture');
  const getOwnBackgroundColor = axe.commons.color.getOwnBackgroundColor;

  afterEach(function () {
    fixture.innerHTML = '';
    axe._tree = undefined;
  });

  it('returns `new axe.commons.color.Color` instance when no background is set', function () {
    const vNode = queryFixture(
      '<div id="target" style="height: 40px; width: 30px;">' + '</div>'
    );
    const actual = getOwnBackgroundColor(
      window.getComputedStyle(vNode.actualNode)
    );
    expect(actual.red).toBe(0);
    expect(actual.green).toBe(0);
    expect(actual.blue).toBe(0);
    expect(actual.alpha).toBe(0);
  });

  it('returns color with rgba values of specified background-color value', function () {
    const vNode = queryFixture(
      '<div id="target" style="height: 40px; width: 30px; background-color: pink;">' +
        '</div>'
    );
    const actual = getOwnBackgroundColor(
      window.getComputedStyle(vNode.actualNode)
    );
    expect(actual.red).toBe(255);
    expect(actual.green).toBe(192);
    expect(actual.blue).toBe(203);
    expect(actual.alpha).toBe(1);
  });

  it('returns color with rgba values and alpha', function () {
    const vNode = queryFixture(
      '<div id="target" style="height: 20px; width: 15px; background-color: rgba(0, 128, 0, 0.5);">' +
        '</div>'
    );
    const actual = getOwnBackgroundColor(
      window.getComputedStyle(vNode.actualNode)
    );
    expect(actual.red).toBe(0);
    expect(actual.green).toBe(128);
    expect(actual.blue).toBe(0);
    expect(actual.alpha).toBe(0.5);
  });

  it('returns color with rgba values and opacity (for blending)', function () {
    const vNode = queryFixture(
      '<div id="target" style="height: 20px; width: 15px; opacity: 0.5; background-color: green;">' +
        '</div>'
    );
    const actual = getOwnBackgroundColor(
      window.getComputedStyle(vNode.actualNode)
    );
    expect(actual.red).toBe(0);
    expect(actual.green).toBe(128);
    expect(actual.blue).toBe(0);
    expect(actual.alpha).toBe(0.5);
  });

  it('returns color with rgba values, alpha and opacity', function () {
    const vNode = queryFixture(
      '<div id="target" style="height: 20px; width: 15px; opacity: 0.5; background-color: rgba(0, 128, 0, 0.5);">' +
        '</div>'
    );
    const actual = getOwnBackgroundColor(
      window.getComputedStyle(vNode.actualNode)
    );
    expect(actual.red).toBe(0);
    expect(actual.green).toBe(128);
    expect(actual.blue).toBe(0);
    expect(actual.alpha).toBe(0.25);
  });
});
