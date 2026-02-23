import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import { queryFixture } from '../../../testutils';

declare const axe: any;
describe('aria.getRoleType', function () {
  const getRoleType = axe.commons.aria.getRoleType;

  beforeEach(function () {
    axe._load({});
    axe.configure({
      standards: {
        ariaRoles: {
          cats: {
            type: 'stuff'
          }
        }
      }
    });
  });

  afterEach(function () {
    axe.reset();
  });

  it('should return the type from the lookup table', function () {
    expect(getRoleType('cats')).toBe('stuff');
  });

  it('should return null if role is not found in the lookup table', function () {
    expect(getRoleType('dogs')).toBeNull();
  });

  it('should return null when passed null', function () {
    expect(getRoleType(null)).toBeNull();
  });

  it('should return null when passed undefined', function () {
    expect(getRoleType(undefined)).toBeNull();
  });

  it('returns the type from the role of a virtual node', function () {
    const vNode = queryFixture('<span id="target" role="cats"></span>');
    expect(getRoleType(vNode)).toBe('stuff');
  });

  it('returns the type from the role of a DOM node', function () {
    const domNode = queryFixture(
      '<span id="target" role="cats"></span>'
    ).actualNode;
    expect(getRoleType(domNode)).toBe('stuff');
  });
});
