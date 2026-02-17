import { describe, it, expect } from 'vitest';
import axe from '../../../dist/axe.js';

describe('aria-input-field-name virtual-rule', function () {
  it('should pass for aria-label', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'combobox', 'aria-label': 'foobar' }
    });
    node.parent = null;
    const results = axe.runVirtualRule('aria-input-field-name', node);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should incomplete for aria-labelledby', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'listbox', 'aria-labelledby': 'foobar' }
    });
    node.parent = null;
    const results = axe.runVirtualRule('aria-input-field-name', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });

  it('should pass for title', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'searchbox', title: 'foobar' }
    });
    node.children = [];
    node.parent = null;
    const results = axe.runVirtualRule('aria-input-field-name', node);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail when aria-label contains only whitespace', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'spinbutton', 'aria-label': ' \t   \n   ' }
    });
    node.children = [];
    const results = axe.runVirtualRule('aria-input-field-name', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail when aria-label is empty', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'textbox', 'aria-label': '' }
    });
    node.children = [];
    const results = axe.runVirtualRule('aria-input-field-name', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail when title is empty', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'combobox', title: '' }
    });
    node.children = [];
    const results = axe.runVirtualRule('aria-input-field-name', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should incomplete if has explicit and implicit label', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'listbox', 'aria-label': 'name' }
    });
    const parent = new axe.SerialVirtualNode({ nodeName: 'label' });
    const child = new axe.SerialVirtualNode({
      nodeName: '#text',
      nodeType: 3,
      nodeValue: 'first name'
    });
    node.parent = parent;
    node.children = [];
    parent.children = [child, node];
    const results = axe.runVirtualRule('aria-input-field-name', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });
});
