import { describe, it, expect, beforeEach } from 'vitest';

declare const axe: any;
describe('label-matches', function () {
  const fixture = document.getElementById('fixture');
  const queryFixture = axe.testUtils.queryFixture;
  let rule;

  beforeEach(function () {
    fixture.innerHTML = '';
    rule = axe.utils.getRule('label');
  });

  it('returns true for non-input elements', function () {
    const vNode = queryFixture('<textarea id="target"></textarea>');
    expect(rule.matches(null, vNode)).toBe(true);
  });

  it('returns true for input elements without type', function () {
    const vNode = queryFixture('<input id="target" />');

    expect(rule.matches(null, vNode)).toBe(true);
  });

  it('returns false for input buttons', function () {
    ['button', 'submit', 'image', 'reset'].forEach(function (type) {
      const vNode = queryFixture('<input id="target" type="' + type + '" />');
      expect(rule.matches(null, vNode)).toBe(false);
    });
  });

  it('returns false for input elements type=hidden', function () {
    const vNode = queryFixture('<input id="target" type="hidden" />');

    expect(rule.matches(null, vNode)).toBe(false);
  });

  it('returns true for other input types', function () {
    ['text', 'password', 'url', 'range', 'date', 'checkbox', 'radio'].forEach(
      function (type) {
        const vNode = queryFixture('<input id="target" type="' + type + '" />');
        expect(rule.matches(null, vNode)).toBe(true);
      }
    );
  });
});
