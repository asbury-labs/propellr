import { describe, it, afterEach, expect } from 'vitest';

declare const axe: any;
describe('aria.requiredAttr', function () {
  afterEach(function () {
    axe.reset();
  });

  it('should returned the attributes property for the proper role', function () {
    axe.configure({
      standards: {
        ariaRoles: {
          cats: {
            requiredAttrs: ['yes']
          }
        }
      }
    });

    expect(axe.commons.aria.requiredAttr('cats')).toEqual(['yes']);
  });

  it('should returned empty array if the required attributes is not an array', function () {
    axe.configure({
      standards: {
        ariaRoles: {
          cats: {
            requiredAttrs: 'yes'
          }
        }
      }
    });
    expect(axe.commons.aria.requiredAttr('cats')).toEqual([]);
  });

  it('should return an empty array if there are no required attributes', function () {
    const result = axe.commons.aria.requiredAttr('cats');

    expect(result).toEqual([]);
  });

  it('should return a unique copy of the attributes', function () {
    const attrs = ['yes', 'no'];

    axe.configure({
      standards: {
        ariaRoles: {
          cats: {
            requiredAttrs: attrs
          }
        }
      }
    });

    const result = axe.commons.aria.requiredAttr('cats');
    expect(result).not.toBe(attrs);
  });
});
