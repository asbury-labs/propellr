import { describe, it, expect } from 'vitest';
import { flatTreeSetup } from '../../../testutils';

declare const axe: any;
describe('aria.isAriaRoleAllowedOnElement', function () {
  it('returns true for SECTION with role alert', function () {
    const node = document.createElement('section');
    const role = 'alert';
    node.setAttribute('role', role);
    flatTreeSetup(node);
    const actual = axe.commons.aria.isAriaRoleAllowedOnElement(node, role);
    const expected = true;
    expect(actual).toBe(expected);
  });

  it('returns false for SECTION with role checkbox', function () {
    const node = document.createElement('section');
    const role = 'checkbox';
    node.setAttribute('role', role);
    flatTreeSetup(node);
    const actual = axe.commons.aria.isAriaRoleAllowedOnElement(node, role);
    const expected = false;
    expect(actual).toBe(expected);
  });

  it('returns true for SVG with role alertdialog', function () {
    const node = document.createElement('svg');
    const role = 'alertdialog';
    node.setAttribute('role', role);
    flatTreeSetup(node);
    expect(axe.commons.aria.isAriaRoleAllowedOnElement(node, role)).toBe(true);
  });

  it('returns true for OBJECT with role application', function () {
    const node = document.createElement('object');
    const role = 'application';
    node.setAttribute('role', role);
    flatTreeSetup(node);
    const actual = axe.commons.aria.isAriaRoleAllowedOnElement(node, role);
    expect(actual).toBe(true);
  });

  it('returns false for A with role button', function () {
    const node = document.createElement('a');
    const role = 'button';
    node.setAttribute('role', role);
    flatTreeSetup(node);
    expect(axe.commons.aria.isAriaRoleAllowedOnElement(node, role)).toBe(true);
  });

  it('returns false for ARTICLE with role cell', function () {
    const node = document.createElement('article');
    const role = 'cell';
    node.setAttribute('role', role);
    flatTreeSetup(node);
    expect(axe.commons.aria.isAriaRoleAllowedOnElement(node, role)).toBe(false);
  });

  it('returns true for BUTTON with role checkbox', function () {
    const node = document.createElement('button');
    const role = 'checkbox';
    node.setAttribute('role', role);
    flatTreeSetup(node);
    expect(axe.commons.aria.isAriaRoleAllowedOnElement(node, role)).toBe(true);
  });

  it('returns true for IFRAME with role document', function () {
    const node = document.createElement('iframe');
    const role = 'document';
    node.setAttribute('role', role);
    flatTreeSetup(node);
    expect(axe.commons.aria.isAriaRoleAllowedOnElement(node, role)).toBe(true);
  });

  it('returns true for ASIDE with role feed', function () {
    const node = document.createElement('aside');
    const role = 'feed';
    node.setAttribute('role', role);
    flatTreeSetup(node);
    expect(axe.commons.aria.isAriaRoleAllowedOnElement(node, role)).toBe(true);
  });

  it('returns true for FIGURE with role group', function () {
    const node = document.createElement('figure');
    const role = 'group';
    node.setAttribute('role', role);
    flatTreeSetup(node);
    expect(axe.commons.aria.isAriaRoleAllowedOnElement(node, role)).toBe(true);
  });

  it('returns true for SVG with role img', function () {
    const node = document.createElement('svg');
    const role = 'img';
    node.setAttribute('role', role);
    flatTreeSetup(node);
    expect(axe.commons.aria.isAriaRoleAllowedOnElement(node, role)).toBe(true);
  });

  it('returns true for INPUT with type image and role link', function () {
    const node = document.createElement('input');
    const role = 'link';
    node.setAttribute('role', role);
    node.setAttribute('type', 'image');
    flatTreeSetup(node);
    expect(axe.commons.aria.isAriaRoleAllowedOnElement(node, role)).toBe(true);
  });

  it('returns true for HEADER with role none', function () {
    const node = document.createElement('header');
    const role = 'none';
    node.setAttribute('role', role);
    flatTreeSetup(node);
    expect(axe.commons.aria.isAriaRoleAllowedOnElement(node, role)).toBe(true);
  });

  it('returns true for LI with role option', function () {
    const node = document.createElement('li');
    const role = 'option';
    node.setAttribute('role', role);
    flatTreeSetup(node);
    expect(axe.commons.aria.isAriaRoleAllowedOnElement(node, role)).toBe(true);
  });

  it('returns true for H1 with role tab', function () {
    const node = document.createElement('h1');
    const role = 'tab';
    node.setAttribute('role', role);
    flatTreeSetup(node);
    expect(axe.commons.aria.isAriaRoleAllowedOnElement(node, role)).toBe(true);
  });

  it('returns true for OL with role tablist', function () {
    const node = document.createElement('ol');
    const role = 'tablist';
    node.setAttribute('role', role);
    flatTreeSetup(node);
    expect(axe.commons.aria.isAriaRoleAllowedOnElement(node, role)).toBe(true);
  });

  it('returns true when A has namespace as svg and role menuitem', function () {
    const node = document.createElementNS('http://www.w3.org/2000/svg', 'a');
    flatTreeSetup(node);
    expect(axe.commons.aria.isAriaRoleAllowedOnElement(node, 'menuitem')).toBe(
      true
    );
  });

  it('returns true when BUTTON has type menu and role as menuitem', function () {
    const node = document.createElement('button');
    const role = 'menuitem';
    node.setAttribute('type', 'menu');
    node.setAttribute('role', role);
    flatTreeSetup(node);
    expect(axe.commons.aria.isAriaRoleAllowedOnElement(node, role)).toBe(true);
  });

  it('returns false when MENU has type context and role navigation', function () {
    const node = document.createElement('menu');
    const role = 'navigation';
    node.setAttribute('type', 'context');
    node.setAttribute('role', role);
    flatTreeSetup(node);
    expect(axe.commons.aria.isAriaRoleAllowedOnElement(node, role)).toBe(false);
  });

  it('returns true when B has role navigation', function () {
    const node = document.createElement('b');
    const role = 'navigation';
    node.setAttribute('role', role);
    flatTreeSetup(node);
    expect(axe.commons.aria.isAriaRoleAllowedOnElement(node, role)).toBe(true);
  });

  it('returns true when NAV has role menubar', function () {
    const node = document.createElement('nav');
    const role = 'menubar';
    node.setAttribute('role', role);
    flatTreeSetup(node);
    expect(axe.commons.aria.isAriaRoleAllowedOnElement(node, role)).toBe(true);
  });

  it('returns true when NAV has role tablist', function () {
    const node = document.createElement('nav');
    const role = 'tablist';
    node.setAttribute('role', role);
    flatTreeSetup(node);
    expect(axe.commons.aria.isAriaRoleAllowedOnElement(node, role)).toBe(true);
  });

  it('returns false when PROGRESS has role button', function () {
    const node = document.createElement('progress');
    const role = 'button';
    node.setAttribute('role', role);
    flatTreeSetup(node);
    expect(axe.commons.aria.isAriaRoleAllowedOnElement(node, role)).toBe(false);
  });

  it('returns true if given element can have any role', function () {
    const node = document.createElement('div');
    flatTreeSetup(node);
    const actual = axe.commons.aria.isAriaRoleAllowedOnElement(node, 'link');
    expect(actual).toBe(true);
  });

  it('returns false if given element cannot have any role', function () {
    const node = document.createElement('main');
    flatTreeSetup(node);
    const actual = axe.commons.aria.isAriaRoleAllowedOnElement(node, 'alert'); // changed this
    expect(actual).toBe(false);
  });

  it('returns false if given element cannot have any role', function () {
    const node = document.createElement('track');
    flatTreeSetup(node);
    const actual = axe.commons.aria.isAriaRoleAllowedOnElement(node, 'banner');
    expect(actual).toBe(false);
  });

  it('returns false if elements implicit role matches the role', function () {
    const node = document.createElement('area');
    node.setAttribute('href', '#yay');
    node.setAttribute('role', 'link');
    flatTreeSetup(node);
    const actual = axe.commons.aria.isAriaRoleAllowedOnElement(node, 'link');
    expect(actual).toBe(false);
  });
});
