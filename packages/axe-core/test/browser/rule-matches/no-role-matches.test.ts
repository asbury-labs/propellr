import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('link-in-text-block-matches', () => {
  const rule = axe.utils.getRule('definition-list');
  const { queryFixture } = axe.testUtils;

  it('should return true if element does not have a role attribute', () => {
    const vNode = queryFixture('<div id="target"></div>');
    expect(rule.matches(null, vNode)).toBe(true);
  });

  it('should return true if element has an empty role attribute', () => {
    const vNode = queryFixture('<div role="" id="target"></div>');
    expect(rule.matches(null, vNode)).toBe(true);
  });

  it('should return false if element has a role attribute', () => {
    const vNode = queryFixture('<div role="button" id="target"></div>');
    expect(rule.matches(null, vNode)).toBe(false);
  });
});
