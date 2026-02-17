import { describe, it, expect } from 'vitest';
import axe from '../../../dist/axe.js';

describe('aria-dialog-name virtual-rule', function () {
  it('should pass for aria-label', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'dialog', 'aria-label': 'foobar' }
    });
    node.parent = null;
    const results = axe.runVirtualRule('aria-dialog-name', node);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should incomplete for aria-labelledby', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'dialog', 'aria-labelledby': 'foobar' }
    });
    node.parent = null;
    const results = axe.runVirtualRule('aria-dialog-name', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });

  it('should pass for title', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'alertdialog', title: 'foobar' }
    });
    node.children = [];
    node.parent = null;
    const results = axe.runVirtualRule('aria-dialog-name', node);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail when aria-label contains only whitespace', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'alertdialog', 'aria-label': ' \t   \n   ' }
    });
    node.children = [];
    const results = axe.runVirtualRule('aria-dialog-name', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail when title is empty', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'dialog', title: '' }
    });
    node.children = [];
    const results = axe.runVirtualRule('aria-dialog-name', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
});
