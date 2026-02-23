import { describe, it, expect } from 'vitest';
import { flatTreeSetup } from '../../../testutils';

declare const axe: any;
describe('aria.getElementUnallowedRoles', function () {
  const getElementUnallowedRoles = axe.commons.aria.getElementUnallowedRoles;

  it('returns unallowed role=application when used on a input elm', function () {
    const node = document.createElement('input');
    const role = 'application';
    node.setAttribute('type', '');
    node.setAttribute('aria-pressed', '');
    node.setAttribute('role', role);
    flatTreeSetup(node);
    const actual = getElementUnallowedRoles(node);
    expect(actual.length).toBeGreaterThan(0);
    expect(actual).toContain(role);
  });

  it('returns empty on type=checkbox and aria-pressed attr on input elm', function () {
    const node = document.createElement('input');
    node.setAttribute('type', 'checkbox');
    node.setAttribute('aria-pressed', '');
    flatTreeSetup(node);
    const actual = getElementUnallowedRoles(node);
    expect(actual).toHaveLength(0);
  });

  it('returns unallowed role=menubar when used on a li elm', function () {
    const node = document.createElement('li');
    const role = 'menubar';
    node.setAttribute('role', role);
    flatTreeSetup(node);
    const actual = getElementUnallowedRoles(node);
    expect(actual, role.length).toBeGreaterThan(0);
  });

  it('returns empty on role=menuitemcheckbox with type=button on input elm', function () {
    const node = document.createElement('input');
    const role = 'menuitemcheckbox';
    node.setAttribute('role', role);
    node.setAttribute('type', 'button');
    flatTreeSetup(node);
    const actual = getElementUnallowedRoles(node);
    expect(actual).toHaveLength(0);
  });

  it('returns unallowed role=option when used on section elm', function () {
    const node = document.createElement('section');
    const role = 'option';
    node.setAttribute('role', role);
    flatTreeSetup(node);
    const actual = getElementUnallowedRoles(node);
    expect(actual.length).toBeGreaterThan(0);
    expect(actual).toContain(role);
  });

  it('returns empty on role=menuitemradio and type=radio on input elm', function () {
    const node = document.createElement('input');
    const role = 'menuitemradio';
    node.setAttribute('role', role);
    node.setAttribute('type', 'radio');
    flatTreeSetup(node);
    const actual = getElementUnallowedRoles(node);
    expect(actual).toHaveLength(0);
  });

  it('returns unallowed role=textbox on a input elm and  allowImplicit is true (default)', function () {
    const node = document.createElement('input');
    const role = 'textbox';
    node.setAttribute('role', role);
    flatTreeSetup(node);
    const actual = getElementUnallowedRoles(node, true);
    expect(actual, role).toHaveLength(0);
  });

  it('returns empty on role=button on div elm when role is not implicit and allowImplicit: false', function () {
    const node = document.createElement('div');
    node.setAttribute('role', 'button');
    flatTreeSetup(node);
    const actual = getElementUnallowedRoles(node, false);
    expect(actual).toHaveLength(0);
  });

  it('returns unallowed role=contentinfo on footer elm and allowImplicit: false', function () {
    const node = document.createElement('footer');
    node.setAttribute('role', 'contentinfo');
    flatTreeSetup(node);
    const actual = getElementUnallowedRoles(node, false);
    expect(actual, 'contentinfo'.length).toBeGreaterThan(0);
  });

  it('returns unallowed role=banner on header elm and allowImplicit:false', function () {
    const node = document.createElement('header');
    node.setAttribute('role', 'banner');
    flatTreeSetup(node);
    const actual = getElementUnallowedRoles(node, false);
    expect(actual, 'banner'.length).toBeGreaterThan(0);
  });

  it('returns empty on role=contentinfo on footer elm when allowImplicit:true', function () {
    const node = document.createElement('footer');
    node.setAttribute('role', 'contentinfo');
    flatTreeSetup(node);
    const actual = getElementUnallowedRoles(node);
    expect(actual).toHaveLength(0);
  });

  it('returns empty on role=banner on header elm when allowImplicit:true', function () {
    const node = document.createElement('header');
    node.setAttribute('role', 'banner');
    flatTreeSetup(node);
    const actual = getElementUnallowedRoles(node);
    expect(actual).toHaveLength(0);
  });

  it('returns empty role=doc-backlink on anchor elm and allowImplicit:false', function () {
    const node = document.createElement('a');
    node.setAttribute('href', '#');
    node.setAttribute('role', 'doc-backlink');
    flatTreeSetup(node);
    const actual = getElementUnallowedRoles(node, false);
    expect(actual).toHaveLength(0);
  });

  it('returns empty on role=doc-backlink on anchor elm when allowImplicit:true', function () {
    const node = document.createElement('a');
    node.setAttribute('href', '#');
    node.setAttribute('role', 'doc-backlink');
    flatTreeSetup(node);
    const actual = getElementUnallowedRoles(node);
    expect(actual).toHaveLength(0);
  });

  it('returns unallowed role=doc-backlink on anchor elm without href attr and allowImplicit:false', function () {
    const node = document.createElement('a');
    node.setAttribute('role', 'doc-backlink');
    flatTreeSetup(node);
    const actual = getElementUnallowedRoles(node, false);
    expect(actual, 'doc-backlink'.length).toBeGreaterThan(0);
  });

  it('returns unallowed role=doc-backlink on anchor elm without href attr and allowImplicit:true', function () {
    const node = document.createElement('a');
    node.setAttribute('role', 'doc-backlink');
    flatTreeSetup(node);
    const actual = getElementUnallowedRoles(node);
    expect(actual, 'doc-backlink'.length).toBeGreaterThan(0);
  });

  it('returns empty role=banner on header elm when using axe.configure and allowImplicit:false', function () {
    axe.configure({
      standards: {
        htmlElms: {
          header: {
            contentTypes: 'flow',
            allowedRoles: ['banner']
          }
        }
      }
    });
    const node = document.createElement('header');
    node.setAttribute('role', 'banner');
    flatTreeSetup(node);
    const actual = getElementUnallowedRoles(node, false);
    expect(actual).toHaveLength(0);
  });

  it('returns empty role=contentinfo on footer elm when using axe.configure and allowImplicit:false', function () {
    axe.configure({
      standards: {
        htmlElms: {
          footer: {
            contentTypes: 'flow',
            allowedRoles: ['contentinfo']
          }
        }
      }
    });
    const node = document.createElement('footer');
    node.setAttribute('role', 'contentinfo');
    flatTreeSetup(node);
    const actual = getElementUnallowedRoles(node, false);
    expect(actual).toHaveLength(0);
  });

  it('returns unallowed role=row when when used on TR element and allowImplicit:false', function () {
    const node = document.createElement('tr');
    node.setAttribute('role', 'row');
    flatTreeSetup(node);
    const actual = getElementUnallowedRoles(node, false);
    expect(actual, 'row'.length).toBeGreaterThan(0);
  });

  it('returns empty on type=checkbox and aria-pressed attr on SerialVirtualNode with a input elm', function () {
    const vNode = new axe.SerialVirtualNode({
      nodeName: 'input',
      attributes: {
        type: 'checkbox',
        'aria-pressed': ''
      }
    });
    const actual = getElementUnallowedRoles(vNode);
    expect(actual).toHaveLength(0);
  });

  it('returns unallowed role=application for a SerialVirtualNode with a input elm', function () {
    const vNode = new axe.SerialVirtualNode({
      nodeName: 'input',
      attributes: {
        role: 'application',
        type: '',
        'aria-pressed': ''
      }
    });
    const actual = getElementUnallowedRoles(vNode);
    expect(actual.length).toBeGreaterThan(0);
    expect(actual).toContain('application');
  });
});
