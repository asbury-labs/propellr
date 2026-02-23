import { describe, it, expect, afterEach } from 'vitest';
import {
  flatTreeSetup,
  getCheckEvaluate,
  MockCheckContext
} from '../../../testutils';

describe('aria-hidden', function () {
  const checkContext = MockCheckContext();
  const body = document.body;
  afterEach(function () {
    checkContext.reset();
    body.removeAttribute('aria-hidden');
  });

  it('should not be present on document.body', function () {
    const tree = flatTreeSetup(body);
    expect(
      getCheckEvaluate('aria-hidden-body').call(checkContext, null, {}, tree[0])
    ).toBe(true);
  });

  it('fails appropriately if aria-hidden=true on document.body', function () {
    body.setAttribute('aria-hidden', true);
    const tree = flatTreeSetup(body);
    expect(
      getCheckEvaluate('aria-hidden-body').call(checkContext, null, {}, tree[0])
    ).toBe(false);
  });

  it('passes if aria-hidden=false on document.body', function () {
    body.setAttribute('aria-hidden', 'false');
    const tree = flatTreeSetup(body);
    expect(
      getCheckEvaluate('aria-hidden-body').call(checkContext, null, {}, tree[0])
    ).toBe(true);
  });
});
