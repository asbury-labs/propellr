import { describe, it, expect } from 'vitest';
import axe from '../../../dist/axe.js';

describe('input-button-name virtual-rule', () => {
  it('should pass for type=submit without value', () => {
    const results = axe.runVirtualRule('input-button-name', {
      nodeName: 'input',
      attributes: { type: 'submit' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should pass for value', () => {
    const results = axe.runVirtualRule('input-button-name', {
      nodeName: 'input',
      attributes: { type: 'button', value: 'foobar' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should pass for aria-label', () => {
    const results = axe.runVirtualRule('input-button-name', {
      nodeName: 'input',
      attributes: { type: 'button', 'aria-label': 'foobar' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should incomplete for aria-labelledby', () => {
    const node = new axe.SerialVirtualNode({
      nodeName: 'input',
      attributes: { type: 'button', 'aria-labelledby': 'foobar' }
    });
    node.parent = null;
    const results = axe.runVirtualRule('input-button-name', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });
  it('should pass for title', () => {
    const results = axe.runVirtualRule('input-button-name', {
      nodeName: 'input',
      attributes: { type: 'button', title: 'foobar' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should pass for role=presentation when disabled', () => {
    const results = axe.runVirtualRule('input-button-name', {
      nodeName: 'input',
      attributes: { type: 'button', role: 'presentation', disabled: true }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should pass for role=none when disabled', () => {
    const results = axe.runVirtualRule('input-button-name', {
      nodeName: 'input',
      attributes: { type: 'button', role: 'none', disabled: true }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should pass for implicit label', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'input',
      attributes: { type: 'button' }
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
    const results = axe.runVirtualRule('input-button-name', node);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should incomplete for explicit label', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'input',
      attributes: { type: 'button' }
    });
    const results = axe.runVirtualRule('input-button-name', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });
  it('should fail when no other attributes are passed', () => {
    const node = new axe.SerialVirtualNode({
      nodeName: 'input',
      attributes: { type: 'button' }
    });
    node.parent = null;
    const results = axe.runVirtualRule('input-button-name', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail when value is empty', () => {
    const node = new axe.SerialVirtualNode({
      nodeName: 'input',
      attributes: { type: 'button', value: '' }
    });
    node.parent = null;
    const results = axe.runVirtualRule('input-button-name', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail when alt contains only whitespace', () => {
    const node = new axe.SerialVirtualNode({
      nodeName: 'input',
      attributes: { type: 'button', alt: ' \t   \n   ' }
    });
    node.parent = null;
    const results = axe.runVirtualRule('input-button-name', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail when aria-label is empty', () => {
    const node = new axe.SerialVirtualNode({
      nodeName: 'input',
      attributes: { type: 'button', 'aria-label': '' }
    });
    node.parent = null;
    const results = axe.runVirtualRule('input-button-name', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail when title is empty', () => {
    const node = new axe.SerialVirtualNode({
      nodeName: 'input',
      attributes: { type: 'button', title: '' }
    });
    node.parent = null;
    const results = axe.runVirtualRule('input-button-name', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail for role=presentation', () => {
    const node = new axe.SerialVirtualNode({
      nodeName: 'input',
      attributes: { type: 'button', role: 'presentation' }
    });
    node.parent = null;
    const results = axe.runVirtualRule('input-button-name', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail for role=none', () => {
    const node = new axe.SerialVirtualNode({
      nodeName: 'input',
      attributes: { type: 'button', role: 'none' }
    });
    node.parent = null;
    const results = axe.runVirtualRule('input-button-name', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
});
