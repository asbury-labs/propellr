import { describe, it, expect, beforeEach } from 'vitest';
import axe from '../../../dist/axe.js';

function appendSerialChild(parent, child) {
  if (child instanceof axe.SerialVirtualNode === false) {
    child = new axe.SerialVirtualNode(child);
  }
  child.parent = parent;
  parent.children ??= [];
  parent.children.push(child);
  return child;
}

describe('summary-name virtual-rule', () => {
  let vDetails;
  beforeEach(() => {
    vDetails = new axe.SerialVirtualNode({
      nodeName: 'details',
      attributes: {}
    });
    appendSerialChild(vDetails, { nodeName: '#text', nodeValue: 'text' });
  });

  it('fails without children', () => {
    const vSummary = new axe.SerialVirtualNode({
      nodeName: 'summary',
      attributes: {}
    });
    vSummary.children = [];
    appendSerialChild(vDetails, vSummary);
    const results = axe.runVirtualRule('summary-name', vSummary);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('passes with text content', () => {
    const vSummary = new axe.SerialVirtualNode({
      nodeName: 'summary',
      attributes: {}
    });
    appendSerialChild(vSummary, { nodeName: '#text', nodeValue: 'text' });
    appendSerialChild(vDetails, vSummary);
    const results = axe.runVirtualRule('summary-name', vSummary);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('passes with aria-label', () => {
    const vSummary = new axe.SerialVirtualNode({
      nodeName: 'summary',
      attributes: { 'aria-label': 'foobar' }
    });
    appendSerialChild(vDetails, vSummary);
    const results = axe.runVirtualRule('summary-name', vSummary);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('passes with title', () => {
    const vSummary = new axe.SerialVirtualNode({
      nodeName: 'summary',
      attributes: { title: 'foobar' }
    });
    appendSerialChild(vDetails, vSummary);
    const results = axe.runVirtualRule('summary-name', vSummary);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('incompletes with aria-labelledby', () => {
    const vSummary = new axe.SerialVirtualNode({
      nodeName: 'summary',
      attributes: { 'aria-labelledby': 'foobar' }
    });
    appendSerialChild(vDetails, vSummary);
    const results = axe.runVirtualRule('summary-name', vSummary);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });

  it('throws without a parent', () => {
    const vSummary = new axe.SerialVirtualNode({
      nodeName: 'summary',
      attributes: { 'aria-labelledby': 'foobar' }
    });
    vSummary.children = [];
    expect(() => {
      axe.runVirtualRule('summary-name', vSummary);
    }).toThrow();
  });
});
