import { describe, it, expect, beforeEach } from 'vitest';

declare const axe: any;
describe('aria-allowed-attr-matches', function () {
  const queryFixture = axe.testUtils.queryFixture;
  let rule;

  beforeEach(function () {
    rule = axe.utils.getRule('aria-allowed-attr');
  });

  it('should return true on elements that have aria attributes', function () {
    const vNode = queryFixture(
      '<div role="button" id="target" aria-label="Thing 1" aria-mccheddarton="Unsupported thing 2"></div>'
    );

    expect(rule.matches(null, vNode)).toBe(true);
  });

  it('should return false on elements that have no aria attributes', function () {
    const vNode = queryFixture('<div role="button" id="target"></div>');

    expect(rule.matches(null, vNode)).toBe(false);
  });
});
