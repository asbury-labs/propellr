import { describe, it, afterEach, expect } from 'vitest';
import { flatTreeSetup } from '../../../testutils';

declare const axe: any;
describe('text.labelVirtual', function () {
  const fixture = document.getElementById('fixture');
  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('is called from text.label', function () {
    fixture.innerHTML =
      '<div id="monkeys">monkeys</div><div id="bananas">bananas</div>' +
      '<input id="target" aria-labelledby="monkeys bananas">';

    flatTreeSetup(document.body);
    const target = fixture.querySelector('#target');
    expect(axe.commons.text.label(target)).toBe('monkeys bananas');
  });

  describe('aria-labelledby', function () {
    it('should join text with a single space', function () {
      fixture.innerHTML =
        '<div id="monkeys">monkeys</div><div id="bananas">bananas</div>' +
        '<input id="target" aria-labelledby="monkeys bananas">';

      const tree = flatTreeSetup(document.body);
      const target = axe.utils.querySelectorAll(tree, '#target')[0];
      expect(axe.commons.text.labelVirtual(target)).toBe('monkeys bananas');
    });

    it('should filter invisible elements', function () {
      fixture.innerHTML =
        '<div id="monkeys">monkeys</div><div id="bananas" style="display: none">bananas</div>' +
        '<input id="target" aria-labelledby="monkeys bananas">';

      const tree = flatTreeSetup(document.body);
      const target = axe.utils.querySelectorAll(tree, '#target')[0];
      expect(axe.commons.text.labelVirtual(target)).toBe('monkeys');
    });

    it('should take precedence over aria-label', function () {
      fixture.innerHTML =
        '<div id="monkeys">monkeys</div><div id="bananas">bananas</div>' +
        '<input id="target" aria-labelledby="monkeys bananas" aria-label="nope">';

      const tree = flatTreeSetup(document.body);
      const target = axe.utils.querySelectorAll(tree, '#target')[0];
      expect(axe.commons.text.labelVirtual(target)).toBe('monkeys bananas');
    });

    it('should take precedence over explicit labels', function () {
      fixture.innerHTML =
        '<div id="monkeys">monkeys</div><div id="bananas">bananas</div>' +
        '<label for="target">nope</label>' +
        '<input id="target" aria-labelledby="monkeys bananas">';

      const tree = flatTreeSetup(document.body);
      const target = axe.utils.querySelectorAll(tree, '#target')[0];
      expect(axe.commons.text.labelVirtual(target)).toBe('monkeys bananas');
    });

    it('should take precedence over implicit labels', function () {
      fixture.innerHTML =
        '<div id="monkeys">monkeys</div><div id="bananas">bananas</div>' +
        '<label>nope' +
        '<input id="target" aria-labelledby="monkeys bananas"></label>';

      const tree = flatTreeSetup(document.body);
      const target = axe.utils.querySelectorAll(tree, '#target')[0];
      expect(axe.commons.text.labelVirtual(target)).toBe('monkeys bananas');
    });

    it('should ignore whitespace only labels', function () {
      fixture.innerHTML =
        '<div id="monkeys">	\n  </div><div id="bananas"></div>' +
        '<input id="target" aria-labelledby="monkeys bananas">';

      const tree = flatTreeSetup(document.body);
      const target = axe.utils.querySelectorAll(tree, '#target')[0];
      expect(axe.commons.text.labelVirtual(target)).toBeNull();
    });
  });

  describe('aria-label', function () {
    it('should detect it', function () {
      fixture.innerHTML = '<input id="target" aria-label="monkeys">';

      const tree = flatTreeSetup(document.body);
      const target = axe.utils.querySelectorAll(tree, '#target')[0];
      expect(axe.commons.text.labelVirtual(target)).toBe('monkeys');
    });

    it('should ignore whitespace only labels', function () {
      fixture.innerHTML = '<input id="target" aria-label="   \n	">';

      const tree = flatTreeSetup(document.body);
      const target = axe.utils.querySelectorAll(tree, '#target')[0];
      expect(axe.commons.text.labelVirtual(target)).toBeNull();
    });

    it('should take precedence over explicit labels', function () {
      fixture.innerHTML =
        '<label for="target">nope</label>' +
        '<input id="target" aria-label="monkeys">';

      const tree = flatTreeSetup(document.body);
      const target = axe.utils.querySelectorAll(tree, '#target')[0];
      expect(axe.commons.text.labelVirtual(target)).toBe('monkeys');
    });

    it('should take precedence over implicit labels', function () {
      fixture.innerHTML =
        '<label>nope' + '<input id="target" aria-label="monkeys"></label>';

      const tree = flatTreeSetup(document.body);
      const target = axe.utils.querySelectorAll(tree, '#target')[0];
      expect(axe.commons.text.labelVirtual(target)).toBe('monkeys');
    });
  });

  describe('explicit label', function () {
    it('should detect it', function () {
      fixture.innerHTML =
        '<label for="target">monkeys</label>' + '<input id="target">';

      const tree = flatTreeSetup(document.body);
      const target = axe.utils.querySelectorAll(tree, '#target')[0];
      expect(axe.commons.text.labelVirtual(target)).toBe('monkeys');
    });

    it('should ignore whitespace only or empty labels', function () {
      fixture.innerHTML =
        '<label for="target">	\n\r  </label>' + '<input id="target">';

      const tree = flatTreeSetup(document.body);
      const target = axe.utils.querySelectorAll(tree, '#target')[0];
      expect(axe.commons.text.labelVirtual(target)).toBeNull();
    });

    it('should take precedence over implicit labels', function () {
      fixture.innerHTML =
        '<label for="target">monkeys</label>' +
        '<label>nope' +
        '<input id="target"></label>';

      const tree = flatTreeSetup(document.body);
      const target = axe.utils.querySelectorAll(tree, '#target')[0];
      expect(axe.commons.text.labelVirtual(target)).toBe('monkeys');
    });
  });

  describe('implicit label', function () {
    it('should detect it', function () {
      fixture.innerHTML = '<label>monkeys' + '<input id="target"><label>';

      const tree = flatTreeSetup(document.body);
      const target = axe.utils.querySelectorAll(tree, '#target')[0];
      expect(axe.commons.text.labelVirtual(target)).toBe('monkeys');
    });

    it('should ignore whitespace only or empty labels', function () {
      fixture.innerHTML = '<label> ' + '<input id="target"><label>';

      const tree = flatTreeSetup(document.body);
      const target = axe.utils.querySelectorAll(tree, '#target')[0];
      expect(axe.commons.text.labelVirtual(target)).toBeNull();
    });
  });
});
