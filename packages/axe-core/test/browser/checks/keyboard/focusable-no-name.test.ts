import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('focusable-no-name', function () {
  const fixture = document.getElementById('fixture');
  const checkSetup = axe.testUtils.checkSetup;
  const shadowCheckSetup = axe.testUtils.shadowCheckSetup;
  const shadowSupport = axe.testUtils.shadowSupport;

  const checkContext = axe.testUtils.MockCheckContext();

  afterEach(function () {
    fixture.innerHTML = '';
    axe._tree = undefined;
    checkContext.reset();
  });

  it('should pass if tabindex < 0', function () {
    const params = checkSetup('<a href="#" tabindex="-1" id="target"></a>');
    expect(
      axe.testUtils
        .getCheckEvaluate('focusable-no-name')
        .apply(checkContext, params)
    ).toBe(false);
  });

  it('should pass element is not natively focusable', function () {
    const params = checkSetup('<span role="link" href="#" id="target"></span>');
    expect(
      axe.testUtils
        .getCheckEvaluate('focusable-no-name')
        .apply(checkContext, params)
    ).toBe(false);
  });

  it('should fail if element is tabbable with no name - native', function () {
    const params = checkSetup('<a href="#" id="target"></a>');
    expect(
      axe.testUtils
        .getCheckEvaluate('focusable-no-name')
        .apply(checkContext, params)
    ).toBe(true);
  });

  it('should fail if element is tabbable with no name - ARIA', function () {
    const params = checkSetup(
      '<span tabindex="0" role="link" id="target" href="#"></spam>'
    );
    expect(
      axe.testUtils
        .getCheckEvaluate('focusable-no-name')
        .apply(checkContext, params)
    ).toBe(true);
  });

  it('should pass if the element is tabbable but has an accessible name', function () {
    const params = checkSetup('<a href="#" title="Hello" id="target"></a>');
    expect(
      axe.testUtils
        .getCheckEvaluate('focusable-no-name')
        .apply(checkContext, params)
    ).toBe(false);
  });

  (shadowSupport.v1 ? it : xit)(
    'should pass if the content is passed in with shadow DOM',
    function () {
      const params = shadowCheckSetup(
        '<div>Content!</div>',
        '<a href="#" id="target"><slot></slot></a>'
      );

      expect(
        axe.testUtils
          .getCheckEvaluate('focusable-no-name')
          .apply(checkContext, params)
      ).toBe(false);
    }
  );

  describe('Serial Virtual Node', function () {
    it('should pass if tabindex < 0', function () {
      const serialNode = new axe.SerialVirtualNode({
        nodeName: 'a',
        attributes: {
          tabindex: '-1',
          href: '#'
        }
      });

      expect(
        axe.testUtils.getCheckEvaluate('focusable-no-name')(
          null,
          {},
          serialNode
        )
      ).toBe(false);
    });

    it('should pass element is not natively focusable', function () {
      const serialNode = new axe.SerialVirtualNode({
        nodeName: 'span',
        attributes: {
          role: 'link',
          href: '#'
        }
      });

      expect(
        axe.testUtils.getCheckEvaluate('focusable-no-name')(
          null,
          {},
          serialNode
        )
      ).toBe(false);
    });

    it('should fail if element is tabbable with no name - native', function () {
      const serialNode = new axe.SerialVirtualNode({
        nodeName: 'a',
        attributes: {
          href: '#'
        }
      });
      serialNode.children = [];

      expect(
        axe.testUtils.getCheckEvaluate('focusable-no-name')(
          null,
          {},
          serialNode
        )
      ).toBe(true);
    });

    it('should return undefined if element is tabbable with no name nor children - native', function () {
      const serialNode = new axe.SerialVirtualNode({
        nodeName: 'a',
        attributes: {
          href: '#'
        }
      });

      expect(
        axe.testUtils.getCheckEvaluate('focusable-no-name')(
          null,
          {},
          serialNode
        )
      ).toBeUndefined();
    });

    it('should pass if the element is tabbable but has an accessible name', function () {
      const serialNode = new axe.SerialVirtualNode({
        nodeName: 'a',
        attributes: {
          href: '#',
          title: 'Hello'
        }
      });
      serialNode.children = [];

      expect(
        axe.testUtils.getCheckEvaluate('focusable-no-name')(
          null,
          {},
          serialNode
        )
      ).toBe(false);
    });
  });
});
