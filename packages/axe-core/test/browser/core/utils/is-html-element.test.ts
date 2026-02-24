import { describe, it, expect } from 'vitest';
import { queryFixture } from '../../../testutils';

declare const axe: any;
/* global axe */
describe('axe.utils.isHtmlElement', () => {
  const isHtmlElement = axe.utils.isHtmlElement;

  it('returns true if given ul', () => {
    const node = document.createElement('ul');
    expect(isHtmlElement(node)).toBe(true);
  });

  it('returns true if given nav', () => {
    const node = document.createElement('nav');
    expect(isHtmlElement(node)).toBe(true);
  });

  it('returns true if given iframe', () => {
    const node = document.createElement('iframe');
    expect(isHtmlElement(node)).toBe(true);
  });

  it('returns false if given custom element', () => {
    const node = document.createElement('myElement');
    expect(isHtmlElement(node)).toBe(false);
  });

  it('returns false if given svg namespace', () => {
    const node = document.createElementNS('http://www.w3.org/2000/svg', 'a');
    expect(isHtmlElement(node)).toBe(false);
  });

  it('returns false if node has inherited svg namespace', () => {
    const svgNameSpace = 'http://www.w3.org/2000/svg';
    const node = document.createElementNS(svgNameSpace, 'svg');
    const child = document.createElementNS(svgNameSpace, 'a');
    child.setAttribute('href', '');
    child.textContent = 'Child Node';
    node.appendChild(child);

    const childNode = node.querySelector('a');
    expect(isHtmlElement(childNode)).toBe(false);
  });

  it('works with VirtualNodes', () => {
    const vNode = queryFixture('<ul id="target"></ul>');
    expect(isHtmlElement(vNode)).toBe(true);
  });

  it('works with SerialVirtualNode', () => {
    const vNode = new axe.SerialVirtualNode({ nodeName: 'ul' });
    expect(isHtmlElement(vNode)).toBe(true);
  });
});
