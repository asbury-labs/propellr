import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { flatTreeSetup } from '../../testutils';

declare const axe: any;
describe('inserted-into-focus-order-matches', function () {
  const fixture = document.getElementById('fixture');
  let rule;

  beforeEach(function () {
    rule = axe.utils.getRule('focus-order-semantics');
  });

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('should return true for a non-focusable element with tabindex > -1', function () {
    fixture.innerHTML = '<div tabindex="0"></div>';
    flatTreeSetup(fixture);
    const node = fixture.firstChild;
    expect(rule.matches(node)).toBe(true);
  });

  it('should return false for a non-focusable element with tabindex == -1', function () {
    fixture.innerHTML = '<div tabindex="-1"></div>';
    flatTreeSetup(fixture);
    const node = fixture.firstChild;
    expect(rule.matches(node)).toBe(false);
  });

  it('should return false for a native focusable element with tabindex > 0', function () {
    fixture.innerHTML = '<button tabindex="0"></button>';
    flatTreeSetup(fixture);
    const node = fixture.firstChild;
    expect(rule.matches(node)).toBe(false);
  });

  it('should return false for a native focusable element with no tabindex', function () {
    fixture.innerHTML = '<a href="#"></a>';
    flatTreeSetup(fixture);
    const node = fixture.firstChild;
    expect(rule.matches(node)).toBe(false);
  });

  it('should return false for non-numeric tabindex value', function () {
    fixture.innerHTML = '<div tabindex="abc"></div>';
    flatTreeSetup(fixture);
    const node = fixture.firstChild;
    expect(rule.matches(node)).toBe(false);
  });
});
