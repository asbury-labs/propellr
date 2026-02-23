import { describe, it, expect, afterEach } from 'vitest';
import {
  checkSetup,
  getCheckEvaluate,
  MockCheckContext
} from '../../../testutils';

describe('aria-prohibited-attr', function () {
  const checkContext = MockCheckContext();
  const checkEvaluate = getCheckEvaluate('aria-level');

  afterEach(function () {
    checkContext.reset();
  });

  it('should return true if aria-level is less than 6', function () {
    const params = checkSetup('<div id="target" aria-level="2">Contents</div>');
    expect(checkEvaluate.apply(checkContext, params)).toBe(true);
  });

  it('should return true if aria-level is 6', function () {
    const params = checkSetup('<div id="target" aria-level="6">Contents</div>');
    expect(checkEvaluate.apply(checkContext, params)).toBe(true);
  });

  it('should return true if aria-level is negative', function () {
    const params = checkSetup(
      '<div id="target" aria-level="-2">Contents</div>'
    );
    expect(checkEvaluate.apply(checkContext, params)).toBe(true);
  });

  it('should return true if there is no aria-level', function () {
    const params = checkSetup('<div id="target">Contents</div>');
    expect(checkEvaluate.apply(checkContext, params)).toBe(true);
  });

  it('should return undefined if aria-level is greater than 6', function () {
    const params = checkSetup('<div id="target" aria-level="8">Contents</div>');
    expect(checkEvaluate.apply(checkContext, params)).toBeUndefined();
  });
});
