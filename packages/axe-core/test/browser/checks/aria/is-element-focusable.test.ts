import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('is-element-focusable', function () {
  const checkSetup = axe.testUtils.checkSetup;
  const checkContext = axe.testUtils.MockCheckContext();
  const isFocusable = axe.testUtils.getCheckEvaluate('is-element-focusable');

  afterEach(function () {
    checkContext.reset();
  });

  it('should return true for div with a tabindex', function () {
    const params = checkSetup('<div tabIndex="1" id="target"></div>');
    expect(isFocusable.apply(checkContext, params)).toBe(true);
  });

  it('should return false for natively unfocusable element', function () {
    const params = checkSetup('<span role="link" href="#" id="target"></span>');
    expect(isFocusable.apply(checkContext, params)).toBe(false);
  });
});
