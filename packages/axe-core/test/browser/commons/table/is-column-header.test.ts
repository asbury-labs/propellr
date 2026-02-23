import { describe, it, beforeEach, expect } from 'vitest';
import { fixtureSetup } from '../../../testutils';

declare const axe: any;
describe('table.isColumnHeader', function () {
  const table = axe.commons.table;

  beforeEach(function () {
    fixtureSetup(
      '<table>' +
        '<tr>' +
        '<th id="ch1">column header 1</th>' +
        '<th scope="col" id="ch2">column header 2</th>' +
        '</tr>' +
        '<tr>' +
        '<th id="rh1">row header 1</th>' +
        '<td id="cell1">cell 1</td>' +
        '</tr>' +
        '<tr>' +
        '<th scope="row" id="rh2">row header 2</th>' +
        '<td id="cell2">cell 2</td>' +
        '</tr>' +
        '</table>'
    );
  });

  it('returns false if not a column header', function () {
    const cell = document.querySelector('#cell1');
    expect(table.isColumnHeader(cell)).toBe(false);
  });

  it('returns true if scope="auto"', function () {
    const cell = document.querySelector('#ch1');
    expect(table.isColumnHeader(cell)).toBe(true);
  });

  it('returns true if scope="col"', function () {
    const cell = document.querySelector('#ch2');
    expect(table.isColumnHeader(cell)).toBe(true);
  });

  it('returns false if scope="row"', function () {
    const cell = document.querySelector('#rh2');
    expect(table.isColumnHeader(cell)).toBe(false);
  });
});
