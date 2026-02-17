import { describe, it, expect } from 'vitest';
import axe from '../../../dist/axe.js';

describe('aria-toggle-field-name virtual-rule', function () {
  it('should pass for aria-label', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'menuitemcheckbox', 'aria-label': 'foobar' }
    });
    node.parent = null;
    const results = axe.runVirtualRule('aria-toggle-field-name', node);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should incomplete for aria-labelledby', function () {
    const results = axe.runVirtualRule('aria-toggle-field-name', {
      nodeName: 'div',
      attributes: { role: 'menuitemradio', 'aria-labelledby': 'foobar' }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });

  it('should pass for title', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'checkbox', title: 'foobar' }
    });
    node.children = [];
    node.parent = null;
    const results = axe.runVirtualRule('aria-toggle-field-name', node);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should pass for visible text content', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'radio' }
    });
    const child = new axe.SerialVirtualNode({
      nodeName: '#text',
      nodeType: 3,
      nodeValue: 'foobar'
    });
    node.children = [child];
    node.parent = null;
    const results = axe.runVirtualRule('aria-toggle-field-name', node);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail for hidden text', function () {
    const button = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'radio' }
    });
    const span = new axe.SerialVirtualNode({
      nodeName: 'span',
      attributes: { 'aria-hidden': true }
    });
    span.parent = button;
    button.children = [span];
    const text = new axe.SerialVirtualNode({
      nodeName: '#text',
      nodeType: 3,
      nodeValue: 'foobar'
    });
    text.parent = span;
    span.children = [text];
    const results = axe.runVirtualRule('aria-toggle-field-name', button);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should incomplete when children are missing', function () {
    const results = axe.runVirtualRule('aria-toggle-field-name', {
      nodeName: 'div',
      attributes: { role: 'switch' }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });

  it('should fail children contain no visible text', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'option' }
    });
    node.children = [];
    const results = axe.runVirtualRule('aria-toggle-field-name', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail when aria-label contains only whitespace', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'menuitemcheckbox', 'aria-label': ' \t   \n   ' }
    });
    node.children = [];
    const results = axe.runVirtualRule('aria-toggle-field-name', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail when aria-label is empty', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'menuitemcheckbox', 'aria-label': '' }
    });
    node.children = [];
    const results = axe.runVirtualRule('aria-toggle-field-name', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail when title is empty', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'menuitemcheckbox', title: '' }
    });
    node.children = [];
    const results = axe.runVirtualRule('aria-toggle-field-name', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should incomplete if has explicit and implicit label', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'menuitemcheckbox', 'aria-label': 'name' }
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
    const results = axe.runVirtualRule('aria-toggle-field-name', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });
});
