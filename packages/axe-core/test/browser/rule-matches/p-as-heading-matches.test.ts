import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
describe('p-as-heading-matches', function () {
  let rule;
  const fixture = document.getElementById('fixture');

  beforeEach(function () {
    rule = axe.utils.getRule('p-as-heading');
  });

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('matches p elements', function () {
    fixture.innerHTML = '<p id="target">some text</p><p>some other text</p>';
    const target = fixture.querySelector('#target');

    expect(rule.matches(target)).toBe(true);
  });

  it('ignores the last p element in a list of children', function () {
    fixture.innerHTML = '<p>some text</p><p id="target">some other text</p>';
    const target = fixture.querySelector('#target');

    expect(rule.matches(target)).toBe(false);
  });

  it('ignores p elements that contains punctuation marks', function () {
    fixture.innerHTML =
      '<p id="target">A text. Paragraph?</p><p>some other text</p>';
    const target = fixture.querySelector('#target');

    expect(rule.matches(target)).toBe(false);
  });

  it('matches p elements with a single punctuation mark', function () {
    fixture.innerHTML = '<p id="target">A paragraph?</p><p>some other text</p>';
    const target = fixture.querySelector('#target');

    expect(rule.matches(target)).toBe(true);
  });

  it('ignores p elements that have no text-like characters', function () {
    fixture.innerHTML = '<p id="target"> \n\t\r </p><p>some other text</p>';
    const target = fixture.querySelector('#target');

    expect(rule.matches(target)).toBe(false);
  });

  it('ignores siblings that are not p elements', function () {
    fixture.innerHTML =
      '<p id="target">some text</p><div></div><p>some other text</p>';
    let target = fixture.querySelector('#target');

    expect(rule.matches(target)).toBe(true);

    fixture.innerHTML = '<p id="target">some text</p><div></div>';
    target = fixture.querySelector('#target');

    expect(rule.matches(target)).toBe(false);
  });

  it('ignores empty p elements as siblings', function () {
    fixture.innerHTML =
      '<p id="target">some text</p><p> <!-- nothing here --><img src="" alt="" /></p>';
    const target = fixture.querySelector('#target');

    expect(rule.matches(target)).toBe(false);
  });
});
