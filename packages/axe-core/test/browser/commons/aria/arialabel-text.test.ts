import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('aria.arialabelText', function () {
  const aria = axe.commons.aria;

  it('returns "" if there is no aria-label', function () {
    const vNode = new axe.SerialVirtualNode({ nodeName: 'div' });
    expect(aria.arialabelText(vNode)).toBe('');
  });

  it('returns the aria-label attribute', function () {
    const label = ' my label ';
    const vNode = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { 'aria-label': label }
    });
    expect(aria.arialabelText(vNode)).toBe(label);
  });

  it('returns "" if there is no aria-label', function () {
    const vNode = new axe.SerialVirtualNode({ nodeName: 'div' });
    expect(aria.arialabelText(vNode)).toBe('');
  });

  it('looks up the node in the flat tree', function () {
    const label = 'harambe';
    const node = document.createElement('div');
    node.setAttribute('aria-label', label);

    axe.utils.getFlattenedTree(node);
    expect(aria.arialabelText(node)).toBe(label);
  });

  it('returns "" if the node is not an element', function () {
    const node = document.createTextNode('my text node');
    expect(aria.arialabelText(node)).toBe('');
  });
});
