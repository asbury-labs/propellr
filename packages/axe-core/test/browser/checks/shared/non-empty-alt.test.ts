import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('non-empty-alt', function () {
  const fixture = document.getElementById('fixture');
  const checkSetup = axe.testUtils.checkSetup;
  const checkEvaluate = axe.testUtils.getCheckEvaluate('non-empty-alt');
  const checkContext = axe.testUtils.MockCheckContext();

  afterEach(function () {
    fixture.innerHTML = '';
    checkContext.reset();
  });

  it('should return true if an alt is present', function () {
    const params = checkSetup('<img id="target" alt="woohoo" />');
    expect(checkEvaluate.apply(checkContext, params)).toBe(true);
  });

  it('should return false if an alt is not present', function () {
    const params = checkSetup('<img id="target" />');
    expect(checkEvaluate.apply(checkContext, params)).toBe(false);
    expect(checkContext._data.messageKey).toBe('noAttr');
  });

  it('should return false if an alt is present, but empty', function () {
    const params = checkSetup('<img id="target" alt=" " />');
    expect(checkEvaluate.apply(checkContext, params)).toBe(false);
    expect(checkContext._data.messageKey).toBe('emptyAttr');
  });

  it('should collapse whitespace', function () {
    const params = checkSetup(
      '<img id="target" alt=" \t \n \r \t  \t\r\n " />'
    );
    expect(checkEvaluate.apply(checkContext, params)).toBe(false);
    expect(checkContext._data.messageKey).toBe('emptyAttr');
  });
});
