import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('unique-frame-title', function () {
  const checkContext = axe.testUtils.MockCheckContext();
  const queryFixture = axe.testUtils.queryFixture;

  afterEach(function () {
    checkContext.reset();
  });

  it('should log title to data and return true', function () {
    const vNode = queryFixture('<iframe id="target" title="bananas"></iframe>');
    expect(
      axe.testUtils
        .getCheckEvaluate('unique-frame-title')
        .call(checkContext, null, {}, vNode)
    ).toBe(true);
    expect(checkContext._data).toBe('bananas');
  });

  it('should convert text to lower case', function () {
    const vNode = queryFixture(
      '<iframe id="target" title="\t  app\t \n \rle  "></iframe>'
    );
    axe.testUtils
      .getCheckEvaluate('unique-frame-title')
      .call(checkContext, null, {}, vNode);
    expect(checkContext._data).toBe('app le');
  });

  it('should take out space differences', function () {
    const vNode = queryFixture('<iframe id="target" title="APPLE"></iframe>');
    axe.testUtils
      .getCheckEvaluate('unique-frame-title')
      .call(checkContext, null, {}, vNode);
    expect(checkContext._data).toBe('apple');
  });
});
