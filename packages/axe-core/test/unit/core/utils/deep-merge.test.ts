import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('utils.deepMerge', () => {
  const deepMerge = axe.utils.deepMerge;

  it('should merge two objects', () => {
    let obj1 = { a: 'one' };
    let obj2 = { b: 'two' };

    expect(deepMerge(obj1, obj2)).toEqual({
      a: 'one',
      b: 'two'
    });
  });

  it('should not modify the objects', () => {
    let obj1 = { a: 'one' };
    let obj2 = { a: 'two' };
    deepMerge(obj1, obj2);

    expect(obj1).toEqual({ a: 'one' });
    expect(obj2).toEqual({ a: 'two' });
  });

  it('should return a new object', () => {
    let obj1 = { a: 'one' };
    let obj2 = { a: 'two' };
    let obj3 = deepMerge(obj1, obj2);

    expect(obj1).not.toBe(obj3);
    expect(obj2).not.toBe(obj3);
  });

  it('should not merge arrays', () => {
    let obj1 = { a: ['one', 'two'] };
    let obj2 = { a: ['three'] };

    expect(deepMerge(obj1, obj2)).toEqual({ a: ['three'] });
  });

  it('should merge nested objects', () => {
    let obj1 = { a: { a: ['one'] } };
    let obj2 = { a: { a: ['one', 'two'], b: 'three' } };

    expect(deepMerge(obj1, obj2)).toEqual({
      a: {
        a: ['one', 'two'],
        b: 'three'
      }
    });
  });

  it('should accept multiple objects', () => {
    let obj1 = { a: { a: ['one'] } };
    let obj2 = { a: { a: ['one', 'two'], b: 'three' } };
    let obj3 = { a: { b: 'four' }, b: 'five' };

    expect(deepMerge(obj1, obj2, obj3)).toEqual({
      a: {
        a: ['one', 'two'],
        b: 'four'
      },
      b: 'five'
    });
  });

  it('should handle bad sources', () => {
    let obj;

    expect(() => {
      obj = deepMerge(null, undefined, true, 'one', ['a', 'b'], 1, { a: 'b' });
    }).not.toThrow();
    expect(obj).toEqual({ a: 'b' });
  });
});
