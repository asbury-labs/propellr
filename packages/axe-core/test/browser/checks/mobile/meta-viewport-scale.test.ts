import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('meta-viewport', function () {
  const queryFixture = axe.testUtils.queryFixture;
  const checkContext = axe.testUtils.MockCheckContext();

  afterEach(function () {
    checkContext.reset();
  });

  describe('; separator', function () {
    it('should return false on user-scalable=no', function () {
      const vNode = queryFixture(
        '<meta id="target" name="viewport" content="foo=bar, cats=dogs, user-scalable=no">'
      );

      expect(
        axe.testUtils
          .getCheckEvaluate('meta-viewport')
          .call(checkContext, null, null, vNode)
      ).toBe(false);
      expect(checkContext._data).toEqual('user-scalable=no');
    });

    it('should return false on user-scalable=no', function () {
      const vNode = queryFixture(
        '<meta id="target" name="viewport" content="foo=bar, cats=dogs, user-scalable=no, more-stuff=ok">'
      );

      expect(
        axe.testUtils
          .getCheckEvaluate('meta-viewport')
          .call(checkContext, null, null, vNode)
      ).toBe(false);
    });

    it('should return false on user-scalable in the range <-1, 1>', function () {
      const vNode = queryFixture(
        '<meta id="target" name="viewport" content="foo=bar, cats=dogs, user-scalable=0, more-stuff=ok">'
      );

      expect(
        axe.testUtils
          .getCheckEvaluate('meta-viewport')
          .call(checkContext, null, null, vNode)
      ).toBe(false);
    });

    it('should return false on user-scalable in the range <-1, 1>', function () {
      const vNode = queryFixture(
        '<meta id="target" name="viewport" content="foo=bar, cats=dogs, user-scalable=-0.5, more-stuff=ok">'
      );

      expect(
        axe.testUtils
          .getCheckEvaluate('meta-viewport')
          .call(checkContext, null, null, vNode)
      ).toBe(false);
    });

    it('should return true on user-scalable=yes', function () {
      const vNode = queryFixture(
        '<meta id="target" name="viewport" content="foo=bar, cats=dogs, user-scalable=yes, more-stuff=ok">'
      );

      expect(
        axe.testUtils.getCheckEvaluate('meta-viewport')(null, null, vNode)
      ).toBe(true);
    });

    it('should return false on maximum-scale=yes (translates to 1)', function () {
      const vNode = queryFixture(
        '<meta id="target" name="viewport" content="maximum-scale=yes">'
      );
      expect(
        axe.testUtils
          .getCheckEvaluate('meta-viewport')
          .call(checkContext, null, null, vNode)
      ).toBe(false);
    });

    it('should return true on negative maximum scale (should be ignored)', function () {
      const vNode = queryFixture(
        '<meta id="target" name="viewport" content="maximum-scale=-1">'
      );
      expect(
        axe.testUtils
          .getCheckEvaluate('meta-viewport')
          .call(checkContext, null, null, vNode)
      ).toBe(true);
    });

    it('should return true if maximum-scale >= options.scaleMinimum', function () {
      const vNode = queryFixture(
        '<meta id="target" name="viewport" content="foo=bar, maximum-scale=5, cats=dogs">'
      );

      expect(
        axe.testUtils.getCheckEvaluate('meta-viewport').call(
          checkContext,
          null,
          {
            scaleMinimum: 2
          },
          vNode
        )
      ).toBe(true);

      vNode = queryFixture(
        '<meta id="target" name="viewport" content="foo=bar, maximum-scale=3, cats=dogs">'
      );

      expect(
        axe.testUtils
          .getCheckEvaluate('meta-viewport')
          .call(checkContext, null, null, vNode)
      ).toBe(true);
    });

    it('should return false on maximum-scale < options.scaleMinimum', function () {
      const vNode = queryFixture(
        '<meta id="target" name="viewport" content="foo=bar, cats=dogs, user-scalable=yes, maximum-scale=1.5">'
      );

      expect(
        axe.testUtils.getCheckEvaluate('meta-viewport').call(
          checkContext,
          null,
          {
            scaleMinimum: 2
          },
          vNode
        )
      ).toBe(false);
      expect(checkContext._data).toEqual('maximum-scale');
    });

    it('should return true if neither user-scalable or maximum-scale are set', function () {
      const vNode = queryFixture(
        '<meta id="target" name="viewport" content="foo=bar, cats=dogs">'
      );

      expect(
        axe.testUtils
          .getCheckEvaluate('meta-viewport')
          .call(checkContext, null, null, vNode)
      ).toBe(true);
    });

    it('should not crash if viewport property does not have a value', function () {
      const vNode = queryFixture(
        '<meta id="target" name="viewport" content="user-scalable=1, minimal-ui">'
      );

      expect(
        axe.testUtils.getCheckEvaluate('meta-viewport')(null, null, vNode)
      ).toBe(true);
    });

    it('should not crash if viewport property does not have a value', function () {
      const vNode = queryFixture(
        '<meta id="target" name="viewport" content="user-scalable=1, minimal-ui">'
      );

      expect(
        checks['meta-viewport'].evaluate.call(checkContext, null, null, vNode)
      ).toBe(true);
    });
  });

  describe(', separator', function () {
    it('should return false on user-scalable=no', function () {
      const vNode = queryFixture(
        '<meta id="target" name="viewport" content="foo=bar, cats=dogs, user-scalable=no">'
      );

      expect(
        axe.testUtils
          .getCheckEvaluate('meta-viewport')
          .call(checkContext, null, null, vNode)
      ).toBe(false);
      expect(checkContext._data).toEqual('user-scalable=no');
    });

    it('should return false on user-scalable=no', function () {
      const vNode = queryFixture(
        '<meta id="target" name="viewport" content="foo=bar, cats=dogs, user-scalable=no, more-stuff=ok">'
      );

      expect(
        axe.testUtils
          .getCheckEvaluate('meta-viewport')
          .call(checkContext, null, null, vNode)
      ).toBe(false);
      expect(checkContext._data).toEqual('user-scalable=no');
    });

    it('should return false on user-scalable in the range <-1, 1>', function () {
      const vNode = queryFixture(
        '<meta id="target" name="viewport" content="foo=bar, cats=dogs, user-scalable=0, more-stuff=ok">'
      );

      expect(
        axe.testUtils
          .getCheckEvaluate('meta-viewport')
          .call(checkContext, null, null, vNode)
      ).toBe(false);
    });

    it('should return false on user-scalable in the range <-1, 1>', function () {
      const vNode = queryFixture(
        '<meta id="target" name="viewport" content="foo=bar, cats=dogs, user-scalable=-0.5, more-stuff=ok">'
      );

      expect(
        axe.testUtils
          .getCheckEvaluate('meta-viewport')
          .call(checkContext, null, null, vNode)
      ).toBe(false);
    });

    it('should return true on user-scalable=yes', function () {
      const vNode = queryFixture(
        '<meta id="target" name="viewport" content="foo=bar, cats=dogs, user-scalable=yes, more-stuff=ok">'
      );

      expect(
        axe.testUtils
          .getCheckEvaluate('meta-viewport')
          .call(checkContext, null, null, vNode)
      ).toBe(true);
    });

    it('should return true if maximum-scale >= options.scaleMinimum', function () {
      const vNode = queryFixture(
        '<meta id="target" name="viewport" content="foo=bar, maximum-scale=5, cats=dogs">'
      );

      expect(
        axe.testUtils
          .getCheckEvaluate('meta-viewport')
          .call(checkContext, null, null, vNode)
      ).toBe(true);

      const vNode = queryFixture(
        '<meta id="target" name="viewport" content="foo=bar, maximum-scale=2, cats=dogs">'
      );

      expect(
        axe.testUtils.getCheckEvaluate('meta-viewport').call(
          checkContext,
          null,
          {
            scaleMinimum: 2
          },
          vNode
        )
      ).toBe(true);
    });

    it('should return false on maximum-scale < options.scaleMinimum', function () {
      const vNode = queryFixture(
        '<meta id="target" name="viewport" content="foo=bar, cats=dogs, user-scalable=yes, maximum-scale=1.5">'
      );

      expect(
        axe.testUtils.getCheckEvaluate('meta-viewport').call(
          checkContext,
          null,
          {
            scaleMinimum: 2
          },
          vNode
        )
      ).toBe(false);
    });

    it('should return true if neither user-scalable or maximum-scale are set', function () {
      const vNode = queryFixture(
        '<meta id="target" name="viewport" content="foo=bar, cats=dogs">'
      );

      expect(
        axe.testUtils
          .getCheckEvaluate('meta-viewport')
          .call(checkContext, null, null, vNode)
      ).toBe(true);
    });
  });
});
