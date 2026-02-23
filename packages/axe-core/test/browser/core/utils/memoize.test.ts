import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('axe.utils.memoize', () => {
  it('should add the function to axe._memoizedFns', () => {
    const length = axe._memoizedFns.length;

    axe.utils.memoize(function myFn() {});
    expect(axe._memoizedFns.length).toBe(length + 1);
  });
});
