import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('alt-space-value', function () {
  const checkSetup = axe.testUtils.checkSetup;
  const checkContext = axe.testUtils.MockCheckContext();
  const check = checks['alt-space-value'];

  afterEach(function () {
    checkContext.reset();
  });

  it('should return true if alt contains a space character', function () {
    const params = checkSetup('<img id="target" alt=" " />');
    expect(check.evaluate.apply(checkContext, params)).toBe(true);
  });

  it('should return true if alt contains a non-breaking space character', function () {
    const params = checkSetup('<img id="target" alt="&nbsp;" />');
    expect(check.evaluate.apply(checkContext, params)).toBe(true);
  });

  it('should return false if alt attribute is empty', function () {
    const params = checkSetup('<img id="target" alt="" />');
    expect(check.evaluate.apply(checkContext, params)).toBe(false);
  });

  it('should return false if alt attribute has a proper text value', function () {
    const params = checkSetup('<img id="target" alt="text content" />');
    expect(check.evaluate.apply(checkContext, params)).toBe(false);
  });
});
