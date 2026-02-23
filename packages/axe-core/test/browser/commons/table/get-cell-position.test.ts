import { describe, it, afterEach, expect } from 'vitest';
import { flatTreeSetup } from '../../../testutils';

declare const axe: any;
describe('table.getCellPosition', function () {
  const fixture = document.getElementById('fixture');

  afterEach(function () {
    fixture.innerHTML = '';
    axe._tree = undefined;
  });

  it('should get x, y coordinates given a cell', function () {
    fixture.innerHTML =
      '<table>' +
      '<tr><td></td><td></td><td></td></tr>' +
      '<tr><td></td><td id="target"></td><td></td></tr>' +
      '<tr><td></td><td></td><td></td></tr>' +
      '</table>';

    const target = document.getElementById('target');

    flatTreeSetup(fixture.firstChild);
    expect(axe.commons.table.getCellPosition(target)).toEqual({
      x: 1,
      y: 1
    });
  });

  it('should handle colspans', function () {
    fixture.innerHTML =
      '<table>' +
      '<tr><td></td><td></td><td></td></tr>' +
      '<tr><td colspan="2"></td><td id="target"></td></tr>' +
      '<tr><td></td><td></td><td></td></tr>' +
      '</table>';

    const target = document.getElementById('target');

    flatTreeSetup(fixture.firstChild);
    expect(axe.commons.table.getCellPosition(target)).toEqual({
      x: 2,
      y: 1
    });
  });

  it('should handle rowspans', function () {
    fixture.innerHTML =
      '<table>' +
      '<tr><td rowspan="2"></td><td></td><td></td></tr>' +
      '<tr><td></td><td id="target"></td></tr>' +
      '<tr><td></td><td></td><td></td></tr>' +
      '</table>';

    const target = document.getElementById('target');

    flatTreeSetup(fixture.firstChild);
    expect(axe.commons.table.getCellPosition(target)).toEqual({
      x: 2,
      y: 1
    });
  });

  it('should handle rowspans and colspans', function () {
    fixture.innerHTML =
      '<table>' +
      '<tr><td rowspan="2" colspan="2"></td><td></td></tr>' +
      '<tr><td id="target"></td></tr>' +
      '<tr><td></td><td></td><td></td></tr>' +
      '</table>';

    const target = document.getElementById('target');

    flatTreeSetup(fixture.firstChild);
    expect(axe.commons.table.getCellPosition(target)).toEqual({
      x: 2,
      y: 1
    });
  });

  it('should handle intermittent empty rows', function () {
    fixture.innerHTML =
      '<table>' +
      '<tr><td></td><td></td><td></td></tr>' +
      '<tr></tr>' +
      '<tr><td></td><td id="target"></td><td></td></tr>' +
      '<tr><td></td><td></td><td></td></tr>' +
      '<tr></tr>' +
      '</table>';

    const target = document.getElementById('target');

    flatTreeSetup(fixture.firstChild);
    expect(axe.commons.table.getCellPosition(target)).toEqual({
      x: 1,
      y: 2
    });
  });
});
