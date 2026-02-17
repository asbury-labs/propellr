import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
describe('svg-namespace-matches', function () {
  let rule;
  let fixture;
  let axeFixtureSetup;

  beforeEach(function () {
    fixture = document.getElementById('fixture');
    axeFixtureSetup = axe.testUtils.fixtureSetup;
    rule = axe.utils.getRule('svg-img-alt');
  });

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('returns true when passed an SVG element', function () {
    axeFixtureSetup('<svg><title>Pretty picture</title></svg>');
    const node = fixture.querySelector('svg');
    const virtualNode = axe.utils.getNodeFromTree(axe._tree[0], node);
    expect(rule.matches(node, virtualNode)).toBe(true);
  });

  it('returns true when passed an SVG circle element', function () {
    axeFixtureSetup(
      '<svg><circle><title>Pretty picture</title></circle></svg>'
    );
    const node = fixture.querySelector('circle');
    const virtualNode = axe.utils.getNodeFromTree(axe._tree[0], node);
    expect(rule.matches(node, virtualNode)).toBe(true);
  });

  it('returns false when passed an HTML element', function () {
    axeFixtureSetup('<h1>Hello world</h1>');
    const node = fixture.querySelector('h1');
    const virtualNode = axe.utils.getNodeFromTree(axe._tree[0], node);
    expect(rule.matches(node, virtualNode)).toBe(false);
  });

  it('returns false when passed a custom HTML element', function () {
    axeFixtureSetup('<xx-heading>Hello world</xx-heading>');
    const node = fixture.querySelector('xx-heading');
    const virtualNode = axe.utils.getNodeFromTree(axe._tree[0], node);
    expect(rule.matches(node, virtualNode)).toBe(false);
  });

  describe('Serial Virtual Node', function () {
    it('should return true when passed an SVG element', function () {
      const serialNode = new axe.SerialVirtualNode({
        nodeName: 'svg'
      });
      const child = new axe.SerialVirtualNode({
        nodeName: 'title',
        nodeValue: 'Pretty picture'
      });
      child.parent = serialNode;
      serialNode.children = [child];

      expect(rule.matches(null, serialNode)).toBe(true);
    });

    it('returns true when passed an SVG circle element', function () {
      const serialNode = new axe.SerialVirtualNode({
        nodeName: 'svg'
      });
      const child = new axe.SerialVirtualNode({
        nodeName: 'circle'
      });
      child.parent = serialNode;
      serialNode.children = [child];

      expect(rule.matches(null, child)).toBe(true);
    });

    it('returns false when passed an HTML element', function () {
      const serialNode = new axe.SerialVirtualNode({
        nodeName: 'h1',
        nodeValue: 'Hello world'
      });

      expect(rule.matches(null, serialNode)).toBe(false);
    });

    it('should return false when passed an svg element without a parent', function () {
      const serialNode = new axe.SerialVirtualNode({
        nodeName: 'circle'
      });
      const parent = new axe.SerialVirtualNode({
        nodeName: 'svg'
      });
      parent.children = [serialNode];
      serialNode.parent = parent;

      expect(rule.matches(null, serialNode)).toBe(true);
    });
  });
});
