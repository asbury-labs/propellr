import { describe, it, expect } from 'vitest';
import axe from '../../../dist/axe.js';

describe('link-name virtual-rule', function () {
  it('should pass for aria-label', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'a',
      attributes: { href: '/foo.html', 'aria-label': 'foobar' }
    });
    const results = axe.runVirtualRule('link-name', node);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should incomplete for aria-labelledby', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'a',
      attributes: { href: '/foo.html', 'aria-labelledby': 'foobar' }
    });
    const results = axe.runVirtualRule('link-name', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });
  it('should pass for title', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'a',
      attributes: { href: '/foo.html', title: 'foobar' }
    });
    node.children = [];
    const results = axe.runVirtualRule('link-name', node);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should incomplete when aria-label and children are missing', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'a',
      attributes: { href: '/foo.html' }
    });
    const results = axe.runVirtualRule('link-name', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });
  it('should fail when aria-label contains only whitespace', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'a',
      attributes: { href: '/foo.html', 'aria-label': ' \t   \n   ' }
    });
    node.children = [];
    const results = axe.runVirtualRule('link-name', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail when aria-label is empty', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'a',
      attributes: { href: '/foo.html', 'aria-label': '' }
    });
    node.children = [];
    const results = axe.runVirtualRule('link-name', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should incomplete if anchor is still focusable and missing children', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'a',
      attributes: { href: '/foo.html', role: 'presentation' }
    });
    const results = axe.runVirtualRule('link-name', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });
  it('should fail if anchor is still focusable and no children', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'a',
      attributes: { href: '/foo.html', role: 'presentation' }
    });
    node.children = [];
    const results = axe.runVirtualRule('link-name', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail when title is empty', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'a',
      attributes: { href: '/foo.html', title: '' }
    });
    node.children = [];
    const results = axe.runVirtualRule('link-name', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
});
