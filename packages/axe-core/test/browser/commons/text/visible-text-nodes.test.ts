import { describe, it, afterEach, expect } from 'vitest';
import { queryFixture, shadowSupport } from '../../../testutils';

declare const axe: any;
describe('text.visibleTextNodes', function () {
  const fixture = document.getElementById('fixture');
  const shadowSupported = shadowSupport.v1;
  const visibleTextNodes = axe.commons.text.visibleTextNodes;

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('should handle multiple text nodes to a single parent', function () {
    const vNode = queryFixture(
      '<div id="target">Hello<span>Hi</span>Goodbye</div>'
    );
    const nodes = visibleTextNodes(vNode);
    expect(nodes.length).toBe(3);
    expect(nodes[0].actualNode.nodeValue).toBe('Hello');
    expect(nodes[1].actualNode.nodeValue).toBe('Hi');
    expect(nodes[2].actualNode.nodeValue).toBe('Goodbye');
  });

  it('should handle recursive calls', function () {
    const vNode = queryFixture(
      '<div id="target">Hello<span><span>Hi</span></span></div>'
    );
    const nodes = visibleTextNodes(vNode);
    expect(nodes.length).toBe(2);
    expect(nodes[0].actualNode.nodeValue).toBe('Hello');
    expect(nodes[1].actualNode.nodeValue).toBe('Hi');
  });

  it('should not return elements with visibility: hidden', function () {
    const vNode = queryFixture(
      '<div id="target">Hello<span style="visibility: hidden;">Hi</span></div>'
    );
    const nodes = visibleTextNodes(vNode);
    expect(nodes.length).toBe(1);
    expect(nodes[0].actualNode.nodeValue).toBe('Hello');
  });

  it('should know how visibility works', function () {
    const vNode = queryFixture(
      '<div id="target">Hello<span style="visibility: hidden;">' +
        '<span style="visibility: visible;">Hi</span>' +
        '</span></div>'
    );
    const nodes = visibleTextNodes(vNode);
    expect(nodes.length).toBe(2);
    expect(nodes[0].actualNode.nodeValue).toBe('Hello');
    expect(nodes[1].actualNode.nodeValue).toBe('Hi');
  });

  it('should not return elements with display: none', function () {
    const vNode = queryFixture(
      '<div id="target">Hello<span style="display: none;">Hi</span></div>'
    );
    const nodes = visibleTextNodes(vNode);
    expect(nodes.length).toBe(1);
    expect(nodes[0].actualNode.nodeValue).toBe('Hello');
  });

  it('should ignore script and style tags', function () {
    const vNode = queryFixture(
      '<div id="target"><script> // hello </script><style> /*hello */</style>' +
        'Hello</div>'
    );
    const nodes = visibleTextNodes(vNode);
    expect(nodes.length).toBe(1);
    expect(nodes[0].actualNode.nodeValue).toBe('Hello');
  });

  it('should not take into account position of parents', function () {
    const vNode = queryFixture(
      '<div id="target">' +
        '<div style="position: absolute; top: -9999px;">' +
        '<div style="position: absolute; top: 10000px;">Hello</div>' +
        '</div>' +
        '</div>'
    );
    const nodes = visibleTextNodes(vNode);
    expect(nodes.length).toBe(1);
    expect(nodes[0].actualNode.nodeValue).toBe('Hello');
  });

  (shadowSupported ? it : xit)(
    'should correctly handle slotted elements',
    function () {
      function createContentSlotted() {
        const group = document.createElement('div');
        group.innerHTML = '<div id="target">Stuff<slot></slot></div>';
        return group;
      }
      function makeShadowTree(node) {
        const root = node.attachShadow({ mode: 'open' });
        const div = document.createElement('div');
        root.appendChild(div);
        div.appendChild(createContentSlotted());
      }
      fixture.innerHTML = '<div><a>hello</a></div>';
      makeShadowTree(fixture.firstChild);
      const tree = axe.utils.getFlattenedTree(fixture.firstChild);
      const nodes = visibleTextNodes(tree[0]);
      expect(nodes.length).toBe(2);
      expect(nodes[0].actualNode.nodeValue).toBe('Stuff');
      expect(nodes[1].actualNode.nodeValue).toBe('hello');
    }
  );
});
