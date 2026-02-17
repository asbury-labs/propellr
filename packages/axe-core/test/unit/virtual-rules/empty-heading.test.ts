import { describe, it, expect } from 'vitest';
import axe from '../../../dist/axe.js';

describe('empty-heading virtual-rule', function () {
  it('should pass with visible text', function () {
    const node = new axe.SerialVirtualNode({ nodeName: 'h1', attributes: {} });
    const child = new axe.SerialVirtualNode({
      nodeName: '#text',
      nodeType: 3,
      nodeValue: 'OK',
      attributes: {}
    });
    node.children = [child];
    const results = axe.runVirtualRule('empty-heading', node);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
    expect(results.passes).toHaveLength(1);
  });

  it('should incomplete if no other properties are set', function () {
    const node = new axe.SerialVirtualNode({ nodeName: 'h1' });
    const results = axe.runVirtualRule('empty-heading', node);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
    expect(results.passes).toHaveLength(0);
  });

  it('should pass for title', function () {
    const results = axe.runVirtualRule('empty-heading', {
      nodeName: 'h1',
      attributes: { title: 'it has a title' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should pass on explicit role', function () {
    const results = axe.runVirtualRule('empty-heading', {
      nodeName: 'span',
      attributes: { role: 'heading', title: 'foobar' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should pass on implicit role', function () {
    const results = axe.runVirtualRule('empty-heading', {
      nodeName: 'h1',
      attributes: { title: 'foobar' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should pass for aria-label', function () {
    const results = axe.runVirtualRule('empty-heading', {
      nodeName: 'h1',
      attributes: { 'aria-label': 'foobar' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail when aria-label is empty', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'h1',
      attributes: { 'aria-label': '' }
    });
    node.children = [];
    const results = axe.runVirtualRule('empty-heading', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should incomplete for aria-labelledby', function () {
    const results = axe.runVirtualRule('empty-heading', {
      nodeName: 'h1',
      attributes: { 'aria-labelledby': 'foobar' }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });

  it('should fail when title is empty', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'h1',
      attributes: { title: '' }
    });
    node.children = [];
    const results = axe.runVirtualRule('empty-heading', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail in order to account for presentation conflict resolution', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'h1',
      attributes: { role: 'none', 'aria-label': '' }
    });
    node.children = [];
    const results = axe.runVirtualRule('empty-heading', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
});
