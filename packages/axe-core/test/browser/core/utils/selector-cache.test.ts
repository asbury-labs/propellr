import { describe, it, expect, beforeEach } from 'vitest';
import { shadowSupport } from '../../../testutils';

declare const axe: any;
describe('utils.selector-cache', () => {
  const fixture = document.querySelector('#fixture');
  const cacheNodeSelectors =
    axe._thisWillBeDeletedDoNotUse.utils.cacheNodeSelectors;
  const getNodesMatchingExpression =
    axe._thisWillBeDeletedDoNotUse.utils.getNodesMatchingExpression;
  const convertSelector = axe.utils.convertSelector;
  const shadowSupported = shadowSupport.v1;

  let vNode;
  beforeEach(() => {
    fixture.innerHTML = '<div id="target" class="foo" aria-label="bar"></div>';
    vNode = new axe.VirtualNode(fixture.firstChild);
  });

  describe('cacheNodeSelectors', () => {
    it('should add the node to the global selector', () => {
      const map = {};
      cacheNodeSelectors(vNode, map);
      expect(map['*']).toEqual([vNode]);
    });

    it('should add the node to the nodeName', () => {
      const map = {};
      cacheNodeSelectors(vNode, map);
      expect(map.div).toEqual([vNode]);
    });

    it('should add the node to all attribute selectors', () => {
      const map = {};
      cacheNodeSelectors(vNode, map);
      expect(map['[id]']).toEqual([vNode]);
      expect(map['[class]']).toEqual([vNode]);
      expect(map['[aria-label]']).toEqual([vNode]);
    });

    it('should add the node to the id map', () => {
      const map = {};
      cacheNodeSelectors(vNode, map);
      expect(map[' [idsMap]'].target).toEqual([vNode]);
    });

    it('should not add the node to selectors it does not match', () => {
      const map = {};
      cacheNodeSelectors(vNode, map);
      expect(map['[for]']).toBeUndefined();
      expect(map.h1).toBeUndefined();
    });

    it('should ignore non-element nodes', () => {
      const map = {};
      fixture.innerHTML = 'Hello';
      vNode = new axe.VirtualNode(fixture.firstChild);
      cacheNodeSelectors(vNode, map);

      expect(Object.keys(map)).toHaveLength(0);
    });

    describe('with javascripty attribute selectors', () => {
      const terms = [
        'prototype',
        'constructor',
        '__proto__',
        'Element',
        'nodeName',
        'valueOf',
        'toString'
      ];
      for (const term of terms) {
        it(`works with ${term}`, () => {
          fixture.innerHTML = `<div id="${term}" class="${term}" aria-label="${term}"></div>`;
          vNode = new axe.VirtualNode(fixture.firstChild);
          const map = {};
          cacheNodeSelectors(vNode, map);
          expect(map['[id]']).toEqual([vNode]);
          expect(map['[class]']).toEqual([vNode]);
          expect(map['[aria-label]']).toEqual([vNode]);
        });
      }
    });
  });

  describe('getNodesMatchingExpression', () => {
    let tree;
    let spanVNode;
    let headingVNode;

    function createTree() {
      for (let i = 0; i < fixture.children.length; i++) {
        const child = fixture.children[i];
        const isShadow = child.hasAttribute('data-shadow');
        const html = child.innerHTML;
        if (isShadow) {
          const shadowRoot = child.attachShadow({ mode: 'open' });
          shadowRoot.innerHTML = html;
          child.innerHTML = '';
        }
      }

      return axe.utils.getFlattenedTree(fixture);
    }

    beforeEach(() => {
      fixture.firstChild.innerHTML =
        '<h1><span class="bar" id="not-target" aria-labelledby="target"></span></h1>';
      tree = axe.utils.getFlattenedTree(fixture.firstChild);

      vNode = tree[0];
      headingVNode = vNode.children[0];
      spanVNode = headingVNode.children[0];
    });

    it('should return undefined if the cache is not primed', () => {
      tree[0]._selectorMap = null;
      const expression = convertSelector('div');
      expect(getNodesMatchingExpression(tree, expression)).toBeUndefined();
    });

    it('should return a list of matching nodes by global selector', () => {
      const expression = convertSelector('*');
      expect(getNodesMatchingExpression(tree, expression)).toEqual([
        vNode,
        headingVNode,
        spanVNode
      ]);
    });

    it('should return a list of matching nodes by nodeName', () => {
      const expression = convertSelector('div');
      expect(getNodesMatchingExpression(tree, expression)).toEqual([vNode]);
    });

    it('should return a list of matching nodes by id', () => {
      const expression = convertSelector('#target');
      expect(getNodesMatchingExpression(tree, expression)).toEqual([vNode]);
    });

    (shadowSupported ? it : xit)(
      'should only return nodes matching shadowId when matching by id',
      () => {
        fixture.innerHTML =
          '<div id="target"></div><div data-shadow><div id="target"></div></div>';
        tree = createTree();
        const expression = convertSelector('#target');
        const expected = [tree[0].children[0]];
        expect(getNodesMatchingExpression(tree, expression)).toEqual(expected);
      }
    );

    it('should return a list of matching nodes by class', () => {
      const expression = convertSelector('.foo');
      expect(getNodesMatchingExpression(tree, expression)).toEqual([vNode]);
    });

    it('should return a list of matching nodes by attribute', () => {
      const expression = convertSelector('[aria-label]');
      expect(getNodesMatchingExpression(tree, expression)).toEqual([vNode]);
    });

    it('should return an empty array if selector does not match', () => {
      const expression = convertSelector('main');
      expect(getNodesMatchingExpression(tree, expression)).toHaveLength(0);
    });

    it('should return an empty array for complex selector that does not match', () => {
      const expression = convertSelector('span.missingClass[id]');
      expect(getNodesMatchingExpression(tree, expression)).toHaveLength(0);
    });

    it('should return an empty array for a non-complex selector that does not match', () => {
      const expression = convertSelector('div#not-target[id]');
      expect(getNodesMatchingExpression(tree, expression)).toHaveLength(0);
    });

    it('should return nodes for each expression', () => {
      fixture.innerHTML =
        '<div role="button"></div><span aria-label="other"></span>';
      tree = createTree();
      const expression = convertSelector('[role], [aria-label]');
      const expected = [tree[0].children[0], tree[0].children[1]];
      expect(getNodesMatchingExpression(tree, expression)).toEqual(expected);
    });

    it('should return nodes for child combinator selector', () => {
      const expression = convertSelector('div span');
      expect(getNodesMatchingExpression(tree, expression)).toEqual([spanVNode]);
    });

    it('should return nodes for direct child combinator selector', () => {
      const expression = convertSelector('div > h1');
      expect(getNodesMatchingExpression(tree, expression)).toEqual([
        headingVNode
      ]);
    });

    it('should not return nodes for direct child combinator selector that does not match', () => {
      const expression = convertSelector('div > span');
      expect(getNodesMatchingExpression(tree, expression)).toHaveLength(0);
    });

    it('should return nodes for attribute value selector', () => {
      const expression = convertSelector('[id="target"]');
      expect(getNodesMatchingExpression(tree, expression)).toEqual([vNode]);
    });

    it('should return undefined for combinator selector with global selector', () => {
      const expression = convertSelector('body *');
      expect(getNodesMatchingExpression(tree, expression)).toBeUndefined();
    });

    it('should return nodes for multipart selectors', () => {
      const expression = convertSelector('div.foo[id]');
      expect(getNodesMatchingExpression(tree, expression)).toEqual([vNode]);
    });

    it('should remove duplicates', () => {
      fixture.innerHTML = '<div role="button" aria-label="other"></div>';
      tree = createTree();
      const expression = convertSelector('div[role], [aria-label]');
      const expected = [tree[0].children[0]];
      expect(getNodesMatchingExpression(tree, expression)).toEqual(expected);
    });

    it('should sort nodes by added order', () => {
      fixture.innerHTML =
        '<div id="id0"></div>' +
        '<span id="id1"></span>' +
        '<div id="id2"></div>' +
        '<span id="id3"></span>' +
        '<div id="id4"></div>' +
        '<span id="id5"></span>' +
        '<div id="id6"></div>' +
        '<span id="id7"></span>' +
        '<div id="id8"></div>' +
        '<span id="id9"></span>';
      tree = createTree();

      const expression = convertSelector('div, span');
      const nodes = getNodesMatchingExpression(tree, expression);
      const ids = [];
      for (let i = 0; i < nodes.length; i++) {
        ids.push(nodes[i].attr('id'));
      }

      expect(ids).toEqual([
        'fixture',
        'id0',
        'id1',
        'id2',
        'id3',
        'id4',
        'id5',
        'id6',
        'id7',
        'id8',
        'id9'
      ]);
    });

    it('should filter nodes', () => {
      fixture.innerHTML =
        '<div role="button" aria-label="other"></div><div></div>';
      tree = createTree();

      function filter(node) {
        return node.hasAttr('role');
      }

      const nonFilteredNodes = getNodesMatchingExpression(
        tree,
        convertSelector('div, [aria-label]')
      );
      const nonFilteredExpected = [
        tree[0],
        tree[0].children[0],
        tree[0].children[1]
      ];

      const filteredNodes = getNodesMatchingExpression(
        tree,
        convertSelector('div, [aria-label]'),
        filter
      );
      const filteredExpected = [tree[0].children[0]];

      expect(nonFilteredNodes).toEqual(nonFilteredExpected);
      expect(filteredNodes).toEqual(filteredExpected);
    });
  });
});
