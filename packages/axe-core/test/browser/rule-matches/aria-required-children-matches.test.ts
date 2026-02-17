import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
describe('aria-required-children-matches', function () {
  const fixture = document.getElementById('fixture');
  const queryFixture = axe.testUtils.queryFixture;
  let rule;

  beforeEach(function () {
    rule = axe.utils.getRule('aria-required-children');
  });

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('should return true for a role that requires children', function () {
    const vNode = queryFixture('<div id="target" role="list"></div>');
    expect(rule.matches(null, vNode)).toBe(true);
  });

  it('should return false for a role that does not require children', function () {
    const vNode = queryFixture('<div id="target" role="alert"></div>');
    expect(rule.matches(null, vNode)).toBe(false);
  });
});
