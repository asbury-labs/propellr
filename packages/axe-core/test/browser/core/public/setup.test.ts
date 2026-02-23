import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('axe.setup', () => {
  afterEach(() => {
    axe.teardown();
  });

  it('should setup the tree', () => {
    axe._tree = undefined;
    axe.setup();
    expect(axe._tree).toBeDefined();
  });

  it('should default the tree to use html element', () => {
    axe.setup();
    expect(axe._tree[0].actualNode).toBe(document.documentElement);
  });

  it('should use the passed in node as the root of the tree', () => {
    axe.setup(document.body);
    expect(axe._tree[0].actualNode).toBe(document.body);
  });

  it('should return the root node', () => {
    const vNode = axe.setup(document.body);
    expect(vNode.actualNode).toBe(document.body);
  });

  it('should setup selector data', () => {
    axe._selectorData = undefined;
    axe.setup();
    expect(axe._selectorData).toBeDefined();
  });

  it('takes documentElement when passed the document', () => {
    axe.setup(document);
    expect(axe._tree[0].actualNode).toBe(document.documentElement);
  });

  it('should throw if called twice in a row', () => {
    function fn() {
      axe.setup();
      axe.setup();
    }

    expect(fn).toThrow();
  });
});
