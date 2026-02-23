import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('dom.isNode', function () {
  it('nodes', function () {
    const node;
    node = document;
    expect(axe.commons.dom.isNode(node), 'Document').toBe(true);

    node = document.body;
    expect(axe.commons.dom.isNode(node), 'Body').toBe(true);

    node = document.documentElement;
    expect(axe.commons.dom.isNode(node), 'Document Element').toBe(true);

    node = document.createTextNode('cats');
    expect(axe.commons.dom.isNode(node), 'Text Nodes').toBe(true);

    node = document.createElement('div');
    expect(axe.commons.dom.isNode(node), 'Elements').toBe(true);

    node = document.createComment('div');
    expect(axe.commons.dom.isNode(node), 'Comment nodes').toBe(true);

    node = document.createDocumentFragment();
    expect(axe.commons.dom.isNode(node), 'Document fragments').toBe(true);
  });

  it('non-nodes', function () {
    const node;

    node = {};
    expect(axe.commons.dom.isNode(node)).toBe(false);

    node = null;
    expect(axe.commons.dom.isNode(node)).toBe(false);

    node = window;
    expect(axe.commons.dom.isNode(node)).toBe(false);

    node = [];
    expect(axe.commons.dom.isNode(node)).toBe(false);

    node = 'cats';
    expect(axe.commons.dom.isNode(node)).toBe(false);

    node = undefined;
    expect(axe.commons.dom.isNode(node)).toBe(false);

    node = false;
    expect(axe.commons.dom.isNode(node)).toBe(false);
  });
});
