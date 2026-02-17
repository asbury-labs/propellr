import { describe, it, expect } from 'vitest';
import axe from '../../../dist/axe.js';

describe('nested-interactive virtual-rule', function () {
  it('should pass for element without focusable content', function () {
    const node = new axe.SerialVirtualNode({ nodeName: 'button' });
    const child = new axe.SerialVirtualNode({
      nodeName: '#text',
      nodeType: 3,
      nodeValue: 'Hello World'
    });
    node.children = [child];
    const results = axe.runVirtualRule('nested-interactive', node);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should pass for aria element without focusable content', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'button' }
    });
    const child = new axe.SerialVirtualNode({
      nodeName: '#text',
      nodeType: 3,
      nodeValue: 'Hello World'
    });
    node.children = [child];
    const results = axe.runVirtualRule('nested-interactive', node);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should pass for element with non-widget content which has negative tabindex', function () {
    const node = new axe.SerialVirtualNode({ nodeName: 'button' });
    const child = new axe.SerialVirtualNode({
      nodeName: 'span',
      attributes: { tabindex: -1 }
    });
    child.children = [];
    node.children = [child];
    const results = axe.runVirtualRule('nested-interactive', node);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should pass for empty element without', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'button' }
    });
    node.children = [];
    const results = axe.runVirtualRule('nested-interactive', node);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should pass for element with non-widget content', function () {
    const node = new axe.SerialVirtualNode({ nodeName: 'button' });
    const child = new axe.SerialVirtualNode({
      nodeName: 'span',
      attributes: { tabindex: 1 }
    });
    child.children = [];
    node.children = [child];
    const results = axe.runVirtualRule('nested-interactive', node);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail for element with native widget content', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'button' }
    });
    const child = new axe.SerialVirtualNode({ nodeName: 'button' });
    child.children = [];
    node.children = [child];
    const results = axe.runVirtualRule('nested-interactive', node);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should return incomplete if element has undefined children', function () {
    const node = new axe.SerialVirtualNode({ nodeName: 'button' });
    const results = axe.runVirtualRule('nested-interactive', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });
  it('should return incomplete if descendant has undefined children', function () {
    const node = new axe.SerialVirtualNode({ nodeName: 'button' });
    const child = new axe.SerialVirtualNode({ nodeName: 'span' });
    node.children = [child];
    const results = axe.runVirtualRule('nested-interactive', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });
});
