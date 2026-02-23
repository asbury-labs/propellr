import { describe, it, expect, afterEach } from 'vitest';
import {
  checkSetup,
  getCheckEvaluate,
  MockCheckContext
} from '../../../testutils';

declare const axe: any;
describe('has-visible-text', function () {
  const checkContext = MockCheckContext();

  afterEach(function () {
    checkContext.reset();
  });

  it('should return false if there is no visible text', function () {
    const params = checkSetup('<p id="target"></p>');
    expect(
      getCheckEvaluate('has-visible-text').apply(checkContext, params)
    ).toBe(false);
  });

  it('should return false if there is text, but its hidden', function () {
    const params = checkSetup(
      '<p id="target"><span style="display:none">hello!</span></p>'
    );
    expect(
      getCheckEvaluate('has-visible-text').apply(checkContext, params)
    ).toBe(false);
  });

  it('should return true if there is visible text', function () {
    const params = checkSetup('<p id="target">hello!</p>');
    expect(
      getCheckEvaluate('has-visible-text').apply(checkContext, params)
    ).toBe(true);
  });

  describe('SerialVirtualNode', function () {
    it('should return false if element is not named from contents', function () {
      const node = new axe.SerialVirtualNode({
        nodeName: 'article'
      });

      expect(getCheckEvaluate('has-visible-text')(null, {}, node)).toBe(false);
    });

    it('should return incomplete if no other properties are set', function () {
      const node = new axe.SerialVirtualNode({
        nodeName: 'button'
      });

      expect(
        getCheckEvaluate('has-visible-text')(null, {}, node)
      ).toBeUndefined();
    });

    it('should return false if there is no visible text', function () {
      const node = new axe.SerialVirtualNode({
        nodeName: 'button'
      });
      node.children = [];

      expect(getCheckEvaluate('has-visible-text')(null, {}, node)).toBe(false);
    });

    it('should return true if there is visible text', function () {
      const node = new axe.SerialVirtualNode({
        nodeName: 'p'
      });
      const child = new axe.SerialVirtualNode({
        nodeName: '#text',
        nodeType: 3,
        nodeValue: 'hello!'
      });
      node.children = [child];

      expect(getCheckEvaluate('has-visible-text')(null, {}, node)).toBe(true);
    });
  });
});
