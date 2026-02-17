import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('is-visible-on-screen-matches', () => {
  const rule = axe.utils.getRule('avoid-inline-spacing');
  const queryFixture = axe.testUtils.queryFixture;

  it('returns true for visible elements', () => {
    const vNode = queryFixture('<p id="target">Hello world</p>');
    expect(rule.matches(null, vNode)).toBe(true);
  });

  it('returns false for elements with hidden', () => {
    const vNode = queryFixture('<p id="target" hidden>Hello world</p>');
    expect(rule.matches(null, vNode)).toBe(false);
  });

  it('returns true for visible elements with aria-hidden="true"', () => {
    const vNode = queryFixture(
      '<p id="target" aria-hidden="true">Hello world</p>'
    );
    expect(rule.matches(null, vNode)).toBe(true);
  });

  it('returns false for opacity:0 elements with accessible text', () => {
    const vNode = queryFixture(
      '<p id="target" style="opacity:0">Hello world</p>'
    );
    expect(rule.matches(null, vNode)).toBe(false);
  });
});
