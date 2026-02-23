import { describe, it, expect, afterEach } from 'vitest';
import { checkSetup, checks, MockCheckContext } from '../../../testutils';

describe('alt-space-value', function () {
  const checkContext = MockCheckContext();
  const check = checks['alt-space-value'];

  afterEach(function () {
    checkContext.reset();
  });

  it('should return true if alt contains a space character', function () {
    const params = checkSetup('<img id="target" alt=" " />');
    expect(check.evaluate.apply(checkContext, params)).toBe(true);
  });

  it('should return true if alt contains a non-breaking space character', function () {
    const params = checkSetup('<img id="target" alt="&nbsp;" />');
    expect(check.evaluate.apply(checkContext, params)).toBe(true);
  });

  it('should return false if alt attribute is empty', function () {
    const params = checkSetup('<img id="target" alt="" />');
    expect(check.evaluate.apply(checkContext, params)).toBe(false);
  });

  it('should return false if alt attribute has a proper text value', function () {
    const params = checkSetup('<img id="target" alt="text content" />');
    expect(check.evaluate.apply(checkContext, params)).toBe(false);
  });
});
