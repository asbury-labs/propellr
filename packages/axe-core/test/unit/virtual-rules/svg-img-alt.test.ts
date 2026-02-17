import { describe, it, expect } from 'vitest';
import axe from '../../../dist/axe.js';

describe('svg-img-alt virtual-rule', function () {
  it('should pass for aria-label', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'svg',
      attributes: { role: 'img', 'aria-label': 'foobar' }
    });
    const results = axe.runVirtualRule('svg-img-alt', node);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should incomplete for aria-labelledby', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'svg',
      attributes: { role: 'graphics-document', 'aria-labelledby': 'foobar' }
    });
    const results = axe.runVirtualRule('svg-img-alt', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });
  it('should pass for title', function () {
    const parent = new axe.SerialVirtualNode({ nodeName: 'svg' });
    const node = new axe.SerialVirtualNode({
      nodeName: 'circle',
      attributes: { role: 'graphics-symbol', title: 'foobar' }
    });
    node.children = [];
    node.parent = parent;
    parent.children = [node];
    const results = axe.runVirtualRule('svg-img-alt', node);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should pass for title element', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'svg',
      attributes: { role: 'img' }
    });
    const title = new axe.SerialVirtualNode({ nodeName: 'title' });
    const text = new axe.SerialVirtualNode({
      nodeName: '#text',
      nodeType: 3,
      nodeValue: 'foobar'
    });
    title.children = [text];
    title.parent = node;
    node.children = [title];
    const results = axe.runVirtualRule('svg-img-alt', node);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should incomplete when aria-label and children are missing', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'svg',
      attributes: { role: 'img' }
    });
    const results = axe.runVirtualRule('svg-img-alt', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });
  it('should fail when aria-label contains only whitespace', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'svg',
      attributes: { role: 'img', 'aria-label': ' \t   \n   ' }
    });
    node.children = [];
    const results = axe.runVirtualRule('svg-img-alt', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail when aria-label is empty', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'svg',
      attributes: { role: 'img', 'aria-label': '' }
    });
    node.children = [];
    const results = axe.runVirtualRule('svg-img-alt', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail when title is empty', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'svg',
      attributes: { role: 'img', title: '' }
    });
    node.children = [];
    const results = axe.runVirtualRule('svg-img-alt', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should incomplete when title element has missing children', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'svg',
      attributes: { role: 'img' }
    });
    const title = new axe.SerialVirtualNode({ nodeName: 'title' });
    title.parent = node;
    node.children = [title];
    const results = axe.runVirtualRule('svg-img-alt', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });
});
