import { describe, it, expect } from 'vitest';
import axe from '../../../dist/axe.js';

describe('empty-table-header virtual-rule', function () {
  it('should fail when children contain no visible text', function () {
    const thNode = new axe.SerialVirtualNode({ nodeName: 'th' });
    thNode.children = [];
    const results = axe.runVirtualRule('empty-table-header', thNode);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should incomplete when children are missing', function () {
    const thNode = new axe.SerialVirtualNode({ nodeName: 'th' });
    const results = axe.runVirtualRule('empty-table-header', thNode);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });

  it('should fail for role=rowheader', function () {
    const vNode = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'rowheader' }
    });
    vNode.children = [];
    const results = axe.runVirtualRule('empty-table-header', vNode);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail for role=columnheader', function () {
    const vNode = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'columnheader' }
    });
    vNode.children = [];
    const results = axe.runVirtualRule('empty-table-header', vNode);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should pass with a table header', function () {
    const tableNode = new axe.SerialVirtualNode({ nodeName: 'table' });
    const trNode = new axe.SerialVirtualNode({ nodeName: 'tr' });
    trNode.parent = tableNode;
    const thNode = new axe.SerialVirtualNode({ nodeName: 'th' });
    thNode.parent = trNode;
    const textNode = new axe.SerialVirtualNode({
      nodeName: '#text',
      nodeType: 3,
      nodeValue: 'foobar'
    });
    textNode.parent = thNode;
    thNode.children = [textNode];
    trNode.children = [thNode];
    tableNode.children = [trNode];
    const results = axe.runVirtualRule('empty-table-header', tableNode);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should pass with scope of row', function () {
    const tableNode = new axe.SerialVirtualNode({ nodeName: 'table' });
    const trNode = new axe.SerialVirtualNode({ nodeName: 'tr' });
    trNode.parent = tableNode;
    const thNode = new axe.SerialVirtualNode({
      nodeName: 'th',
      attributes: { scope: 'row' }
    });
    thNode.parent = trNode;
    const textNode = new axe.SerialVirtualNode({
      nodeName: '#text',
      nodeType: 3,
      nodeValue: 'foobar'
    });
    textNode.parent = thNode;
    thNode.children = [textNode];
    trNode.children = [thNode];
    tableNode.children = [trNode];
    const results = axe.runVirtualRule('empty-table-header', thNode);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should pass with scope of col', function () {
    const tableNode = new axe.SerialVirtualNode({ nodeName: 'table' });
    const trNode = new axe.SerialVirtualNode({ nodeName: 'tr' });
    trNode.parent = tableNode;
    const thNode = new axe.SerialVirtualNode({
      nodeName: 'th',
      attributes: { scope: 'col' }
    });
    thNode.parent = trNode;
    const textNode = new axe.SerialVirtualNode({
      nodeName: '#text',
      nodeType: 3,
      nodeValue: 'foobar'
    });
    textNode.parent = thNode;
    thNode.children = [textNode];
    trNode.children = [thNode];
    tableNode.children = [trNode];
    const results = axe.runVirtualRule('empty-table-header', thNode);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should pass with a table definition of role rowheader', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'td',
      attributes: { role: 'rowheader' }
    });
    const child = new axe.SerialVirtualNode({
      nodeName: '#text',
      nodeType: 3,
      nodeValue: 'foobar'
    });
    node.children = [child];
    const results = axe.runVirtualRule('empty-table-header', node);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should be inapplicable when the th has role of cell', function () {
    const table = new axe.SerialVirtualNode({ nodeName: 'table' });
    const tr = new axe.SerialVirtualNode({ nodeName: 'tr' });
    const th = new axe.SerialVirtualNode({
      nodeName: 'th',
      attributes: { role: 'cell' }
    });
    tr.children = [th];
    tr.parent = table;
    th.parent = tr;
    th.children = [];
    table.children = [tr];
    const results = axe.runVirtualRule('empty-table-header', th);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
    expect(results.inapplicable).toHaveLength(1);
  });
});
