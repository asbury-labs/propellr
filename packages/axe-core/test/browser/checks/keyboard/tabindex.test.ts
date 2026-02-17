import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('tabindex', function () {
  const checkContext = axe.testUtils.MockCheckContext();
  const queryFixture = axe.testUtils.queryFixture;

  afterEach(function () {
    checkContext.reset();
  });

  it('should fail if the testutils.jstabindex is >= 0', function () {
    const vNode = queryFixture('<div id="target" tabindex="1"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('tabindex')
        .call(checkContext, null, {}, vNode)
    ).toBe(false);
  });

  it('should pass if the tabindex is <= 0', function () {
    const vNode = queryFixture('<div id="target" tabindex="0"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('tabindex')
        .call(checkContext, null, {}, vNode)
    ).toBe(true);
  });

  it('should look at the attribute and not the property', function () {
    const node = document.createElement('div');
    node.setAttribute('tabindex', '1');
    node.tabindex = null;
    const tree = axe.testUtils.flatTreeSetup(node);
    expect(
      axe.testUtils
        .getCheckEvaluate('tabindex')
        .call(checkContext, null, {}, tree[0])
    ).toBe(false);
  });

  it('should pass if tabindex is NaN', function () {
    const vNode = queryFixture('<div id="target" tabindex="foobar"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('tabindex')
        .call(checkContext, null, {}, vNode)
    ).toBe(true);
  });
});
