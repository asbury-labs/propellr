import { describe, it, expect, afterEach } from 'vitest';
import {
  getCheckEvaluate,
  MockCheckContext,
  queryFixture
} from '../../../testutils';

declare const axe: any;
describe('aria-valid-attr', function () {
  const checkContext = MockCheckContext();

  afterEach(function () {
    checkContext.reset();
  });

  it('should return false if any invalid ARIA attributes are found', function () {
    const vNode = queryFixture(
      '<div id="target" tabindex="1" aria-cats="true" aria-dogs="true"></div>'
    );
    expect(
      getCheckEvaluate('aria-valid-attr').call(checkContext, null, null, vNode)
    ).toBe(false);
    expect(checkContext._data).toEqual(['aria-cats', 'aria-dogs']);
  });

  it('should return true if no invalid ARIA attributes are found', function () {
    const vNode = queryFixture(
      '<div id="target" tabindex="1" aria-selected="true"></div>'
    );
    expect(
      getCheckEvaluate('aria-valid-attr').call(checkContext, null, null, vNode)
    ).toBe(true);
    expect(checkContext._data).toBeNull();
  });

  it('should return true for unsupported ARIA attributes', function () {
    axe.configure({
      standards: {
        ariaAttrs: {
          'aria-mccheddarton': {
            unsupported: true
          }
        }
      }
    });

    const vNode = queryFixture(
      '<div id="target" tabindex="1" aria-mccheddarton="true"></div>'
    );
    expect(
      getCheckEvaluate('aria-valid-attr').call(checkContext, null, null, vNode)
    ).toBe(true);
    expect(checkContext._data).toBeNull();
  });

  describe('options', function () {
    it('should exclude provided attribute names', function () {
      const vNode = queryFixture(
        '<div id="target" aria-bats="cat" aria-puppies="2"></div>'
      );
      expect(
        getCheckEvaluate('aria-valid-attr').call(
          checkContext,
          null,
          ['aria-bats', 'aria-puppies'],
          vNode
        )
      ).toBe(true);
    });
  });
});
