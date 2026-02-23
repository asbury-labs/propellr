import { describe, it, afterEach, expect } from 'vitest';

declare const axe: any;
describe('aria.isValidRole', function () {
  afterEach(function () {
    axe.reset();
  });

  it('should return true if role is found in the lookup table', function () {
    axe.configure({
      standards: {
        ariaRoles: {
          cats: true
        }
      }
    });
    expect(axe.commons.aria.isValidRole('cats')).toBe(true);
  });

  it('should return false if role is not found in the lookup table', function () {
    expect(axe.commons.aria.isValidRole('cats')).toBe(false);
  });

  it('returns false for abstract roles by default', function () {
    expect(axe.commons.aria.isValidRole('input')).toBe(false);
  });

  it('returns true for abstract roles with { allowAbstract: true } ', function () {
    expect(axe.commons.aria.isValidRole('input', { allowAbstract: true })).toBe(
      true
    );
  });
});
