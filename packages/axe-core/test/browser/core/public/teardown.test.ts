import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('axe.teardown', () => {
  it('should reset the tree', () => {
    axe._tree = 'foo';
    axe.teardown();
    expect(axe._tree).toBeUndefined();
  });

  it('should reset selector data', () => {
    axe._selectorData = 'foo';
    axe.teardown();
    expect(axe._selectorData).toBeUndefined();
  });

  it('should reset selector data', () => {
    axe._selectCache = 'foo';
    axe.teardown();
    expect(axe._selectCache).toBeUndefined();
  });

  it('should reset memozied functions', () => {
    const orgFn = axe._memoizedFns[0];
    let called = false;
    axe._memoizedFns[0] = {
      clear: () => {
        called = true;
      }
    };
    axe.teardown();
    expect(called).toBe(true);
    axe._memoizedFns[0] = orgFn;
  });

  it('should reset the cache', () => {
    const orgFn = axe._cache.clear;
    let called = false;
    axe._cache.clear = () => {
      called = true;
    };
    axe.teardown();
    expect(called).toBe(true);
    axe._cache.clear = orgFn;
  });
});
