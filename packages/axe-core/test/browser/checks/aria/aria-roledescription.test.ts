import { describe, it, expect, afterEach } from 'vitest';
import {
  getCheckEvaluate,
  MockCheckContext,
  queryFixture
} from '../../../testutils';

describe('aria-roledescription', function () {
  const checkContext = MockCheckContext();

  afterEach(function () {
    checkContext.reset();
  });

  it('returns true for elements with an implicit supported role', function () {
    const vNode = queryFixture(
      '<button aria-roledescription="Awesome Button" id="target">Click</button>'
    );
    const actual = getCheckEvaluate('aria-roledescription').call(
      checkContext,
      null,
      {
        supportedRoles: ['button']
      },
      vNode
    );
    expect(actual).toBe(true);
    expect(checkContext._data).toBeNull();
  });

  it('returns true for elements with an explicit supported role', function () {
    const vNode = queryFixture(
      '<div role="radio" aria-roledescription="Awesome Radio" id="target">Click</div>'
    );
    const actual = getCheckEvaluate('aria-roledescription').call(
      checkContext,
      null,
      {
        supportedRoles: ['radio']
      },
      vNode
    );
    expect(actual).toBe(true);
    expect(checkContext._data).toBeNull();
  });

  it('returns undefined for elements with an unsupported role', function () {
    const vNode = queryFixture(
      '<div role="main" aria-roledescription="Awesome Main" id="target">The main element</div>'
    );
    const actual = getCheckEvaluate('aria-roledescription').call(
      checkContext,
      null,
      {},
      vNode
    );
    expect(actual).toBe(undefined);
    expect(checkContext._data).toBeNull();
  });

  it('returns false for elements without role', function () {
    const vNode = queryFixture(
      '<div aria-roledescription="Awesome Main" id="target">The main element</div>'
    );
    const actual = getCheckEvaluate('aria-roledescription').call(
      checkContext,
      null,
      {},
      vNode
    );
    expect(actual).toBe(false);
    expect(checkContext._data).toBeNull();
  });

  it('returns false for elements with role=presentation', function () {
    const vNode = queryFixture(
      '<div role="presentation" aria-roledescription="Awesome Main" id="target">The main element</div>'
    );
    const actual = getCheckEvaluate('aria-roledescription').call(
      checkContext,
      null,
      {},
      vNode
    );
    expect(actual).toBe(false);
    expect(checkContext._data).toBeNull();
  });

  it('returns false for elements with role=none', function () {
    const vNode = queryFixture(
      '<div role="none" aria-roledescription="Awesome Main" id="target">The main element</div>'
    );

    const actual = getCheckEvaluate('aria-roledescription').call(
      checkContext,
      null,
      {},
      vNode
    );
    expect(actual).toBe(false);
    expect(checkContext._data).toBeNull();
  });
});
