import { describe, it, expect, afterEach } from 'vitest';
import { getCheckEvaluate, queryFixture } from '../../../testutils';

describe('role-presentation', function () {
  const fixture = document.getElementById('fixture')!;
  const checkEvaluate = getCheckEvaluate('role-presentation');

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('should detect role="presentation" on the element', function () {
    const vNode = queryFixture('<div id="target" role="presentation"></div>');

    expect(checkEvaluate(null, null, vNode)).toBe(true);
  });

  it('should return false when role !== presentation', function () {
    const vNode = queryFixture('<div id="target" role="cats"></div>');

    expect(checkEvaluate(null, null, vNode)).toBe(false);
  });

  it('should return false when there is no role attribute', function () {
    const vNode = queryFixture('<div id="target"></div>');

    expect(checkEvaluate(null, null, vNode)).toBe(false);
  });
});
