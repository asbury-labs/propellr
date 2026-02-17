import { describe, it, expect, beforeEach } from 'vitest';

declare const axe: any;
describe('aria-hidden-focus-matches', function () {
  let rule;
  const queryFixture = axe.testUtils.queryFixture;

  beforeEach(function () {
    rule = axe.utils.getRule('aria-hidden-focus');
  });

  it('return true when there is no parent with aria-hidden', function () {
    const vNode = queryFixture('<div id="target">' + '</div>');
    const actual = rule.matches(vNode.actualNode);
    expect(actual).toBe(true);
  });

  it('return false when has a parent element with aria-hidden', function () {
    const vNode = queryFixture(
      '<div aria-hidden="true">' +
        '<div id="target" aria-hidden="true">' +
        '</div>' +
        '</div>'
    );
    const actual = rule.matches(vNode.actualNode);
    expect(actual).toBe(false);
  });

  it('return false when has any parent element with aria-hidden', function () {
    const vNode = queryFixture(
      '<div aria-hidden="true">' +
        '<div>' +
        '<div id="target" aria-hidden="true">' +
        '</div>' +
        '</div>' +
        '</div>'
    );
    const actual = rule.matches(vNode.actualNode);
    expect(actual).toBe(false);
  });

  it('return false when has any parent element with aria-hidden', function () {
    const vNode = queryFixture(
      '<div aria-hidden="true">' +
        '<div aria-hidden="true">' +
        '<button id="target">btn</button>' +
        '</div>' +
        '</div>'
    );
    const actual = rule.matches(vNode.actualNode);
    expect(actual).toBe(false);
  });
});
