import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('matches.fromFunction', () => {
  const fromFunction = axe.commons.matches.fromFunction;
  function noop() {}

  it('throws an error when the matcher is a number', () => {
    expect(() => {
      fromFunction(noop, 123);
    }).toThrow();
  });

  it('throws an error when the matcher is a string', () => {
    expect(() => {
      fromFunction(noop, 'foo');
    }).toThrow();
  });

  it('throws an error when the matcher is an array', () => {
    expect(() => {
      fromFunction(noop, ['foo']);
    }).toThrow();
  });

  it('throws an error when the matcher is a RegExp', () => {
    expect(() => {
      fromFunction(noop, /foo/);
    }).toThrow();
  });

  describe('with object matches', () => {
    let keyMap = {};
    function getValue(key) {
      return key;
    }

    it('passes every object key to the getValue function once', () => {
      const keys = ['foo', 'bar', 'baz'];
      function getValueOnce(key) {
        const index = keys.indexOf(key);
        expect(index).not.toBe(-1);
        keys.splice(index, 1);
        return key;
      }

      fromFunction(getValueOnce, {
        foo: 'foo',
        bar: 'bar',
        baz: 'baz'
      });
      expect(keys).toHaveLength(0);
    });

    it('returns true if every value is matched', () => {
      keyMap = {
        foo: 'foo',
        bar: 'bar',
        baz: 'baz'
      };
      expect(fromFunction(getValue, keyMap)).toBe(true);
    });

    it('returns false if any value is not matched', () => {
      keyMap = {
        foo: 'foo',
        bar: 'bar',
        baz: 'baz'
      };
      expect(
        fromFunction(function (key) {
          if (key === 'bar') {
            return 'mismatch';
          }
          return key;
        }, keyMap)
      ).toBe(false);
    });

    it('returns true if there are no keys', () => {
      expect(fromFunction(getValue, {})).toBe(true);
    });
  });
});
