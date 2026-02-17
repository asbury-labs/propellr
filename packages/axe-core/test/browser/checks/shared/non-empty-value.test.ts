import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('non-empty-value', function () {
  const fixture = document.getElementById('fixture');
  const checkSetup = axe.testUtils.checkSetup;
  const checkEvaluate = axe.testUtils.getCheckEvaluate('non-empty-value');
  const checkContext = axe.testUtils.MockCheckContext();

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
