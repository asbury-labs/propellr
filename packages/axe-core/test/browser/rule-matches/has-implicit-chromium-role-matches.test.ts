import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { queryFixture } from '../../testutils';

declare const axe: any;
describe('has-implicit-chromium-role-matches', function () {
  let rule;
  const fixture = document.getElementById('fixture');

  beforeEach(function () {
    rule = axe.utils.getRule('presentation-role-conflict');
  });

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('matches elements with an implicit role', function () {
    const vNode = queryFixture('<main id="target"></main>');
    expect(rule.matches(null, vNode)).toBe(true);
  });

  it('does not match elements with no implicit role', function () {
    const vNode = queryFixture('<div id="target"></div>');
    expect(rule.matches(null, vNode)).toBe(false);
  });

  it('matches elements with an implicit role in chromium', function () {
    const vNode = queryFixture('<svg id="target"></svg>');
    expect(rule.matches(null, vNode)).toBe(true);
  });

  it('does not match elements with no implicit role even if they are focusable and have an explicit role', function () {
    const vNode = queryFixture(
      '<div id="target" role="none" tabindex="1"></div>'
    );
    expect(rule.matches(null, vNode)).toBe(false);
  });
});
