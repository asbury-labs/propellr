import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
describe('no-role-empty-matches', function () {
  const fixture = document.getElementById('fixture');
  const queryFixture = axe.testUtils.queryFixture;
  let rule;

  beforeEach(function () {
    rule = axe.utils.getRule('aria-roles');
  });

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('returns false when element does not have `role` attribute', function () {
    const vNode = queryFixture('<div id="target">Some Content</div>');
    const actual = rule.matches(vNode.actualNode, vNode);
    expect(actual).toBe(false);
  });

  it('returns false when element has role attribute has no value', function () {
    const vNode = queryFixture('<div role id="target">Some Content</div>');
    const actual = rule.matches(vNode.actualNode, vNode);
    expect(actual).toBe(false);
  });

  it('returns false when element has empty role attribute', function () {
    const vNode = queryFixture('<div role="" id="target">Some Content</div>');
    const actual = rule.matches(vNode.actualNode, vNode);
    expect(actual).toBe(false);
  });

  it('returns false when element has role attribute consisting of only whitespace', function () {
    const vNode = queryFixture('<div role=" " id="target">Some Content</div>');
    const actual = rule.matches(vNode.actualNode, vNode);
    expect(actual).toBe(false);
  });

  it('returns true when element has role attribute', function () {
    const vNode = queryFixture(
      '<div role="button" id="target">Some Content</div>'
    );
    const actual = rule.matches(vNode.actualNode, vNode);
    expect(actual).toBe(true);
  });

  it('returns true when element has multiple roles', function () {
    const vNode = queryFixture(
      '<div role="button link" id="target">Some Content</div>'
    );
    const actual = rule.matches(vNode.actualNode, vNode);
    expect(actual).toBe(true);
  });

  it('returns true when element has invalid role', function () {
    const vNode = queryFixture(
      '<div role="xyz" id="target">Some Content</div>'
    );
    const actual = rule.matches(vNode.actualNode, vNode);
    expect(actual).toBe(true);
  });
});
