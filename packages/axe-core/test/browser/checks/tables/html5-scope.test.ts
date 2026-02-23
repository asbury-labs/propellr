import { describe, it, expect, afterEach } from 'vitest';
import { getCheckEvaluate } from '../../../testutils';

describe('html5-scope', function () {
  const fixture = document.getElementById('fixture')!;

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('should return true on THs', function () {
    fixture.innerHTML = '<table><tr><th scope="col"></th></tr></table>';
    const node = fixture.querySelector('th');

    expect(getCheckEvaluate('html5-scope')(node)).toBe(true);
  });

  it('should return false on TDs', function () {
    fixture.innerHTML = '<table><tr><td scope="col"></td></tr></table>';
    const node = fixture.querySelector('td');

    expect(getCheckEvaluate('html5-scope')(node)).toBe(false);
  });

  it('should return true on non-HTML5 documents', function () {
    const origPublicId = document.publicId;
    fixture.innerHTML = '<table><tr><th scope="col"></th></tr></table>';
    const node = fixture.querySelector('th');

    expect(getCheckEvaluate('html5-scope')(node)).toBe(true);
    document.publicId = origPublicId;
  });
});
