import { describe, it, expect, vi } from 'vitest';

declare const axe: any;
describe('axe._cache', () => {
  describe('set', () => {
    it('should set items without error', () => {
      function fn() {
        axe._cache.set('foo', 'bar');
      }
      expect(fn).not.toThrow();
    });

    it('should set `undefined` without error', () => {
      function fn() {
        axe._cache.set('foo', undefined);
      }
      expect(fn).not.toThrow();
    });

    it('should throw for non-string keys', () => {
      expect(() => {
        axe._cache.set(1, 'bar');
      }).toThrow();
      expect(() => {
        axe._cache.set({}, 'bar');
      }).toThrow();
      expect(() => {
        axe._cache.set(null, 'bar');
      }).toThrow();
      expect(() => {
        axe._cache.set(() => {
          return;
        }, 'bar');
      }).toThrow();
    });

    it('should throw for empty string keys', () => {
      expect(() => {
        axe._cache.set('', 'bar');
      }).toThrow();
    });
  });

  describe('get', () => {
    it('should get an item from the cache', () => {
      axe._cache.set('foo', 'bar');
      const value = axe._cache.get('foo');
      expect(value).toBe('bar');
    });

    it('should return `undefined` for key lookup miss', () => {
      expect(axe._cache.get('foo')).toBeUndefined();
    });

    describe('with creator function', () => {
      it('should set and return primitive types', () => {
        expect(
          axe._cache.get('integer', () => {
            return 1;
          })
        ).toBe(1);
        expect(
          axe._cache.get('float', () => {
            return 1.1;
          })
        ).toBe(1.1);
        expect(
          axe._cache.get('string', () => {
            return 'foo';
          })
        ).toBe('foo');
        expect(
          axe._cache.get('boolean', () => {
            return true;
          })
        ).toBe(true);
        expect(
          axe._cache.get('null', () => {
            return null;
          })
        ).toBeNull();

        const obj = { foo: 'bar' };
        expect(
          axe._cache.get('object', () => {
            return obj;
          })
        ).toBe(obj);

        const arr = [1, 2, 3];
        expect(
          axe._cache.get('array', () => {
            return arr;
          })
        ).toBe(arr);
      });

      it('should throw when creator is not a function', () => {
        function fn() {
          axe._cache.get('foo', 'bar');
        }
        expect(fn).toThrow();
      });

      it('should throw when creator function returns `undefined`', () => {
        function fn() {
          axe._cache.get('foo', () => {
            return undefined;
          });
        }
        expect(fn).toThrow();
      });

      it('should not evaluate creator if key already exists', () => {
        const spy = vi.fn();
        axe._cache.set('foo', 'bar');
        axe._cache.get('foo', spy);
        expect(spy).not.toHaveBeenCalled();
      });

      it('should evaluate creator once', () => {
        const spy = vi.fn(() => {
          return true;
        });
        axe._cache.get('foo', spy);
        axe._cache.get('foo', spy);
        axe._cache.get('foo', spy);
        expect(spy).toHaveBeenCalledTimes(1);
      });

      it('should not override a value from `set()`', () => {
        axe._cache.set('foo', 'bar');
        axe._cache.get('foo', () => {
          return 'baz';
        });
        expect(axe._cache.get('foo')).toBe('bar');
      });

      it('should override a value from `get()` with a `set()` value', () => {
        axe._cache.get('foo', () => {
          return 'baz';
        });
        axe._cache.set('foo', 'bar');
        expect(axe._cache.get('foo')).toBe('bar');
      });

      it('should set value after calling with undefined', () => {
        axe._cache.get('foo');
        axe._cache.get('foo', () => {
          return 'value';
        });
        expect(axe._cache.get('foo')).toBe('value');
      });
    });
  });

  describe('clear', () => {
    it('should clear the cache', () => {
      axe._cache.set('foo', 'bar');
      axe._cache.clear();
      const value = axe._cache.get('foo');
      expect(value).toBeUndefined();
    });
  });
});
