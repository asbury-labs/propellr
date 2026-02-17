import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('forms.isAriaTextbox', function () {
  const isAriaTextbox = axe.commons.forms.isAriaTextbox;
  const flatTreeSetup = axe.testUtils.flatTreeSetup;

  it('returns true for an element with role=textbox', function () {
    const node = document.createElement('div');
    node.setAttribute('role', 'textbox');
    flatTreeSetup(node);
    expect(isAriaTextbox(node)).toBe(true);
  });

  it('returns false for elements without role', function () {
    const node = document.createElement('div');
    flatTreeSetup(node);
    expect(isAriaTextbox(node)).toBe(false);
  });

  it('returns false for elements with incorrect role', function () {
    const node = document.createElement('div');
    node.setAttribute('role', 'main');
    flatTreeSetup(node);
    expect(isAriaTextbox(node)).toBe(false);
  });

  it('returns false for native textbox inputs', function () {
    const node = document.createElement('input');
    node.setAttribute('type', 'text');
    flatTreeSetup(node);
    expect(isAriaTextbox(node)).toBe(false);
  });
});
