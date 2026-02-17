import { describe, it, expect } from 'vitest';
import axe from '../../../dist/axe.js';

describe('aria-text virtual-rule', function () {
  it('should incomplete for element with undefined children', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'text' }
    });
    const results = axe.runVirtualRule('aria-text', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });

  it('should fail for focusable widget children', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'text' }
    });
    const child = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'button', tabindex: 0 }
    });
    node.children = [child];
    const results = axe.runVirtualRule('aria-text', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail for children with native focus', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'text' }
    });
    const child = new axe.SerialVirtualNode({ nodeName: 'button' });
    node.children = [child];
    const results = axe.runVirtualRule('aria-text', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should pass if element only has descendants that are not focusable', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'text' }
    });
    const child = new axe.SerialVirtualNode({ nodeName: 'span' });
    const grandchild = new axe.SerialVirtualNode({
      nodeName: '#text',
      nodeType: 3,
      nodeValue: 'hello'
    });
    child.children = [grandchild];
    node.children = [child];
    const results = axe.runVirtualRule('aria-text', node);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail for deeply nested focusable children', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'text' }
    });
    const child = new axe.SerialVirtualNode({ nodeName: 'div' });
    const grandchild = new axe.SerialVirtualNode({ nodeName: 'div' });
    const greatgrandchild = new axe.SerialVirtualNode({ nodeName: 'button' });
    greatgrandchild.parent = grandchild;
    grandchild.children = [greatgrandchild];
    child.children = [grandchild];
    node.children = [child];
    const results = axe.runVirtualRule('aria-text', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail when tabIndex is negative', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'text' }
    });
    const child = new axe.SerialVirtualNode({
      nodeName: 'a',
      attributes: { tabindex: '-1', href: '#' }
    });
    node.children = [child];
    const results = axe.runVirtualRule('aria-text', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should pass when an anchor has no href and has implicit role of link', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'text' }
    });
    const child = new axe.SerialVirtualNode({
      nodeName: 'a',
      attributes: { tabindex: '-1' }
    });
    child.children = [];
    node.children = [child];
    const results = axe.runVirtualRule('aria-text', node);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
    expect(results.passes).toHaveLength(1);
  });

  it('should incomplete when vNode has no children and is type 1', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'text', nodeType: 1 }
    });
    const results = axe.runVirtualRule('aria-text', node);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
    expect(results.passes).toHaveLength(0);
  });

  it('should fail when tabIndex is NaN', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'text' }
    });
    const child = new axe.SerialVirtualNode({
      nodeName: 'a',
      attributes: { tabindex: 'foo', href: '#' }
    });
    node.children = [child];
    const results = axe.runVirtualRule('aria-text', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
});
