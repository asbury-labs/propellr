import { describe, it, expect } from 'vitest';

declare const axe: any;
/* global axe */
describe('axe.utils.isHtmlElement', () => {
  const queryFixture = axe.testUtils.queryFixture;
  const isHtmlElement = axe.utils.isHtmlElement;

  it('returns true if given ul', () => {
    let node = document.createElement('ul');
    expect(isHtmlElement(node)).toBe(true);
  });

  it('returns true if given nav', () => {
    let node = document.createElement('nav');
    expect(isHtmlElement(node)).toBe(true);
  });

  it('returns true if given iframe', () => {
    let node = document.createElement('iframe');
    expect(isHtmlElement(node)).toBe(true);
  });

  it('returns false if given custom element', () => {
    let node = document.createElement('myElement');
    expect(isHtmlElement(node)).toBe(false);
  });

  it('returns false if given svg namespace', () => {
    let node = document.createElementNS('http://www.w3.org/2000/svg', 'a');
    expect(isHtmlElement(node)).toBe(false);
  });

  it('returns false if node has inherited svg namespace', () => {
    const svgNameSpace = 'http://www.w3.org/2000/svg';
    let node = document.createElementNS(svgNameSpace, 'svg');
    const child = document.createElementNS(svgNameSpace, 'a');
    child.setAttribute('href', '');
    child.textContent = 'Child Node';
    node.appendChild(child);

    const childNode = node.querySelector('a');
    expect(isHtmlElement(childNode)).toBe(false);
  });

  it('works with VirtualNodes', () => {
    let vNode = queryFixture('<ul id="target"></ul>');
    expect(isHtmlElement(vNode)).toBe(true);
  });

  it('works with SerialVirtualNode', () => {
    let vNode = new axe.SerialVirtualNode({ nodeName: 'ul' });
    expect(isHtmlElement(vNode)).toBe(true);
  });
});
