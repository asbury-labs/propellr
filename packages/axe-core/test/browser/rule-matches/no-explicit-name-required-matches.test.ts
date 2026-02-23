import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { queryFixture } from '../../testutils';

declare const axe: any;
describe('no-explicit-name-matches', function () {
  const fixture = document.getElementById('fixture');
  let rule;

  beforeEach(function () {
    rule = axe.utils.getRule('button-name');
  });

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('returns true when element does not have `role` attribute', function () {
    const vNode = queryFixture('<button id="target"></button>');
    const actual = rule.matches(vNode.actualNode, vNode);
    expect(actual).toBe(true);
  });

  it('returns true when element has an explicit role of presentation', function () {
    const vNode = queryFixture(
      '<button id="target" role="presentation"></button>'
    );
    const actual = rule.matches(vNode.actualNode, vNode);
    expect(actual).toBe(true);
  });

  it('returns true when element has an explicit role of none', function () {
    const vNode = queryFixture('<button id="target" role="none"></button>');
    const actual = rule.matches(vNode.actualNode, vNode);
    expect(actual).toBe(true);
  });

  it('returns true when element has an invalid explicit role', function () {
    const vNode = queryFixture('<button id="target" role="foo"></button>');
    const actual = rule.matches(vNode.actualNode, vNode);
    expect(actual).toBe(true);
  });

  it('returns true when element has an explicit role that requires an accessible name', function () {
    const vNode = queryFixture('<button id="target" role="button"></button>');
    const actual = rule.matches(vNode.actualNode, vNode);
    expect(actual).toBe(true);
  });

  describe('with a role that does not require an accessible name', function () {
    it('returns true when element is focusable', function () {
      const vNode = queryFixture(
        '<button id="target" role="separator"></button>'
      );
      const actual = rule.matches(vNode.actualNode, vNode);
      expect(actual).toBe(true);
    });

    it('returns false when element is not focusable', function () {
      const vNode = queryFixture(
        '<button id="target" role="separator" disabled></button>'
      );
      const actual = rule.matches(vNode.actualNode, vNode);
      expect(actual).toBe(false);
    });
  });
});
