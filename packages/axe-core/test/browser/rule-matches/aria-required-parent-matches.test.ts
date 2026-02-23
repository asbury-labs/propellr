import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { queryFixture } from '../../testutils';

declare const axe: any;
describe('aria-required-parent-matches', function () {
  const fixture = document.getElementById('fixture');
  let rule;

  beforeEach(function () {
    rule = axe.utils.getRule('aria-required-parent');
  });

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('should return true for a role that requires parent', function () {
    const vNode = queryFixture('<div id="target" role="listitem"></div>');
    expect(rule.matches(null, vNode)).toBe(true);
  });

  it('should return false for a role that does not require parent', function () {
    const vNode = queryFixture('<div id="target" role="alert"></div>');
    expect(rule.matches(null, vNode)).toBe(false);
  });
});
