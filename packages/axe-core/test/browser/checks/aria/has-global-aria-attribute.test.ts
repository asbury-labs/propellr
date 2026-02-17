import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('has-global-aria-attribute', function () {
  const checkSetup = axe.testUtils.checkSetup;
  const checkContext = axe.testUtils.MockCheckContext();
  const hasGlobalAriaAttribute = axe.testUtils.getCheckEvaluate(
    'has-global-aria-attribute'
  );

  afterEach(function () {
    checkContext.reset();
  });

  it('should return true if any global ARIA attributes are found', function () {
    const params = checkSetup('<div aria-label="hello" id="target"></div>');
    expect(hasGlobalAriaAttribute.apply(checkContext, params)).toBe(true);
  });

  it('should return false if no valid ARIA attributes are found', function () {
    const params = checkSetup('<div aria-random="hello" id="target"></div>');
    expect(hasGlobalAriaAttribute.apply(checkContext, params)).toBe(false);
  });
});
