import { describe, it, expect, afterEach } from 'vitest';
import {
  checkSetup,
  getCheckEvaluate,
  MockCheckContext
} from '../../../testutils';

declare const axe: any;
describe('deprecatedrole', function () {
  const checkContext = MockCheckContext();
  const checkEvaluate = getCheckEvaluate('deprecatedrole');
  afterEach(function () {
    checkContext.reset();
    axe.reset();
  });

  it('returns true if applied to a deprecated role', function () {
    axe.configure({
      standards: {
        ariaRoles: {
          melon: {
            type: 'widget',
            deprecated: true
          }
        }
      }
    });
    const params = checkSetup('<div id="target" role="melon">Contents</div>');
    expect(checkEvaluate.apply(checkContext, params)).toBe(true);
    expect(checkContext._data).toEqual('melon');
  });

  it('returns true if applied to a deprecated DPUB role', function () {
    axe.configure({
      standards: {
        ariaRoles: {
          'doc-fizzbuzz': {
            type: 'widget',
            deprecated: true
          }
        }
      }
    });
    const params = checkSetup(
      '<div id="target" role="doc-fizzbuzz">Contents</div>'
    );
    expect(checkEvaluate.apply(checkContext, params)).toBe(true);
    expect(checkContext._data).toEqual('doc-fizzbuzz');
  });

  it('returns false if applied to a non-deprecated role', function () {
    let params = checkSetup('<div id="target" role="button">Contents</div>');
    expect(checkEvaluate.apply(checkContext, params)).toBe(false);
    expect(checkContext._data).toBeNull();

    params = checkSetup('<button id="target">Contents</button>');
    expect(checkEvaluate.apply(checkContext, params)).toBe(false);
    expect(checkContext._data).toBeNull();
  });

  it('returns false if applied to an invalid role', function () {
    const params = checkSetup('<input id="target" role="foo">');
    expect(checkEvaluate.apply(checkContext, params)).toBe(false);
    expect(checkContext._data).toBeNull();
  });

  describe('with fallback roles', function () {
    it('returns true if the deprecated role is the first valid role', function () {
      axe.configure({
        standards: {
          ariaRoles: {
            melon: {
              type: 'widget',
              deprecated: true
            }
          }
        }
      });
      const params = checkSetup(
        '<div id="target" role="foo widget melon button">Contents</div>'
      );
      expect(checkEvaluate.apply(checkContext, params)).toBe(true);
      expect(checkContext._data).toEqual('melon');
    });

    it('returns false if the deprecated role is not the first valid role', function () {
      axe.configure({
        standards: {
          ariaRoles: {
            melon: {
              type: 'widget',
              deprecated: true
            }
          }
        }
      });
      const params = checkSetup(
        '<div id="target" role="button melon widget">Contents</div>'
      );
      expect(checkEvaluate.apply(checkContext, params)).toBe(false);
      expect(checkContext._data).toBeNull();
    });
  });
});
