import { describe, it, expect } from 'vitest';
import { flatTreeSetup } from '../../../testutils';

declare const axe: any;
describe('forms.isAriaListbox', function () {
  const isAriaListbox = axe.commons.forms.isAriaListbox;

  it('returns true for an element with role=listbox', function () {
    const node = document.createElement('div');
    node.setAttribute('role', 'listbox');
    flatTreeSetup(node);
    expect(isAriaListbox(node)).toBe(true);
  });

  it('returns false for elements without role', function () {
    const node = document.createElement('div');
    flatTreeSetup(node);
    expect(isAriaListbox(node)).toBe(false);
  });

  it('returns false for elements with incorrect role', function () {
    const node = document.createElement('div');
    node.setAttribute('role', 'main');
    flatTreeSetup(node);
    expect(isAriaListbox(node)).toBe(false);
  });

  it('returns false for native select', function () {
    const node = document.createElement('select');
    flatTreeSetup(node);
    expect(isAriaListbox(node)).toBe(false);
  });
});
