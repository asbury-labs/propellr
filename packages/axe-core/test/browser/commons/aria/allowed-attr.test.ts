import { describe, it, beforeAll, afterEach, expect } from 'vitest';

declare const axe: any;
describe('aria.allowedAttr', function () {
  const globalAttrs;
  beforeAll(function () {
    axe._load({});
    globalAttrs = axe.commons.standards.getGlobalAriaAttrs();
  });

  afterEach(function () {
    axe.reset();
  });

  it('should returned the attributes property for the proper role', function () {
    axe.configure({
      standards: {
        ariaRoles: {
          cats: {
            allowedAttrs: ['hello']
          }
        }
      }
    });

    expect(axe.commons.aria.allowedAttr('cats')).toEqual(
      globalAttrs.concat(['hello'])
    );
  });

  it('should also check required attributes', function () {
    axe.configure({
      standards: {
        ariaRoles: {
          cats: {
            requiredAttrs: ['hello'],
            allowedAttrs: ['ok']
          }
        }
      }
    });

    expect(axe.commons.aria.allowedAttr('cats')).toEqual(
      globalAttrs.concat(['ok', 'hello'])
    );
  });

  it('should return an array with globally allowed attributes', function () {
    expect(axe.commons.aria.allowedAttr('cats')).toEqual(globalAttrs);
  });
});
