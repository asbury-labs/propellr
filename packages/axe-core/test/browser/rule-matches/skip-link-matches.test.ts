import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
describe('skip-link-matches', function () {
  let rule, link;
  const fixture = document.getElementById('fixture');

  beforeEach(function () {
    rule = axe.utils.getRule('skip-link');
    fixture.innerHTML =
      '<a href="" id="target" style="position: absolute; left: -10000px;">Click me</a><div id="main"></div>';
    link = fixture.querySelector('#target');
    axe._tree = axe.utils.getFlattenedTree(fixture);
  });

  afterEach(function () {
    fixture.innerHTML = '';
    axe._tree = undefined;
  });

  it('returns false if the links is onscreen', function () {
    link.removeAttribute('style');
    link.href = '#main';
    expect(rule.matches(link)).toBe(false);
  });

  it('returns false if the href attribute does not start with #', function () {
    link.href = 'foo#bar';
    expect(rule.matches(link)).toBe(false);
  });

  it('returns false if the href attribute is `#`', function () {
    link.href = '#';
    expect(rule.matches(link)).toBe(false);
  });

  it('returns false if the href attribute starts with #!', function () {
    link.href = '#!foo';
    expect(rule.matches(link)).toBe(false);
  });

  it('returns false if the href attribute starts with #/', function () {
    link.href = '#/foo';
    expect(rule.matches(link)).toBe(false);
  });

  it('returns true if the href attribute starts with #', function () {
    link.href = '#main';
    expect(rule.matches(link)).toBe(true);
  });

  it('returns true if the href attribute starts with /# (angular)', function () {
    link.href = '/#main';
    expect(rule.matches(link)).toBe(true);
  });
});
