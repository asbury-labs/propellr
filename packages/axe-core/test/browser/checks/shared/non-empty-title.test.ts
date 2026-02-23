import { describe, it, expect, afterEach } from 'vitest';
import {
  checkSetup,
  getCheckEvaluate,
  MockCheckContext
} from '../../../testutils';

describe('non-empty-title', function () {
  const fixture = document.getElementById('fixture')!;
  const checkEvaluate = getCheckEvaluate('non-empty-title');
  const checkContext = MockCheckContext();

  afterEach(function () {
    fixture.innerHTML = '';
    checkContext.reset();
  });

  it('should return true if a title is present', function () {
    const params = checkSetup('<img id="target" title="woohoo" />');

    expect(checkEvaluate.apply(checkContext, params)).toBe(true);
  });

  it('should return false if a title is not present', function () {
    const params = checkSetup('<img id="target" />');

    expect(checkEvaluate.apply(checkContext, params)).toBe(false);
    expect(checkContext._data.messageKey).toBe('noAttr');
  });

  it('should return false if a title is present, but empty', function () {
    const params = checkSetup('<img id="target" title=" " />');

    expect(checkEvaluate.apply(checkContext, params)).toBe(false);
    expect(checkContext._data.messageKey).toBe('emptyAttr');
  });

  it('should collapse whitespace', function () {
    const params = checkSetup(
      '<img id="target" title=" \t \n \r \t  \t\r\n " />'
    );

    expect(checkEvaluate.apply(checkContext, params)).toBe(false);
    expect(checkContext._data.messageKey).toBe('emptyAttr');
  });
});
