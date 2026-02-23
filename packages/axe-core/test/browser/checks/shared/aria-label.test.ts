import { describe, it, expect, afterEach } from 'vitest';
import { checkSetup, getCheckEvaluate } from '../../../testutils';

describe('aria-label', function () {
  const fixture = document.getElementById('fixture')!;

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('should return true if an aria-label is present', function () {
    const checkArgs = checkSetup('<div id="target" aria-label="woohoo"></div>');
    expect(getCheckEvaluate('aria-label').apply(null, checkArgs)).toBe(true);
  });

  it('should return false if an aria-label is not present', function () {
    const checkArgs = checkSetup('<div id="target"></div>');
    expect(getCheckEvaluate('aria-label').apply(null, checkArgs)).toBe(false);
  });

  it('should return false if an aria-label is present, but empty', function () {
    const checkArgs = checkSetup('<div id="target" aria-label=" "></div>');
    expect(getCheckEvaluate('aria-label').apply(null, checkArgs)).toBe(false);
  });

  it('should collapse whitespace', function () {
    const checkArgs = checkSetup(
      '<div id="target" aria-label=" \t \n \r \t  \t\r\n "></div>'
    );
    expect(getCheckEvaluate('aria-label').apply(null, checkArgs)).toBe(false);
  });
});
