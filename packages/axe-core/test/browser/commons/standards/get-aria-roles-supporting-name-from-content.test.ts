import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('standards.getAriaRolesSupportingNameFromContent', function () {
  const getAriaRolesSupportingNameFromContent =
    axe.commons.standards.getAriaRolesSupportingNameFromContent;

  it('should return a list of role names which are named from content', function () {
    // first remove all namedFromContent
    const roleNames = Object.keys(axe._audit.standards.ariaRoles);
    const ariaRoles = {};
    for (let i = 0; i < roleNames.length; i++) {
      ariaRoles[roleNames[i]] = { nameFromContent: false };
    }

    // then turn on a few specific roles
    ariaRoles.button = { nameFromContent: true };
    ariaRoles.cell = { nameFromContent: true };
    ariaRoles.checkbox = { nameFromContent: true };
    ariaRoles.columnheader = { nameFromContent: true };

    axe.configure({
      standards: {
        ariaRoles: ariaRoles
      }
    });

    const contentRoles = getAriaRolesSupportingNameFromContent();
    expect(contentRoles).toEqual([
      'button',
      'cell',
      'checkbox',
      'columnheader'
    ]);
  });

  it('should return configured roles', function () {
    axe.configure({
      standards: {
        ariaRoles: {
          myRole: {
            nameFromContent: true
          }
        }
      }
    });

    const contentRoles = getAriaRolesSupportingNameFromContent();
    expect(contentRoles).toContain('myRole');
  });

  it('should not return role that is configured to not be of the type', function () {
    axe.configure({
      standards: {
        ariaRoles: {
          button: {
            nameFromContent: false
          }
        }
      }
    });

    const contentRoles = getAriaRolesSupportingNameFromContent();
    expect(contentRoles).not.toContain('button');
  });
});
