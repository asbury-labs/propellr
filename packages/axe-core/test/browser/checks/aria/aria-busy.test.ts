import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('aria-busy', function () {
  const checkContext = axe.testUtils.MockCheckContext();
  const checkSetup = axe.testUtils.checkSetup;
  const checkEvaluate = axe.testUtils.getCheckEvaluate('aria-busy');

  afterEach(function () {
    checkContext.reset();
  });

  it('should return false if no aria-busy tag on element', function () {
    const params = checkSetup('<div id="target" role="list"></div>');
    expect(checkEvaluate.apply(checkContext, params)).toBe(false);
  });

  it('should return false if aria-busy is set to false', function () {
    const params = checkSetup(
      '<div id="target" role="list" aria-busy="false"></div>'
    );
    expect(checkEvaluate.apply(checkContext, params)).toBe(false);
  });

  it('should return true if aria-busy is set to true', function () {
    const params = checkSetup(
      '<div id="target" role="list" aria-busy="true"></div>'
    );
    expect(checkEvaluate.apply(checkContext, params)).toBe(true);
  });
});
