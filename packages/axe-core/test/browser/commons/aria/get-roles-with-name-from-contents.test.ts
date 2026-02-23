import { describe, it, beforeAll, afterEach, expect } from 'vitest';

declare const axe: any;
describe('aria.getRolesWithNameFromContents', function () {
  beforeAll(function () {
    axe._load({});
  });

  afterEach(function () {
    axe.reset();
  });

  it('should return array if nameFrom contents is found in the lookup table', function () {
    axe.configure({
      standards: {
        ariaRoles: {
          dogs: {
            type: 'things',
            nameFromContent: true
          },
          cats: {
            type: 'stuff'
          }
        }
      }
    });
    expect(axe.commons.aria.getRolesWithNameFromContents()).toContain('dogs');
  });
});
