import { describe, it, afterEach, expect } from 'vitest';

declare const axe: any;
describe('aria.requiredContext', function () {
  afterEach(function () {
    axe.reset();
  });

  it('should returned the context property for the proper role', function () {
    axe.configure({
      standards: {
        ariaRoles: {
          cats: {
            requiredContext: ['yes']
          }
        }
      }
    });
    expect(axe.commons.aria.requiredContext('cats')).toEqual(['yes']);
  });

  it('should returned null if the required context is not an array', function () {
    axe.configure({
      standards: {
        ariaRoles: {
          cats: {
            requiredContext: 'yes'
          }
        }
      }
    });
    expect(axe.commons.aria.requiredContext('cats')).toBeNull();
  });

  it('should return null if there are no required context nodes', function () {
    const result = axe.commons.aria.requiredContext('cats');

    expect(result).toBeNull();
  });

  it('should return a unique copy of the context', function () {
    const context = ['yes', 'no'];

    axe.configure({
      standards: {
        ariaRoles: {
          cats: {
            requiredContext: context
          }
        }
      }
    });

    const result = axe.commons.aria.requiredContext('cats');
    expect(result).not.toBe(context);
  });
});
