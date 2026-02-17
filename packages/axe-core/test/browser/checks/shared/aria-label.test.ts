import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('aria-label', function () {
  const fixture = document.getElementById('fixture');
  const checkSetup = axe.testUtils.checkSetup;

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('should return true if an aria-label is present', function () {
    const checkArgs = checkSetup('<div id="target" aria-label="woohoo"></div>');
    expect(
      axe.testUtils.getCheckEvaluate('aria-label').apply(null, checkArgs)
    ).toBe(true);
  });

  it('should return false if an aria-label is not present', function () {
    const checkArgs = checkSetup('<div id="target"></div>');
    expect(
      axe.testUtils.getCheckEvaluate('aria-label').apply(null, checkArgs)
    ).toBe(false);
  });

  it('should return false if an aria-label is present, but empty', function () {
    const checkArgs = checkSetup('<div id="target" aria-label=" "></div>');
    expect(
      axe.testUtils.getCheckEvaluate('aria-label').apply(null, checkArgs)
    ).toBe(false);
  });

  it('should collapse whitespace', function () {
    const checkArgs = checkSetup(
      '<div id="target" aria-label=" \t \n \r \t  \t\r\n "></div>'
    );
    expect(
      axe.testUtils.getCheckEvaluate('aria-label').apply(null, checkArgs)
    ).toBe(false);
  });
});
