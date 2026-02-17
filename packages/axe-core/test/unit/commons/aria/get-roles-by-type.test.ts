import { describe, it, beforeAll, afterEach, expect } from 'vitest';

declare const axe: any;
describe('aria.getRolesByType', function () {
  beforeAll(function () {
    axe._load({});
  });

  afterEach(function () {
    axe.reset();
  });

  it('should return array if roletype is found in the lookup table', function () {
    axe.configure({
      standards: {
        ariaRoles: {
          dogs: {
            type: 'things'
          },
          cats: {
            type: 'stuff'
          }
        }
      }
    });
    expect(axe.commons.aria.getRolesByType('stuff')).toEqual(['cats']);
  });

  it('should return empty array if role is not found in the lookup table', function () {
    expect(axe.commons.aria.getRolesByType('blahblahblah')).toEqual([]);
  });
});
