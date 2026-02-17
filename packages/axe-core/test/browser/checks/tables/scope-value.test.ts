import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('scope-value', function () {
  const fixture = document.getElementById('fixture');

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('should return true if scope is "col"', function () {
    fixture.innerHTML = '<table><tr><td scope="col"></td></tr></table>';
    const node = fixture.querySelector('td');

    expect(axe.testUtils.getCheckEvaluate('scope-value')(node)).toBe(true);
  });

  it('should return true if scope is "row"', function () {
    fixture.innerHTML = '<table><tr><td scope="row"></td></tr></table>';
    const node = fixture.querySelector('td');

    expect(axe.testUtils.getCheckEvaluate('scope-value')(node)).toBe(true);
  });

  it('should return false otherwise', function () {
    fixture.innerHTML =
      '<table><tr><td scope="hahahahanothx"></td></tr></table>';
    const node = fixture.querySelector('td');

    expect(axe.testUtils.getCheckEvaluate('scope-value')(node)).toBe(false);
  });

  it('should support options.values', function () {
    fixture.innerHTML =
      '<table><tr><td scope="hahahahanothx"></td></tr></table>';
    const node = fixture.querySelector('td');

    expect(
      axe.testUtils.getCheckEvaluate('scope-value')(node, {
        values: ['hahahahanothx']
      })
    ).toBe(true);
  });
});
