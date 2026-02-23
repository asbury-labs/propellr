import { describe, it, expect, afterEach } from 'vitest';
import { checkSetup, getCheckEvaluate } from '../../../testutils';

describe('has-alt', function () {
  const fixture = document.getElementById('fixture')!;

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('should return true if an alt is present', function () {
    const checkArgs = checkSetup('<img id="target" alt="woohoo" />');
    expect(getCheckEvaluate('has-alt').apply(null, checkArgs)).toBe(true);
  });

  it('should return true if an empty alt is present', function () {
    const checkArgs = checkSetup('<img id="target" alt="" />');
    expect(getCheckEvaluate('has-alt').apply(null, checkArgs)).toBe(true);
  });

  it('should return true if a null alt is present', function () {
    const checkArgs = checkSetup('<img id="target" alt />');
    expect(getCheckEvaluate('has-alt').apply(null, checkArgs)).toBe(true);
  });

  it('should return false if an alt is not present', function () {
    const checkArgs = checkSetup('<img id="target" />');
    expect(getCheckEvaluate('has-alt').apply(null, checkArgs)).toBe(false);
  });
});
