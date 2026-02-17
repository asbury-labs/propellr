import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
describe('nested-interactive-matches', function () {
  const fixture = document.querySelector('#fixture');
  const queryFixture = axe.testUtils.queryFixture;
  let rule;

  beforeEach(function () {
    rule = axe.utils.getRule('nested-interactive');
  });

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('should match if element has children presentational', function () {
    const vNode = queryFixture('<button id="target"></button>');
    expect(rule.matches(null, vNode)).toBe(true);
  });

  it('should match if aria element has children presentational', function () {
    const vNode = queryFixture('<div role="button" id="target"></div>');
    expect(rule.matches(null, vNode)).toBe(true);
  });

  it('should not match if element does not have children presentational', function () {
    const vNode = queryFixture('<a href="foo.html" id="target"></a>');
    expect(rule.matches(null, vNode)).toBe(false);
  });

  it('should not match if element has no role', function () {
    const vNode = queryFixture('<span id="target"></span>');
    expect(rule.matches(null, vNode)).toBe(false);
  });
});
