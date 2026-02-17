import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('matches.fromPrimative', function () {
  const fromPrimative = axe.commons.matches.fromPrimative;

  it('returns true when strictly equal', function () {
    expect(fromPrimative('foo', 'foo')).toBe(true);
    expect(fromPrimative(null, null)).toBe(true);
    expect(fromPrimative(true, true)).toBe(true);
    expect(fromPrimative(123, 123)).toBe(true);
    expect(fromPrimative(undefined, undefined)).toBe(true);
  });

  it('returns false when not strictly equal', function () {
    expect(fromPrimative('foo', 'bar')).toBe(false);
    expect(fromPrimative(null, undefined)).toBe(false);
    expect(fromPrimative(false, null)).toBe(false);
    expect(fromPrimative(true, false)).toBe(false);
    expect(fromPrimative(123, 456)).toBe(false);
    expect(fromPrimative(undefined, null)).toBe(false);
  });

  describe('with array matchers', function () {
    it('returns true if the string is included', function () {
      expect(fromPrimative('bar', ['foo', 'bar', 'baz'])).toBe(true);
    });
    it('returns false if the string is not included', function () {
      expect(fromPrimative('foo bar', ['foo', 'bar', 'baz'])).toBe(false);
    });
    it('returns false when passed `undefined`', function () {
      expect(fromPrimative(undefined, ['foo', 'bar', 'baz'])).toBe(false);
    });
  });

  describe('with function matchers', function () {
    it('returns true if the function returns a truthy value', function () {
      expect(
        fromPrimative('foo', function (val) {
          expect(val).toBe('foo');
          return true;
        })
      ).toBe(true);
      expect(
        fromPrimative('foo', function () {
          return 123;
        })
      ).toBe(true);
      expect(
        fromPrimative('foo', function () {
          return {};
        })
      ).toBe(true);
    });
    it('returns false if the function returns a falsey value', function () {
      expect(
        fromPrimative('foo', function (val) {
          expect(val).toBe('foo');
          return false;
        })
      ).toBe(false);
      expect(
        fromPrimative('foo', function () {
          return 0;
        })
      ).toBe(false);
      expect(
        fromPrimative('foo', function () {
          return undefined;
        })
      ).toBe(false);
    });
  });

  describe('with RegExp matchers', function () {
    it('returns true if the regexp matches', function () {
      expect(fromPrimative('bar', /^(foo|bar|baz)$/)).toBe(true);
    });
    it('returns false if the regexp does not match', function () {
      expect(fromPrimative('foobar', /^(foo|bar|baz)$/)).toBe(false);
    });
    it('returns false for null value', function () {
      expect(fromPrimative(null, /.*/)).toBe(false);
    });
  });

  describe('with RegExp string', function () {
    it('returns true if the regexp matches', function () {
      expect(fromPrimative('bar', '/^(foo|bar|baz)$/')).toBe(true);
    });
    it('returns false if the regexp does not match', function () {
      expect(fromPrimative('foobar', '/^(foo|bar|baz)$/')).toBe(false);
    });
    it('returns false for null value', function () {
      expect(fromPrimative(null, '/.*/')).toBe(false);
    });
  });
});
