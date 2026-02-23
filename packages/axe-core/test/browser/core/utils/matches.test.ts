import { describe, it, expect, afterEach } from 'vitest';
import { queryFixture } from '../../../testutils';

declare const axe: any;
describe('utils.matches', () => {
  const matches = axe.utils.matches;
  const fixture = document.querySelector('#fixture');
  const convertSelector = axe._thisWillBeDeletedDoNotUse.utils.convertSelector;

  afterEach(() => {
    fixture.innerHTML = '';
  });

  describe('tag', () => {
    it('returns true if tag matches', () => {
      let virtualNode = queryFixture('<h1 id="target">foo</h1>');
      expect(matches(virtualNode, 'h1')).toBe(true);
    });

    it('returns false if the tag does not match', () => {
      let virtualNode = queryFixture('<h1 id="target">foo</h1>');
      expect(matches(virtualNode, 'div')).toBe(false);
    });

    it('is case sensitive for XHTML', () => {
      let virtualNode = queryFixture('<H1 id="target">foo</H1>');
      delete virtualNode._cache.props;
      virtualNode._isXHTML = true;
      expect(matches(virtualNode, 'h1')).toBe(false);
    });

    it('is case insensitive for HTML, but not for XHTML', () => {
      let virtualNode = queryFixture('<H1 id="target">foo</H1>');
      delete virtualNode._cache.props;
      virtualNode._isXHTML = true;
      expect(matches(virtualNode, 'h1')).toBe(false);
    });
  });

  describe('classes', () => {
    it('returns true if all classes match', () => {
      let virtualNode = queryFixture(
        '<span id="target" class="foo bar baz"></span>'
      );
      expect(matches(virtualNode, '.foo.bar.baz')).toBe(true);
    });

    it('returns false if some classes do not match', () => {
      let virtualNode = queryFixture(
        '<span id="target" class="foo bar baz"></span>'
      );
      expect(matches(virtualNode, '.foo.bar.bazz')).toBe(false);
    });

    it('returns false if any classes are missing', () => {
      let virtualNode = queryFixture(
        '<span id="target" class="foo bar"></span>'
      );
      expect(matches(virtualNode, '.foo.bar.baz')).toBe(false);
    });
  });

  describe('attributes', () => {
    it('returns true if attribute exists', () => {
      let virtualNode = queryFixture(
        '<span id="target" foo="baz" bar="foo" baz="bar"></span>'
      );
      expect(matches(virtualNode, '[foo]')).toBe(true);
    });

    it('returns true if attribute matches', () => {
      let virtualNode = queryFixture(
        '<span id="target" foo="baz" bar="foo" baz="bar"></span>'
      );
      expect(matches(virtualNode, '[foo=baz]')).toBe(true);
    });

    it('returns true if all attributes match', () => {
      let virtualNode = queryFixture(
        '<span id="target" foo="baz" bar="foo" baz="bar"></span>'
      );
      expect(matches(virtualNode, '[foo="baz"][bar="foo"][baz="bar"]')).toBe(
        true
      );
    });

    it('returns false if some attributes do not match', () => {
      let virtualNode = queryFixture(
        '<span id="target" foo="baz" bar="foo" baz="bar"></span>'
      );
      expect(matches(virtualNode, '[foo="baz"][bar="foo"][baz="baz"]')).toBe(
        false
      );
    });

    it('returns false if any attributes are missing', () => {
      let virtualNode = queryFixture(
        '<span id="target" foo="baz" baz="bar"></span>'
      );
      expect(matches(virtualNode, '[foo="baz"][bar="foo"][baz="bar"]')).toBe(
        false
      );
    });

    it('returns true if attribute starts with value', () => {
      let virtualNode = queryFixture(
        '<span id="target" foo="bazaphone" bar="foo" baz="bar"></span>'
      );
      expect(matches(virtualNode, '[foo^="baz"]')).toBe(true);
    });

    it('returns true if attribute ends with value', () => {
      let virtualNode = queryFixture(
        '<span id="target" foo="bazaphone" bar="foo" baz="bar"></span>'
      );
      expect(matches(virtualNode, '[foo$="hone"]')).toBe(true);
    });

    it('returns true if attribute contains value', () => {
      let virtualNode = queryFixture(
        '<span id="target" foo="bazaphone" bar="foo" baz="bar"></span>'
      );
      expect(matches(virtualNode, '[foo*="baz"]')).toBe(true);
    });

    it('returns true if attribute has value', () => {
      let virtualNode = queryFixture(
        '<span id="target" foo="bar baz" bar="foo" baz="bar"></span>'
      );
      expect(matches(virtualNode, '[foo~="baz"]')).toBe(true);
    });

    it('returns true if attribute matches having an empty value', () => {
      let virtualNode = queryFixture(
        '<span id="target" foo="" bar="foo" baz="bar"></span>'
      );
      expect(matches(virtualNode, '[foo=""]')).toBe(true);
    });

    it('returns true if attribute matches not having value', () => {
      let virtualNode = queryFixture(
        '<span id="target" foo bar="foo" baz="bar"></span>'
      );
      expect(matches(virtualNode, '[foo=""]')).toBe(true);
    });

    it('returns false if attribute should not have value', () => {
      let virtualNode = queryFixture(
        '<span id="target" foo="bar baz" bar="foo" baz="bar"></span>'
      );
      expect(matches(virtualNode, '[foo=""]')).toBe(false);
    });

    it('should return true if attribute exists without value', () => {
      let virtualNode = queryFixture(
        '<span id="target" foo bar="foo" baz="bar"></span>'
      );
      expect(matches(virtualNode, '[foo]')).toBe(true);
    });
  });

  describe('id', () => {
    it('returns true if id matches', () => {
      let virtualNode = queryFixture('<h1 id="target">foo</h1>');
      expect(matches(virtualNode, '#target')).toBe(true);
    });

    it('returns false if the id does not match', () => {
      let virtualNode = queryFixture('<h1 id="target">foo</h1>');
      expect(matches(virtualNode, '#notTarget')).toBe(false);
    });
  });

  describe('pseudos', () => {
    it('throws error if pseudo is not implemented', () => {
      let virtualNode = queryFixture('<h1 id="target">foo</h1>');
      expect(() => {
        matches(virtualNode, 'h1:empty');
      }).toThrow();
      expect(() => {
        matches(virtualNode, 'h1::before');
      }).toThrow();
    });

    describe(':not', () => {
      it('returns true if :not matches using tag', () => {
        let virtualNode = queryFixture('<h1 id="target">foo</h1>');
        expect(matches(virtualNode, 'h1:not(span)')).toBe(true);
      });

      it('returns true if :not matches using class', () => {
        let virtualNode = queryFixture('<h1 id="target">foo</h1>');
        expect(matches(virtualNode, 'h1:not(.foo)')).toBe(true);
      });

      it('returns true if :not matches using attribute', () => {
        let virtualNode = queryFixture('<h1 id="target">foo</h1>');
        expect(matches(virtualNode, 'h1:not([class])')).toBe(true);
      });

      it('returns true if :not matches using id', () => {
        let virtualNode = queryFixture('<h1 id="target">foo</h1>');
        expect(matches(virtualNode, 'h1:not(#foo)')).toBe(true);
      });

      it('returns true if :not matches none of the selectors', () => {
        let virtualNode = queryFixture('<h1 id="target">foo</h1>');
        expect(matches(virtualNode, 'h1:not([role=heading], span)')).toBe(true);
      });

      it('returns false if :not matches element', () => {
        let virtualNode = queryFixture('<h1 id="target">foo</h1>');
        expect(matches(virtualNode, 'h1:not([id])')).toBe(false);
      });

      it('returns false if :not matches one of the selectors', () => {
        let virtualNode = queryFixture('<h1 id="target">foo</h1>');
        expect(matches(virtualNode, 'h1:not([role=heading], [id])')).toBe(
          false
        );
      });
    });

    describe(':is', () => {
      it('returns true if :is matches using tag', () => {
        let virtualNode = queryFixture('<h1 id="target">foo</h1>');
        expect(matches(virtualNode, ':is(h1)')).toBe(true);
      });

      it('returns true if :is matches using class', () => {
        let virtualNode = queryFixture('<h1 id="target" class="foo">foo</h1>');
        expect(matches(virtualNode, 'h1:is(.foo)')).toBe(true);
      });

      it('returns true if :is matches using attribute', () => {
        let virtualNode = queryFixture('<h1 id="target" class="foo">foo</h1>');
        expect(matches(virtualNode, 'h1:is([class])')).toBe(true);
      });

      it('returns true if :is matches using id', () => {
        let virtualNode = queryFixture('<h1 id="target">foo</h1>');
        expect(matches(virtualNode, 'h1:is(#target)')).toBe(true);
      });

      it('returns true if :is matches one of the selectors', () => {
        let virtualNode = queryFixture('<h1 id="target">foo</h1>');
        expect(matches(virtualNode, ':is([role=heading], h1)')).toBe(true);
      });

      it('returns true if :is matches complex selector', () => {
        let virtualNode = queryFixture('<div><h1 id="target">foo</h1></div>');
        expect(matches(virtualNode, 'h1:is(div > #target)')).toBe(true);
      });

      it('returns false if :is does not match element', () => {
        let virtualNode = queryFixture('<h1 id="target">foo</h1>');
        expect(matches(virtualNode, 'h1:is([class])')).toBe(false);
      });

      it('returns false if :is matches none of the selectors', () => {
        let virtualNode = queryFixture('<h1 id="target">foo</h1>');
        expect(matches(virtualNode, 'h1:is([class], span, #foo, .bar)')).toBe(
          false
        );
      });
    });
  });

  describe('complex', () => {
    it('returns true for complex selector', () => {
      let virtualNode = queryFixture(
        '<span id="target" class="foo bar baz"></span>'
      );
      expect(matches(virtualNode, 'span.foo[id="target"]:not(div)')).toBe(true);
    });

    it('returns false if any part of the selector does not match', () => {
      let virtualNode = queryFixture(
        '<span id="target" class="foo bar baz"></span>'
      );
      expect(matches(virtualNode, 'span.foo[id="target"]:not(span)')).toBe(
        false
      );
    });

    it('returns true if a comma-separated list of selectors match', () => {
      let virtualNode = queryFixture(
        '<span id="target" class="foo bar baz"></span>'
      );
      expect(matches(virtualNode, 'div, p, span')).toBe(true);
    });
  });

  describe('combinator', () => {
    it('returns true if parent selector matches', () => {
      let virtualNode = queryFixture('<div><h1 id="target">foo</h1></div>');
      expect(matches(virtualNode, 'div > h1')).toBe(true);
    });

    it('returns true if nested parent selector matches', () => {
      let virtualNode = queryFixture(
        '<main><div><h1 id="target">foo</h1></div><main>'
      );
      expect(matches(virtualNode, 'main > div > h1')).toBe(true);
    });

    it('returns true if hierarchical selector matches', () => {
      let virtualNode = queryFixture('<div><h1 id="target">foo</h1></div>');
      expect(matches(virtualNode, 'div h1')).toBe(true);
    });

    it('returns true if nested hierarchical selector matches', () => {
      let virtualNode = queryFixture(
        '<div><table><tr><td><h1 id="target">foo</h1></td></tr></table></div>'
      );
      expect(matches(virtualNode, 'div tr h1')).toBe(true);
    });

    it('returns true if mixed parent and hierarchical selector matches', () => {
      let virtualNode = queryFixture(
        '<div><table><tr><td><h1 id="target">foo</h1></td></tr></table></div>'
      );
      expect(matches(virtualNode, 'div tr > td h1')).toBe(true);
    });

    it('returns false if parent selector does not match', () => {
      let virtualNode = queryFixture('<div><h1 id="target">foo</h1></div>');
      expect(matches(virtualNode, 'span > h1')).toBe(false);
    });

    it('returns false if nested parent selector does not match', () => {
      let virtualNode = queryFixture(
        '<main><div><h1 id="target">foo</h1></div><main>'
      );
      expect(matches(virtualNode, 'span > div > h1')).toBe(false);
    });

    it('returns false if hierarchical selector does not match', () => {
      let virtualNode = queryFixture('<div><h1 id="target">foo</h1></div>');
      expect(matches(virtualNode, 'span h1')).toBe(false);
    });

    it('returns false if nested hierarchical selector does not match', () => {
      let virtualNode = queryFixture(
        '<div><table><tr><td><h1 id="target">foo</h1></td></tr></table></div>'
      );
      expect(matches(virtualNode, 'div span h1')).toBe(false);
    });

    it('returns false if mixed parent and hierarchical selector does not match', () => {
      let virtualNode = queryFixture(
        '<div><table><tr><td><h1 id="target">foo</h1></td></tr></table></div>'
      );
      expect(matches(virtualNode, 'div span > td h1')).toBe(false);
    });

    it('throws error if combinator is not implemented', () => {
      let virtualNode = queryFixture('<div></div><h1 id="target">foo</h1>');
      expect(() => {
        matches(virtualNode, 'div + h1');
      }).toThrow();
      expect(() => {
        matches(virtualNode, 'div ~ h1');
      }).toThrow();
    });
  });

  describe('convertSelector', () => {
    it('should set type to attrExist for attribute selector', () => {
      let expression = convertSelector('[disabled]');
      expect(expression[0][0].attributes[0].type).toBe('attrExist');
    });

    it('should set type to attrValue for attribute value selector', () => {
      let expression = convertSelector('[aria-pressed="true"]');
      expect(expression[0][0].attributes[0].type).toBe('attrValue');
    });

    it('should set type to attrValue for empty attribute value selector', () => {
      let expression = convertSelector('[aria-pressed=""]');
      expect(expression[0][0].attributes[0].type).toBe('attrValue');
    });
  });
});
