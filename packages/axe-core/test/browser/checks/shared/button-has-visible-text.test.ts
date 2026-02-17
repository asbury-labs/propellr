import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('button-has-visible-text', function () {
  const fixture = document.getElementById('fixture');
  const checkSetup = axe.testUtils.checkSetup;
  const checkContext = axe.testUtils.MockCheckContext();

  afterEach(function () {
    fixture.innerHTML = '';
    checkContext.reset();
  });

  it('should return false if button element is empty', function () {
    const checkArgs = checkSetup('<button></button>', 'button');

    expect(
      axe.testUtils
        .getCheckEvaluate('button-has-visible-text')
        .apply(checkContext, checkArgs)
    ).toBe(false);
  });

  it('should return true if a button element has text', function () {
    const checkArgs = checkSetup('<button>Name</button>', 'button');

    expect(
      axe.testUtils
        .getCheckEvaluate('button-has-visible-text')
        .apply(checkContext, checkArgs)
    ).toBe(true);
  });

  it('should return true if ARIA button has text', function () {
    const checkArgs = checkSetup(
      '<div role="button">Text</div>',
      '[role=button]'
    );

    expect(
      axe.testUtils
        .getCheckEvaluate('button-has-visible-text')
        .apply(checkContext, checkArgs)
    ).toBe(true);
  });

  it('should return false if ARIA button has no text', function () {
    const checkArgs = checkSetup('<div role="button"></div>', '[role=button]');

    expect(
      axe.testUtils
        .getCheckEvaluate('button-has-visible-text')
        .apply(checkContext, checkArgs)
    ).toBe(false);
  });

  describe('SerialVirtualNode', function () {
    it('should return incomplete if no children are passed', function () {
      const node = new axe.SerialVirtualNode({
        nodeName: 'button'
      });

      expect(
        axe.testUtils.getCheckEvaluate('button-has-visible-text')(
          null,
          {},
          node
        )
      ).toBeUndefined();
    });

    it('should return false if button element is empty', function () {
      const node = new axe.SerialVirtualNode({
        nodeName: 'button'
      });
      node.children = [];

      expect(
        axe.testUtils.getCheckEvaluate('button-has-visible-text')(
          null,
          {},
          node
        )
      ).toBe(false);
    });

    it('should return true if a button element has text', function () {
      const node = new axe.SerialVirtualNode({
        nodeName: 'button'
      });
      const child = new axe.SerialVirtualNode({
        nodeName: '#text',
        nodeType: 3,
        nodeValue: 'Text'
      });
      node.children = [child];

      expect(
        axe.testUtils.getCheckEvaluate('button-has-visible-text')(
          null,
          {},
          node
        )
      ).toBe(true);
    });
  });
});
