import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('has-alt', function () {
  const fixture = document.getElementById('fixture');
  const checkSetup = axe.testUtils.checkSetup;

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('should return true if an alt is present', function () {
    const checkArgs = checkSetup('<img id="target" alt="woohoo" />');
    expect(
      axe.testUtils.getCheckEvaluate('has-alt').apply(null, checkArgs)
    ).toBe(true);
  });

  it('should return true if an empty alt is present', function () {
    const checkArgs = checkSetup('<img id="target" alt="" />');
    expect(
      axe.testUtils.getCheckEvaluate('has-alt').apply(null, checkArgs)
    ).toBe(true);
  });

  it('should return true if a null alt is present', function () {
    const checkArgs = checkSetup('<img id="target" alt />');
    expect(
      axe.testUtils.getCheckEvaluate('has-alt').apply(null, checkArgs)
    ).toBe(true);
  });

  it('should return false if an alt is not present', function () {
    const checkArgs = checkSetup('<img id="target" />');
    expect(
      axe.testUtils.getCheckEvaluate('has-alt').apply(null, checkArgs)
    ).toBe(false);
  });
});
