import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('doc-has-title', function () {
  const fixture = document.getElementById('fixture');

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('should return false if title is empty', function () {
    const orig = document.title;
    document.title = '';
    expect(axe.testUtils.getCheckEvaluate('doc-has-title')(fixture)).toBe(
      false
    );
    document.title = orig;
  });

  it('should return false if title contains only whitespace', function () {
    const orig = document.title;
    document.title = ' \t\r\n \n   \r \n\t';
    expect(axe.testUtils.getCheckEvaluate('doc-has-title')(fixture)).toBe(
      false
    );
    document.title = orig;
  });

  it('should return true if title is non-empty', function () {
    const orig = document.title;
    document.title = 'Bananas';

    expect(axe.testUtils.getCheckEvaluate('doc-has-title')(fixture)).toBe(true);
    document.title = orig;
  });
});
