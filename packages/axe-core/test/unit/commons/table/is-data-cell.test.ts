import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('table.isDataCell', () => {
  const fixture = document.getElementById('fixture');
  const flatTreeSetup = axe.testUtils.flatTreeSetup;

  it('should work with TH', () => {
    fixture.innerHTML =
      '<table>' + '<tr><th id="target">1</th></tr>' + '</table>';
    flatTreeSetup(fixture);

    const target = document.getElementById('target');

    expect(axe.commons.table.isDataCell(target)).toBe(false);
  });

  it('should work with TD', () => {
    fixture.innerHTML =
      '<table>' + '<tr><td id="target">1</td></tr>' + '</table>';
    flatTreeSetup(fixture);

    const target = document.getElementById('target');

    expect(axe.commons.table.isDataCell(target)).toBe(true);
  });

  it('should work with empty TD', () => {
    fixture.innerHTML =
      '<table>' + '<tr><td id="target"></td></tr>' + '</table>';
    flatTreeSetup(fixture);

    const target = document.getElementById('target');

    expect(axe.commons.table.isDataCell(target)).toBe(false);
  });

  it('should ignore TDs with a valid role other than (grid)cell', () => {
    fixture.innerHTML =
      '<table>' +
      '<tr><td id="target1" role="columnheader">heading</td></tr>' +
      '<tr><td id="target2" role="rowheader">heading</td></tr>' +
      '<tr><td id="target3" role="presentation">heading</td></tr>' +
      '</table>';
    flatTreeSetup(fixture);

    const target1 = document.getElementById('target1');
    const target2 = document.getElementById('target2');
    const target3 = document.getElementById('target3');
    expect(axe.commons.table.isDataCell(target1)).toBe(false);
    expect(axe.commons.table.isDataCell(target2)).toBe(false);
    expect(axe.commons.table.isDataCell(target3)).toBe(false);
  });

  it('should return true for elements with role="(grid)cell"', () => {
    fixture.innerHTML =
      '<table>' +
      '<tr><th id="target1" role="cell">heading</th></tr>' +
      '<tr><th id="target2" role="gridcell">heading</th></tr>' +
      '</table>';
    flatTreeSetup(fixture);

    const target1 = document.getElementById('target1');
    const target2 = document.getElementById('target2');
    expect(axe.commons.table.isDataCell(target1)).toBe(true);
    expect(axe.commons.table.isDataCell(target2)).toBe(true);
  });

  it('should ignore invalid roles', () => {
    fixture.innerHTML =
      '<table>' +
      '<tr><td id="target1" role="foobar">heading</td></tr>' +
      '<tr><th id="target2" role="foobar">heading</th></tr>' +
      '</table>';
    flatTreeSetup(fixture);

    const target1 = document.getElementById('target1');
    const target2 = document.getElementById('target2');
    expect(axe.commons.table.isDataCell(target1)).toBe(true);
    expect(axe.commons.table.isDataCell(target2)).toBe(false);
  });

  it('should ignore abstract roles', () => {
    fixture.innerHTML =
      '<table>' +
      '<tr><td id="target1" role="section">heading</td></tr>' +
      '<tr><th id="target2" role="section">heading</th></tr>' +
      '</table>';
    flatTreeSetup(fixture);

    const target1 = document.getElementById('target1');
    const target2 = document.getElementById('target2');
    expect(axe.commons.table.isDataCell(target1)).toBe(true);
    expect(axe.commons.table.isDataCell(target2)).toBe(false);
  });
});
