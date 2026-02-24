import { describe, it, expect, afterEach } from 'vitest';
import { queryFixture } from '../../../testutils';

declare const axe: any;
describe('utils.closest', () => {
  const closest = axe.utils.closest;
  const fixture = document.querySelector('#fixture');

  afterEach(() => {
    fixture.innerHTML = '';
  });

  it('should find the current node', () => {
    const virtualNode = queryFixture(
      '<div id="parent"><div id="target">foo</div></div>'
    );
    const closestNode = closest(virtualNode, 'div');
    expect(closestNode).toBe(virtualNode);
  });

  it('should find a parent node', () => {
    const virtualNode = queryFixture(
      '<div id="parent"><span id="target">foo</span></div>'
    );
    const closestNode = closest(virtualNode, 'div');
    const parent = fixture.querySelector('#parent');
    expect(closestNode).toBe(axe.utils.getNodeFromTree(parent));
  });

  it('should find an ancestor node', () => {
    const virtualNode = queryFixture(
      '<div id="parent"><span><span><span><span id="target">foo</span></span></span></div>'
    );
    const closestNode = closest(virtualNode, 'div');
    const parent = fixture.querySelector('#parent');
    expect(closestNode).toBe(axe.utils.getNodeFromTree(parent));
  });

  it('should return null if no ancestor is found', () => {
    const virtualNode = queryFixture(
      '<div id="parent"><div id="target">foo</div></div>'
    );
    const closestNode = closest(virtualNode, 'h1');
    expect(closestNode).toBeNull();
  });

  it('should error if tree is not complete', () => {
    const virtualNode = queryFixture('<div id="target">foo</div>');
    virtualNode.parent = undefined;

    function fn() {
      closest(virtualNode, 'h1');
    }

    expect(fn).toThrow();
  });

  it('should not error if tree is complete', () => {
    const virtualNode = queryFixture('<div id="target">foo</div>');
    virtualNode.parent = null;

    function fn() {
      closest(virtualNode, 'h1');
    }

    expect(fn).not.toThrow();
  });

  it('should support shadow dom', () => {
    fixture.innerHTML = '<div id="parent"></div>';

    const root = fixture.firstChild.attachShadow({ mode: 'open' });
    const slotted = document.createElement('span');
    slotted.innerHTML = '<span id="target">foo</span>';
    root.appendChild(slotted);
    axe.utils.getFlattenedTree(fixture.firstChild);

    const virtualNode = axe.utils.getNodeFromTree(slotted.firstChild);
    const parent = fixture.querySelector('#parent');
    const closestNode = closest(virtualNode, 'div');
    expect(closestNode).toBe(axe.utils.getNodeFromTree(parent));
  });
});
