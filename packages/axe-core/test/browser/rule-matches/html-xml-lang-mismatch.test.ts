import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
describe('xml-lang-mismatch-matches', function () {
  // nested this on a per rule basis, for future-proofing writing tests for multiple rules using the same matches
  describe('for rule: html-xml-lang-mismatch', function () {
    let rule;
    let dom;
    const fixture = document.getElementById('fixture');

    beforeEach(function () {
      rule = axe.utils.getRule('html-xml-lang-mismatch');
      dom = document.createElement('html');
    });

    afterEach(function () {
      fixture.innerHTML = '';
    });

    it('returns false if the element does not contain lang or xml:lang attribute', function () {
      const actual = rule.matches(dom);
      expect(actual).toBe(false);
    });

    it('returns false if the element contains either/ only one of the lang or xml:lang attribute', function () {
      dom.setAttribute('lang', 'nl');
      const actual = rule.matches(dom);
      expect(actual).toBe(false);
    });

    it('returns true if the element contains both lang and xml:lang attribute', function () {
      dom.setAttribute('lang', 'en');
      dom.setAttribute('xml:lang', 'nl');
      const actual = rule.matches(dom);
      expect(actual).toBe(true);
    });

    it('returns false for element of type that is not HTML', function () {
      const node = document.createElement('svg');
      node.setAttribute('lang', '');
      node.setAttribute('xml:lang', 'nl');
      const actual = rule.matches(node);
      expect(actual).toBe(false);
    });
  });
});
