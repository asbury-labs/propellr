import { describe, it, expect, afterEach } from 'vitest';
import {
  checkSetup,
  getCheckEvaluate,
  MockCheckContext
} from '../../../testutils';

describe('non-empty-value', function () {
  const fixture = document.getElementById('fixture')!;
  const checkEvaluate = getCheckEvaluate('non-empty-value');
  const checkContext = MockCheckContext();

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('should return true if an value is present', function () {
    const params = checkSetup('<input id="target" value="woohoo" />');

    expect(checkEvaluate.apply(checkContext, params)).toBe(true);
  });

  it('should return false if an value is not present', function () {
    const params = checkSetup('<input id="target" />');

    expect(checkEvaluate.apply(checkContext, params)).toBe(false);
    expect(checkContext._data.messageKey).toBe('noAttr');
  });

  it('should return false if an value is present, but empty', function () {
    const params = checkSetup('<input id="target" value=" " />');

    expect(checkEvaluate.apply(checkContext, params)).toBe(false);
    expect(checkContext._data.messageKey).toBe('emptyAttr');
  });

  it('should collapse whitespace', function () {
    const params = checkSetup(
      '<input id="target" value=" \t \n \r \t  \t\r\n " />'
    );

    expect(checkEvaluate.apply(checkContext, params)).toBe(false);
    expect(checkContext._data.messageKey).toBe('emptyAttr');
  });
});
