import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
describe('layout-table-matches', function () {
  const fixture = document.getElementById('fixture');
  let rule;

  beforeEach(function () {
    rule = axe.utils.getRule('frame-title-unique');
  });

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('should return true if title attribute has text', function () {
    fixture.innerHTML = '<iframe title="hello"></iframe>';
    const node = fixture.firstChild;
    expect(rule.matches(node)).toBe(true);
  });

  it('should return false if title attribute is empty', function () {
    fixture.innerHTML = '<iframe title=""></iframe>';
    const node = fixture.firstChild;
    expect(rule.matches(node)).toBe(false);
  });

  it('should return false if title attribute contains only whitespace', function () {
    fixture.innerHTML = '<iframe title="    "></iframe>';
    const node = fixture.firstChild;
    expect(rule.matches(node)).toBe(false);
  });
});
