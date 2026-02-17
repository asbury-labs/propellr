import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('axe.utils.toArray', () => {
  it('should call Array.prototype.slice', () => {
    const orig = Array.prototype.slice,
      called = false,
      arrayLike = { 0: 'cats', length: 1 };

    Array.prototype.slice = () => {
      called = true;
      expect(this).toBe(arrayLike);
    };

    axe.utils.toArray(arrayLike);

    expect(called).toBe(true);

    Array.prototype.slice = orig;
  });

  it('should return an array', () => {
    let arrayLike = { 0: 'cats', length: 1 };

    let result = axe.utils.toArray(arrayLike);
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('axe.utils.uniqueArray', () => {
  it('should filter duplicate values', () => {
    const array1 = [1, 2, 3, 4, 5];
    const array2 = [1, 3, 7];

    let result = axe.utils.uniqueArray(array1, array2);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual(expect.arrayContaining([1, 2, 3, 4, 5, 7]));
  });
});
