import { describe, it, expect } from 'vitest';
import axe from '../../../dist/axe.js';

describe('list virtual-rule', () => {
  it('passes when there are no invalid child nodes', () => {
    const ul = new axe.SerialVirtualNode({ nodeName: 'ul' });
    const li = new axe.SerialVirtualNode({ nodeName: 'li' });
    ul.children = [li];
    li.parent = ul;
    const results = axe.runVirtualRule('list', ul);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('fails when there is an invalid child node', () => {
    const ul = new axe.SerialVirtualNode({ nodeName: 'ul' });
    const span = new axe.SerialVirtualNode({
      nodeName: 'span',
      attributes: {}
    });
    ul.children = [span];
    span.parent = ul;
    const results = axe.runVirtualRule('list', ul);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('is incomplete without child nodes', () => {
    const ul = new axe.SerialVirtualNode({ nodeName: 'ul' });
    const results = axe.runVirtualRule('list', ul);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });
});
