import { describe, it, expect, afterEach } from 'vitest';
import { getCheckEvaluate, MockCheckContext, queryFixture, shadowCheckSetup } from '../../../testutils';

declare const axe: any;
describe('internal-link-present', function () {
  const fixture = document.getElementById('fixture')!;
  const checkContext = MockCheckContext();

  afterEach(function () {
    fixture.innerHTML = '';
    axe._tree = undefined;
    checkContext.reset();
  });

  it('should return true when an internal link is found', function () {
    const vNode = queryFixture('<div id="target"><a href="#haha">hi</a></div>');
    expect(
      getCheckEvaluate('internal-link-present').call(
        checkContext,
        null,
        {},
        vNode
      )
    ).toBe(true);
  });

  it('should return false when a hashbang URL was used', function () {
    const vNode = queryFixture('<div id="target"><a href="#!foo">hi</a></div>');
    expect(
      getCheckEvaluate('internal-link-present').call(
        checkContext,
        null,
        {},
        vNode
      )
    ).toBe(false);
  });

  it('should return false when a hash route URL was used', function () {
    const vNode = queryFixture(
      '<div id="target"><a href="#/home">hi</a></div>'
    );
    expect(
      getCheckEvaluate('internal-link-present').call(
        checkContext,
        null,
        {},
        vNode
      )
    ).toBe(false);
  });

  it('should return false when a hashbang + slash route URL was used', function () {
    const vNode = queryFixture(
      '<div id="target"><a href="#!/home">hi</a></div>'
    );
    expect(
      getCheckEvaluate('internal-link-present').call(
        checkContext,
        null,
        {},
        vNode
      )
    ).toBe(false);
  });

  it('should otherwise return false', function () {
    const vNode = queryFixture(
      '<div id="target"><a href="http://www.deque.com/#haha">hi</a></div>'
    );
    expect(
      getCheckEvaluate('internal-link-present').call(
        checkContext,
        null,
        {},
        vNode
      )
    ).toBe(false);
  });

  it(
    'should return true when internal link is found in shadow dom',
    function () {
      const params = shadowCheckSetup(
        '<div id="target"></div>',
        '<a href="#haha">hi</a>'
      );
      const vNode = params[2];
      expect(
        getCheckEvaluate('internal-link-present').call(
          checkContext,
          null,
          {},
          vNode
        )
      ).toBe(true);
    }
  );
});
