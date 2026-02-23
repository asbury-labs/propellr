import { describe, it, expect, beforeEach } from 'vitest';
import { queryFixture, fixtureSetup } from '../../testutils';

declare const axe: any;
describe('aria-has-attr-matches', function () {
  let rule;

  beforeEach(function () {
    rule = axe.utils.getRule('aria-valid-attr-value');
  });

  it('should return false if an element has no attributes', function () {
    const vNode = fixtureSetup('<div></div>');
    expect(rule.matches(null, vNode)).toBe(false);
  });

  it('should return false if an element has no ARIA attributes', function () {
    const vNode = queryFixture('<div id="target"></div>');
    expect(rule.matches(null, vNode)).toBe(false);
  });
  it('should return true if an element has ARIA attributes', function () {
    const vNode = queryFixture('<div id="target" aria-bats="monkeys"></div>');
    expect(rule.matches(null, vNode)).toBe(true);
  });
});
