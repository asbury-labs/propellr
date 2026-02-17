import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('role-none', function () {
  const fixture = document.getElementById('fixture');
  const queryFixture = axe.testUtils.queryFixture;
  const checkEvaluate = axe.testUtils.getCheckEvaluate('role-none');

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('should detect role="none" on the element', function () {
    const vNode = queryFixture('<div id="target" role="none"></div>');

    expect(checkEvaluate(null, null, vNode)).toBe(true);
  });

  it('should return false when role !== none', function () {
    const vNode = queryFixture('<div id="target" role="cats"></div>');

    expect(checkEvaluate(null, null, vNode)).toBe(false);
  });

  it('should return false when there is no role attribute', function () {
    const vNode = queryFixture('<div id="target"></div>');

    expect(checkEvaluate(null, null, vNode)).toBe(false);
  });
});
