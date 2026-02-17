import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('non-empty-placeholder', function () {
  const fixture = document.getElementById('fixture');
  const checkSetup = axe.testUtils.checkSetup;
  const checkEvaluate = axe.testUtils.getCheckEvaluate('non-empty-placeholder');
  const checkContext = axe.testUtils.MockCheckContext();

  afterEach(function () {
    fixture.innerHTML = '';
    checkContext.reset();
  });

  it('should return true if a placeholder is present', function () {
    const params = checkSetup('<input id="target" placeholder="woohoo" />');

    expect(checkEvaluate.apply(checkContext, params)).toBe(true);
  });

  it('should return false if a placeholder is not present', function () {
    const params = checkSetup('<input id="target" />');

    expect(checkEvaluate.apply(checkContext, params)).toBe(false);
    expect(checkContext._data.messageKey).toBe('noAttr');
  });

  it('should return false if a placeholder is present, but empty', function () {
    const params = checkSetup('<input id="target" placeholder=" " />');

    expect(checkEvaluate.apply(checkContext, params)).toBe(false);
    expect(checkContext._data.messageKey).toBe('emptyAttr');
  });

  it('should collapse whitespace', function () {
    const params = checkSetup(
      '<input id="target" placeholder=" \t \n \r \t  \t\r\n " />'
    );

    expect(checkEvaluate.apply(checkContext, params)).toBe(false);
    expect(checkContext._data.messageKey).toBe('emptyAttr');
  });
});
