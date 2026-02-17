import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
describe('is-initiator-matches', function () {
  let rule;

  beforeEach(function () {
    rule = axe.utils.getRule('html-has-lang');
  });

  afterEach(function () {
    const fixture = document.getElementById('fixture');
    fixture.innerHTML = '';
  });

  it('should return true if the context is the initiator', function () {
    expect(rule.matches(null, null, { initiator: true })).toBe(true);
  });

  it('should return false if the context is not the initiator', function () {
    expect(rule.matches(null, null, { initiator: false })).toBe(false);
  });
});
