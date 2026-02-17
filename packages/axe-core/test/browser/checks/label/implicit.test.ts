import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('implicit-label', () => {
  const fixtureSetup = axe.testUtils.fixtureSetup;
  const checkSetup = axe.testUtils.checkSetup;
  const checkEvaluate = axe.testUtils.getCheckEvaluate('implicit-label');
  const checkContext = axe.testUtils.MockCheckContext();

  afterEach(() => {
    checkContext.reset();
  });

  it('returns false if an empty label is present', () => {
    const params = checkSetup('<label><input type="text" id="target"></label>');
    expect(checkEvaluate.apply(checkContext, params)).toBe(false);
  });

  it('returns false on an empty label when then control has a value', () => {
    const params = checkSetup(
      '<label><input type="text" id="target" value="snacks"></label>'
    );
    expect(checkEvaluate.apply(checkContext, params)).toBe(false);
  });

  it('returns false if an invisible non-empty label is present', () => {
    const params = checkSetup(
      '<label><span style="display: none">Text</span> <input type="text" id="target"></label>'
    );
    expect(checkEvaluate.apply(checkContext, params)).toBe(false);
  });

  it('returns true if a non-empty label is present', () => {
    const params = checkSetup(
      '<label>Text <input type="text" id="target"></label>'
    );
    expect(checkEvaluate.apply(checkContext, params)).toBe(true);
  });

  it('returns false if a label is not present', () => {
    const node = document.createElement('input');
    node.type = 'text';
    fixtureSetup(node);
    const virtualNode = axe.utils.getNodeFromTree(node);
    expect(checkEvaluate.call(checkContext, null, {}, virtualNode)).toBe(false);
  });

  describe('data', () => {
    it('is null if there is no label', () => {
      const params = checkSetup('<input type="text" id="target">');
      checkEvaluate.apply(checkContext, params);
      expect(checkContext._data).toBeNull();
    });

    it('includes the implicit label if one is set', () => {
      const params = checkSetup(
        '<label>Some <input type="text" id="target"> text</label>'
      );
      checkEvaluate.apply(checkContext, params);
      expect(checkContext._data).toEqual({ implicitLabel: 'Some text' });
    });

    it('has { implicitLabel: "" } when the label is empty', () => {
      const params = checkSetup(
        '<label> <input type="text" id="target"> </label>'
      );
      checkEvaluate.apply(checkContext, params);
      expect(checkContext._data).toEqual({ implicitLabel: '' });
    });
  });

  describe('relatedNodes', () => {
    it('is null if there is no label', () => {
      const params = checkSetup('<input type="text" id="target">');
      checkEvaluate.apply(checkContext, params);
      expect(checkContext._relatedNodes).toHaveLength(0);
    });

    it('includes the nearest label as its related node', () => {
      const params = checkSetup(
        '<label id="lbl"> <input type="text" id="target"> </label>'
      );
      checkEvaluate.apply(checkContext, params);
      const ids = checkContext._relatedNodes.map(node => '#' + node.id);
      expect(ids).toEqual(['#lbl']);
    });
  });

  describe('SerialVirtualNode', () => {
    it('returns false if no implicit label', () => {
      const virtualNode = new axe.SerialVirtualNode({
        nodeName: 'input',
        attributes: {
          type: 'text'
        }
      });
      virtualNode.parent = null;
      expect(checkEvaluate.call(checkContext, null, {}, virtualNode)).toBe(
        false
      );
    });

    it('returns undefined if tree is not complete', () => {
      const virtualNode = new axe.SerialVirtualNode({
        nodeName: 'input',
        attributes: {
          type: 'text'
        }
      });
      expect(
        checkEvaluate.call(checkContext, null, {}, virtualNode)
      ).toBeUndefined();
    });
  });
});
