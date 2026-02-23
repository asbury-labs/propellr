import { describe, it, expect } from 'vitest';
import { fixtureSetup } from '../../../testutils';

declare const axe: any;
describe('table.isHeader', function () {
  const table = axe.commons.table;
  const fixture = document.querySelector('#fixture');

  const tableFixture =
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
    '</table>';

  it('should return true for column headers', function () {
    fixtureSetup(tableFixture);
    const cell = document.querySelector('#ch1');
    expect(table.isHeader(cell)).toBe(true);
  });

  it('should return true if cell is a row header', function () {
    fixtureSetup(tableFixture);
    const cell = document.querySelector('#rh1');
    expect(table.isHeader(cell)).toBe(true);
  });

  it('should return false if cell is not a column or row header', function () {
    fixtureSetup(tableFixture);
    const cell = document.querySelector('#cell1');
    expect(table.isHeader(cell)).toBe(false);
  });

  it('should return true if referenced by another cells headers attr', function () {
    fixture.innerHTML =
      '<table>' +
      '<tr><td id="target">1</td><td headers="bar target foo"></tr>' +
      '</table>';

    const target = document.querySelector('#target');
    fixtureSetup();
    expect(table.isHeader(target)).toBe(true);
  });

  it('should return false otherwise', function () {
    fixture.innerHTML =
      '<table>' +
      '<tr><td id="target">1</td><td headers="bar monkeys foo"></tr>' +
      '</table>';

    const target = document.querySelector('#target');
    fixtureSetup();
    expect(table.isHeader(target)).toBe(false);
  });
});
