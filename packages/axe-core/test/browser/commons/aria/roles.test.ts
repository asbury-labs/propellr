import { describe, it, beforeEach, afterEach, expect } from 'vitest';

declare const axe: any;
describe('aria.implicitNodes', function () {
  const orig;
  beforeEach(function () {
    orig = axe.commons.aria.lookupTable.role;
  });

  afterEach(function () {
    axe.commons.aria.lookupTable.role = orig;
  });

  it('should return the implicit property for the proper role', function () {
    axe.commons.aria.lookupTable.role = {
      cats: {
        implicit: 'yes'
      }
    };
    expect(axe.commons.aria.implicitNodes('cats')).toBe('yes');
  });

  it('should return null if there are no implicit roles', function () {
    axe.commons.aria.lookupTable.role = {};
    const result = axe.commons.aria.implicitNodes('cats');

    expect(result).toBeNull();
  });
});
