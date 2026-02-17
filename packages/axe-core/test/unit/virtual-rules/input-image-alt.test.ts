import { describe, it, expect } from 'vitest';
import axe from '../../../dist/axe.js';

describe('input-image-alt virtual-rule', () => {
  it('should pass for alt', () => {
    const results = axe.runVirtualRule('input-image-alt', {
      nodeName: 'input',
      attributes: { type: 'image', alt: 'foobar' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should pass for aria-label', () => {
    const results = axe.runVirtualRule('input-image-alt', {
      nodeName: 'input',
      attributes: { type: 'image', 'aria-label': 'foobar' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should incomplete for aria-labelledby', () => {
    const node = new axe.SerialVirtualNode({
      nodeName: 'input',
      attributes: { type: 'image', 'aria-labelledby': 'foobar' }
    });
    node.parent = null;
    const results = axe.runVirtualRule('input-image-alt', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });
  it('should pass for title', () => {
    const results = axe.runVirtualRule('image-alt', {
      nodeName: 'img',
      attributes: { title: 'foobar' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should pass for implicit label', () => {
    const node = new axe.SerialVirtualNode({
      nodeName: 'input',
      attributes: { type: 'image' }
    });
    const parent = new axe.SerialVirtualNode({ nodeName: 'label' });
    const child = new axe.SerialVirtualNode({
      nodeName: '#text',
      nodeType: 3,
      nodeValue: 'foobar'
    });
    node.parent = parent;
    node.children = [];
    parent.children = [child, node];
    const results = axe.runVirtualRule('input-image-alt', node);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should incomplete for explicit label', () => {
    const node = new axe.SerialVirtualNode({
      nodeName: 'input',
      attributes: { type: 'image' }
    });
    const results = axe.runVirtualRule('input-image-alt', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });
  it('should fail when alt is missing', () => {
    const node = new axe.SerialVirtualNode({
      nodeName: 'input',
      attributes: { type: 'image' }
    });
    node.parent = null;
    const results = axe.runVirtualRule('input-image-alt', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail when alt is empty', () => {
    const node = new axe.SerialVirtualNode({
      nodeName: 'input',
      attributes: { type: 'image', alt: '' }
    });
    node.parent = null;
    const results = axe.runVirtualRule('input-image-alt', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail when aria-label is empty', () => {
    const node = new axe.SerialVirtualNode({
      nodeName: 'input',
      attributes: { type: 'image', 'aria-label': '' }
    });
    node.parent = null;
    const results = axe.runVirtualRule('input-image-alt', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail when title is empty', () => {
    const node = new axe.SerialVirtualNode({
      nodeName: 'input',
      attributes: { type: 'image', title: '' }
    });
    node.parent = null;
    const results = axe.runVirtualRule('input-image-alt', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
});
