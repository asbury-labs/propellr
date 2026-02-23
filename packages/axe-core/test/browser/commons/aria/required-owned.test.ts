import { describe, it, afterEach, expect } from 'vitest';

declare const axe: any;
describe('aria.requiredOwned', function () {
  afterEach(function () {
    axe.reset();
  });

  it('should returned the context property for the proper role', function () {
    axe.configure({
      standards: {
        ariaRoles: {
          cats: {
            requiredOwned: ['yes']
          }
        }
      }
    });
    expect(axe.commons.aria.requiredOwned('cats')).toEqual(['yes']);
  });

  it('should returned null if the required context is not an array', function () {
    axe.configure({
      standards: {
        ariaRoles: {
          cats: {
            requiredOwned: 'yes'
          }
        }
      }
    });
    expect(axe.commons.aria.requiredOwned('cats')).toBeNull();
  });

  it('should return null if there are no required context nodes', function () {
    const result = axe.commons.aria.requiredOwned('cats');

    expect(result).toBeNull();
  });

  it('should return a unique copy of the context', function () {
    const context = ['yes', 'no'];

    axe.configure({
      standards: {
        ariaRoles: {
          cats: {
            requiredOwned: context
          }
        }
      }
    });

    const result = axe.commons.aria.requiredOwned('cats');
    expect(result).not.toBe(context);
  });
});
