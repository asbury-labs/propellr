import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('is-on-screen', function () {
  const queryFixture = axe.testUtils.queryFixture;

  it('should return true for visible elements', function () {
    const vNode = queryFixture('<div id="target">elm</div>');

    expect(axe.testUtils.getCheckEvaluate('is-on-screen')(vNode)).toBe(true);
  });

  it('should return true for aria-hidden=true elements', function () {
    const vNode = queryFixture('<div id="target" aria-hidden="true">elm</div>');

    expect(axe.testUtils.getCheckEvaluate('is-on-screen')(vNode)).toBe(true);
  });

  it('should return false for display:none elements', function () {
    const vNode = queryFixture(
      '<div id="target" style="display:none">elm</div>'
    );

    expect(axe.testUtils.getCheckEvaluate('is-on-screen')(vNode)).toBe(false);
  });

  it('should return false for off screen elements', function () {
    const vNode = queryFixture(
      '<div id="target" style="position:absolute; top:-10000px">elm</div>'
    );

    expect(axe.testUtils.getCheckEvaluate('is-on-screen')(vNode)).toBe(false);
  });
});
