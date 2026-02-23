import { describe, it, expect, afterEach } from 'vitest';
import {
  checkSetup,
  getCheckEvaluate,
  MockCheckContext
} from '../../../testutils';

describe('aria-busy', function () {
  const checkContext = MockCheckContext();
  const checkEvaluate = getCheckEvaluate('aria-busy');

  afterEach(function () {
    checkContext.reset();
  });

  it('should return false if no aria-busy tag on element', function () {
    const params = checkSetup('<div id="target" role="list"></div>');
    expect(checkEvaluate.apply(checkContext, params)).toBe(false);
  });

  it('should return false if aria-busy is set to false', function () {
    const params = checkSetup(
      '<div id="target" role="list" aria-busy="false"></div>'
    );
    expect(checkEvaluate.apply(checkContext, params)).toBe(false);
  });

  it('should return true if aria-busy is set to true', function () {
    const params = checkSetup(
      '<div id="target" role="list" aria-busy="true"></div>'
    );
    expect(checkEvaluate.apply(checkContext, params)).toBe(true);
  });
});
