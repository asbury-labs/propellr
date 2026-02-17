import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('internal-link-present', function () {
  const fixture = document.getElementById('fixture');
  const shadowSupported = axe.testUtils.shadowSupport.v1;
  const checkContext = axe.testUtils.MockCheckContext();
  const shadowCheckSetup = axe.testUtils.shadowCheckSetup;
  const queryFixture = axe.testUtils.queryFixture;

  afterEach(function () {
    fixture.innerHTML = '';
    axe._tree = undefined;
    checkContext.reset();
  });

  it('should return true when an internal link is found', function () {
    const vNode = queryFixture('<div id="target"><a href="#haha">hi</a></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('internal-link-present')
        .call(checkContext, null, {}, vNode)
    ).toBe(true);
  });

  it('should return false when a hashbang URL was used', function () {
    const vNode = queryFixture('<div id="target"><a href="#!foo">hi</a></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('internal-link-present')
        .call(checkContext, null, {}, vNode)
    ).toBe(false);
  });

  it('should return false when a hash route URL was used', function () {
    const vNode = queryFixture(
      '<div id="target"><a href="#/home">hi</a></div>'
    );
    expect(
      axe.testUtils
        .getCheckEvaluate('internal-link-present')
        .call(checkContext, null, {}, vNode)
    ).toBe(false);
  });

  it('should return false when a hashbang + slash route URL was used', function () {
    const vNode = queryFixture(
      '<div id="target"><a href="#!/home">hi</a></div>'
    );
    expect(
      axe.testUtils
        .getCheckEvaluate('internal-link-present')
        .call(checkContext, null, {}, vNode)
    ).toBe(false);
  });

  it('should otherwise return false', function () {
    const vNode = queryFixture(
      '<div id="target"><a href="http://www.deque.com/#haha">hi</a></div>'
    );
    expect(
      axe.testUtils
        .getCheckEvaluate('internal-link-present')
        .call(checkContext, null, {}, vNode)
    ).toBe(false);
  });

  (shadowSupported ? it : xit)(
    'should return true when internal link is found in shadow dom',
    function () {
      const params = shadowCheckSetup(
        '<div id="target"></div>',
        '<a href="#haha">hi</a>'
      );
      const vNode = params[2];
      expect(
        axe.testUtils
          .getCheckEvaluate('internal-link-present')
          .call(checkContext, null, {}, vNode)
      ).toBe(true);
    }
  );
});
