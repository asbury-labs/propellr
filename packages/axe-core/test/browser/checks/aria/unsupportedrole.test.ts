import { describe, it, expect, afterEach } from 'vitest';
import { checkSetup, checks, MockCheckContext } from '../../../testutils';

declare const axe: any;
describe('unsupportedrole', function () {
  const checkContext = MockCheckContext();
  const check = checks.unsupportedrole;
  afterEach(function () {
    checkContext.reset();
    axe.reset();
  });

  it('should return true if applied to an unsupported role', function () {
    axe.configure({
      standards: {
        ariaRoles: {
          mccheddarton: {
            type: 'widget',
            unsupported: true
          }
        }
      }
    });

    const params = checkSetup(
      '<div id="target" role="mccheddarton">Contents</div>'
    );
    expect(check.evaluate.apply(checkContext, params)).toBe(true);
    expect(checkContext._data).toEqual('mccheddarton');
  });

  it('should return false if applied to a supported role', function () {
    let params = checkSetup('<div id="target" role="alert">Contents</div>');
    expect(check.evaluate.apply(checkContext, params)).toBe(false);
    expect(checkContext._data).toBeNull();

    params = checkSetup('<button id="target">Contents</button>');
    expect(check.evaluate.apply(checkContext, params)).toBe(false);
    expect(checkContext._data).toBeNull();
  });

  it('should return false if applied to an invalid role', function () {
    const params = checkSetup('<input id="target" role="foo">');
    expect(check.evaluate.apply(checkContext, params)).toBe(false);
    expect(checkContext._data).toBeNull();
  });

  it('should return true if applied to an unsupported dpub role', function () {
    axe.configure({
      standards: {
        ariaRoles: {
          'doc-abstract': {
            type: 'section',
            unsupported: true
          }
        }
      }
    });

    const params = checkSetup(
      '<div id="target" role="doc-abstract">Contents</div>'
    );
    expect(check.evaluate.apply(checkContext, params)).toBe(true);
    expect(checkContext._data).toEqual('doc-abstract');
  });

  it('should return true if applied to an unsupported fallback role', function () {
    axe.configure({
      standards: {
        ariaRoles: {
          alert: {
            type: 'widget',
            unsupported: true
          }
        }
      }
    });

    const params = checkSetup(
      '<div id="target" role="unsupported alert">Contents</div>'
    );
    expect(check.evaluate.apply(checkContext, params)).toBe(true);
    expect(checkContext._data).toEqual('alert');
  });
});
