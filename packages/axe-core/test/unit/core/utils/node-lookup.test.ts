import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('axe.utils.nodeLookup', () => {
  const nodeLookup = axe.utils.nodeLookup;
  const queryFixture = axe.testUtils.queryFixture;

  it('works with virtual nodes', () => {
    const element = queryFixture('<div id="target">Hello</div>');

    const { vNode, domNode } = nodeLookup(element);
    expect(element).toBe(vNode);
    expect(element.actualNode).toBe(domNode);
  });

  it('works with serial virtual nodes', () => {
    const element = new axe.SerialVirtualNode({ nodeName: 'div' });

    const { vNode, domNode } = nodeLookup(element);
    expect(element).toBe(vNode);
    expect(domNode).toBeUndefined();
  });

  it('works with elements', () => {
    const element = queryFixture('<div id="target">Hello</div>');

    const { vNode, domNode } = nodeLookup(element.actualNode);
    expect(element).toBe(vNode);
    expect(element.actualNode).toBe(domNode);
  });

  it('works with non-elements', () => {
    const element = document.createTextNode('my text node');

    const { vNode, domNode } = nodeLookup(element);
    expect(vNode).toBeNull();
    expect(element).toBe(domNode);
  });
});
