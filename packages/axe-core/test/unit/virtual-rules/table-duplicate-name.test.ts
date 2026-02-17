import { describe, it, expect } from 'vitest';
import axe from '../../../dist/axe.js';

describe('table-duplicate-name virtual-rule', function () {
  it('should incomplete on table element with children undefined', function () {
    const tableNode = new axe.SerialVirtualNode({ nodeName: 'table' });
    tableNode.children = undefined;
    const results = axe.runVirtualRule('table-duplicate-name', tableNode);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });
  it('should pass on table element', function () {
    const tableNode = new axe.SerialVirtualNode({ nodeName: 'table' });
    tableNode.children = [];
    const results = axe.runVirtualRule('table-duplicate-name', tableNode);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should pass when table has empty summary', function () {
    const tableNode = new axe.SerialVirtualNode({
      nodeName: 'table',
      attributes: { summary: '' }
    });
    tableNode.children = [];
    const results = axe.runVirtualRule('table-duplicate-name', tableNode);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should pass when table has empty caption and summary', function () {
    const tableNode = new axe.SerialVirtualNode({
      nodeName: 'table',
      attributes: { summary: '' }
    });
    const captionNode = new axe.SerialVirtualNode({ nodeName: 'caption' });
    captionNode.parent = tableNode;
    const textNode = new axe.SerialVirtualNode({
      nodeName: '#text',
      nodeType: 3,
      nodeValue: ''
    });
    textNode.parent = captionNode;
    captionNode.children = [textNode];
    tableNode.children = [captionNode];
    const results = axe.runVirtualRule('table-duplicate-name', tableNode);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail when table summary and <caption> have the same text', function () {
    const DUPLICATED_TEXT = 'foobar';
    const tableNode = new axe.SerialVirtualNode({
      nodeName: 'table',
      attributes: { summary: DUPLICATED_TEXT }
    });
    const captionNode = new axe.SerialVirtualNode({ nodeName: 'caption' });
    captionNode.parent = tableNode;
    const textNode = new axe.SerialVirtualNode({
      nodeName: '#text',
      nodeType: 3,
      nodeValue: DUPLICATED_TEXT
    });
    textNode.parent = captionNode;
    captionNode.children = [textNode];
    tableNode.children = [captionNode];
    const results = axe.runVirtualRule('table-duplicate-name', tableNode);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail when table summary and <caption> have the same text, excluding whitespace', function () {
    const DUPLICATED_TEXT = 'foobar';
    const tableNode = new axe.SerialVirtualNode({
      nodeName: 'table',
      attributes: { summary: '  ' + DUPLICATED_TEXT }
    });
    const captionNode = new axe.SerialVirtualNode({ nodeName: 'caption' });
    captionNode.parent = tableNode;
    const textNode = new axe.SerialVirtualNode({
      nodeName: '#text',
      nodeType: 3,
      nodeValue: ' \t  ' + DUPLICATED_TEXT
    });
    textNode.parent = captionNode;
    captionNode.children = [textNode];
    tableNode.children = [captionNode];
    const results = axe.runVirtualRule('table-duplicate-name', tableNode);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
});
