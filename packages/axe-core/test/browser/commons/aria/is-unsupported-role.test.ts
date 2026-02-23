import { describe, it, afterAll, expect } from 'vitest';

declare const axe: any;
describe('aria.isUnsupportedRole', function () {
  afterAll(function () {
    axe.reset();
  });

  it('should return true if the role is unsupported', function () {
    axe.configure({
      standards: {
        ariaRoles: {
          cats: {
            unsupported: true
          }
        }
      }
    });
    expect(axe.commons.aria.isUnsupportedRole('cats')).toBe(true);
  });

  it('should return false if the role is supported', function () {
    axe.configure({
      standards: {
        ariaRoles: {
          cats: {
            unsupported: false
          }
        }
      }
    });
    expect(axe.commons.aria.isUnsupportedRole('cats')).toBe(false);
  });

  it('should return false if the role is invalid', function () {
    expect(axe.commons.aria.isUnsupportedRole('cats')).toBe(false);
  });
});
