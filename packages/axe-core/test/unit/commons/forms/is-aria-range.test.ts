import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('forms.isAriaRange', function () {
  const isAriaRange = axe.commons.forms.isAriaRange;
  const flatTreeSetup = axe.testUtils.flatTreeSetup;

  it('returns true for an element with range roles', function () {
    const rangeRoles = ['progressbar', 'scrollbar', 'slider', 'spinbutton'];
    rangeRoles.forEach(function (role) {
      const node = document.createElement('div');
      node.setAttribute('role', role);
      node.setAttribute('aria-valuenow', '0');
      flatTreeSetup(node);
      expect(
        isAriaRange(node),
        'role="' + role + '" is not an aria range role'
      ).toBe(true);
    });
  });

  it('returns false for elements without role', function () {
    const node = document.createElement('div');
    flatTreeSetup(node);
    expect(isAriaRange(node)).toBe(false);
  });

  it('returns false for elements with incorrect role', function () {
    const node = document.createElement('div');
    node.setAttribute('role', 'main');
    flatTreeSetup(node);
    expect(isAriaRange(node)).toBe(false);
  });

  it('returns false for native range elements', function () {
    const nativeRangeElements = [
      {
        nodeName: 'progress'
      },
      {
        nodeName: 'input',
        type: 'range'
      },
      {
        nodeName: 'input',
        type: 'number'
      }
    ];
    nativeRangeElements.forEach(function (elm) {
      const node = document.createElement(elm.nodeName);
      if (elm.type) {
        node.setAttribute('type', elm.type);
      }
      flatTreeSetup(node);
      expect(
        isAriaRange(node),
        node.outterHTML + ' is not an aria range element'
      ).toBe(false);
    });
  });
});
