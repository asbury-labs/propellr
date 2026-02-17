import { describe, it, expect } from 'vitest';
import axe from '../../../dist/axe.js';

describe('label virtual-rule', function () {
  it('should not apply if input type is hidden', function () {
    const results = axe.runVirtualRule('label', {
      nodeName: 'input',
      attributes: { type: 'hidden' }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
    expect(results.inapplicable).toHaveLength(1);
  });
  it('should pass for aria-label (input)', function () {
    const results = axe.runVirtualRule('label', {
      nodeName: 'input',
      attributes: { 'aria-label': 'foobar' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should pass for aria-label (textarea)', function () {
    const results = axe.runVirtualRule('label', {
      nodeName: 'textarea',
      attributes: { 'aria-label': 'foobar' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should incomplete for aria-labelledby', function () {
    const results = axe.runVirtualRule('label', {
      nodeName: 'input',
      attributes: { 'aria-labelledby': 'foobar' }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });
  it('should pass for implicit label', function () {
    const node = new axe.SerialVirtualNode({ nodeName: 'input' });
    const parent = new axe.SerialVirtualNode({ nodeName: 'label' });
    const child = new axe.SerialVirtualNode({
      nodeName: '#text',
      nodeType: 3,
      nodeValue: 'foobar'
    });
    node.parent = parent;
    parent.children = [child, node];
    const results = axe.runVirtualRule('label', node);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should incomplete for explicit label', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'input',
      attributes: { id: 'foobar' }
    });
    const results = axe.runVirtualRule('label', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });
  it('should pass for title', function () {
    const results = axe.runVirtualRule('label', {
      nodeName: 'input',
      attributes: { title: 'foobar' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should pass for role=presentation when disabled', function () {
    const results = axe.runVirtualRule('label', {
      nodeName: 'input',
      attributes: { role: 'presentation', disabled: true }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should pass for role=none when disabled', function () {
    const results = axe.runVirtualRule('label', {
      nodeName: 'input',
      attributes: { role: 'none', disabled: true }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should incomplete for both missing aria-label and implicit label', function () {
    const results = axe.runVirtualRule('label', {
      nodeName: 'input',
      attributes: { 'aria-label': '' }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });
  it('should fail when aria-label contains only whitespace and no implicit label', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'input',
      attributes: { 'aria-label': ' \t   \n   ' }
    });
    node.parent = null;
    const results = axe.runVirtualRule('label', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail when aria-label is empty and no implicit label', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'input',
      attributes: { 'aria-label': '' }
    });
    node.parent = null;
    const results = axe.runVirtualRule('label', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail when title is empty and no implicit label', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'input',
      attributes: { title: '' }
    });
    node.parent = null;
    const results = axe.runVirtualRule('label', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail for role=presentation', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'input',
      attributes: { role: 'presentation' }
    });
    node.parent = null;
    const results = axe.runVirtualRule('label', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail for role=none', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'input',
      attributes: { role: 'presentation' }
    });
    node.parent = null;
    const results = axe.runVirtualRule('label', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
});
