import { describe, it, expect } from 'vitest';
import axe from '../../../dist/axe.js';

describe('object-alt virtual-rule', function () {
  const data = `data:text/html,Object%20content`;

  it('is inapplicable when the object has no data attribute', function () {
    const results = axe.runVirtualRule('object-alt', {
      nodeName: 'object',
      attributes: {}
    });
    expect(results.inapplicable).toHaveLength(1);
  });
  it('should pass for aria-label', function () {
    const results = axe.runVirtualRule('object-alt', {
      nodeName: 'object',
      attributes: { 'aria-label': 'foobar', data }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should incomplete for aria-labelledby', function () {
    const results = axe.runVirtualRule('object-alt', {
      nodeName: 'object',
      attributes: { 'aria-labelledby': 'foobar', data }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });
  it('should pass for title', function () {
    const results = axe.runVirtualRule('object-alt', {
      nodeName: 'object',
      attributes: { title: 'foobar', data }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should pass for role=presentation', function () {
    const results = axe.runVirtualRule('object-alt', {
      nodeName: 'object',
      attributes: { role: 'presentation', data }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should pass for role=none', function () {
    const results = axe.runVirtualRule('object-alt', {
      nodeName: 'object',
      attributes: { role: 'none', data }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail for visible text content', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'object',
      attributes: { data }
    });
    const child = new axe.SerialVirtualNode({
      nodeName: '#text',
      nodeType: 3,
      nodeValue: 'foobar'
    });
    node.children = [child];
    const results = axe.runVirtualRule('object-alt', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail when alt and children are missing', function () {
    const results = axe.runVirtualRule('object-alt', {
      nodeName: 'object',
      attributes: { data }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail children contain no visible text', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'object',
      attributes: { data }
    });
    node.children = [];
    const results = axe.runVirtualRule('object-alt', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail when alt contains only whitespace', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'object',
      attributes: { alt: ' \t   \n   ', data }
    });
    node.children = [];
    const results = axe.runVirtualRule('object-alt', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail when aria-label is empty', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'object',
      attributes: { 'aria-label': '', data }
    });
    node.children = [];
    const results = axe.runVirtualRule('object-alt', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail when title is empty', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'object',
      attributes: { title: '', data }
    });
    node.children = [];
    const results = axe.runVirtualRule('object-alt', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
});
