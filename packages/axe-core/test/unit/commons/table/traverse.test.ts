import { describe, it, beforeEach, afterEach, expect } from 'vitest';

declare const axe: any;
/* global fixture */
describe('table.traverse', function () {
  const table, dummyTable, topRight, bottomLeft;
  beforeEach(function () {
    table = axe.commons.table;
    dummyTable = [
      ['1a', '1b', '1c'],
      ['2a', '2b', '2c'],
      ['3a', '3b', '3c']
    ];
    topRight = { x: 0, y: 0 };
    bottomLeft = { x: 2, y: 2 };
  });

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('traverses in the `right` direction', function () {
    const iterations = 0;
    const expect = ['1b', '1c'];

    table.traverse({ x: 1, y: 0 }, topRight, dummyTable, function (cell) {
      expect(cell).toBe(expect[iterations]);
      iterations += 1;
    });
    expect(iterations).toBe(expect.length);
  });

  it('returns an array of traversed cells', function () {
    const result = table.traverse({ x: 1, y: 0 }, topRight, dummyTable);
    expect(result).toEqual(['1b', '1c']);
  });

  it('traverses in the `down` direction', function () {
    const iterations = 0;
    const expect = ['2a', '3a'];

    table.traverse({ x: 0, y: 1 }, topRight, dummyTable, function (cell) {
      expect(cell).toBe(expect[iterations]);
      iterations += 1;
    });
    expect(iterations).toBe(expect.length);
  });

  it('traverses in the `left` direction', function () {
    const iterations = 0;
    const expect = ['3b', '3a'];

    table.traverse({ x: -1, y: 0 }, bottomLeft, dummyTable, function (cell) {
      expect(cell).toBe(expect[iterations]);
      iterations += 1;
    });
    expect(iterations).toBe(expect.length);
  });

  it('traverses in the `up` direction', function () {
    const iterations = 0;
    const expect = ['2c', '1c'];

    table.traverse({ x: 0, y: -1 }, bottomLeft, dummyTable, function (cell) {
      expect(cell).toBe(expect[iterations]);
      iterations += 1;
    });
    expect(iterations).toBe(expect.length);
  });

  it('takes string values as directions', function () {
    const iterations = 0;
    const expect = ['1b', '1c'];
    table.traverse('right', topRight, dummyTable, function (cell) {
      expect(cell).toBe(expect[iterations]);
      iterations += 1;
    });

    iterations = 0;
    expect = ['2a', '3a'];
    table.traverse('down', topRight, dummyTable, function (cell) {
      expect(cell).toBe(expect[iterations]);
      iterations += 1;
    });

    iterations = 0;
    expect = ['3b', '3a'];
    table.traverse('left', bottomLeft, dummyTable, function (cell) {
      expect(cell).toBe(expect[iterations]);
      iterations += 1;
    });

    iterations = 0;
    expect = ['2c', '1c'];
    table.traverse('up', bottomLeft, dummyTable, function (cell) {
      expect(cell).toBe(expect[iterations]);
      iterations += 1;
    });
  });

  it('stops when the callback returned true', function () {
    const iterations = 0;
    table.traverse({ x: 1, y: 1 }, topRight, dummyTable, function (cell) {
      expect(cell).toBe('2b'); // or not, to be?
      iterations += 1;
      return true;
    });
    expect(iterations).toBe(1);
  });

  it('starts at top-right of no position is given', function () {
    const iterations = 0;
    const expect = ['1b', '1c'];

    table.traverse({ x: 1, y: 0 }, dummyTable, function (cell) {
      expect(cell).toBe(expect[iterations]);
      iterations += 1;
    });
    expect(iterations).toBe(expect.length);
  });
});
