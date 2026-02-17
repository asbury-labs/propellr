import { describe, it, afterEach, expect } from 'vitest';

declare const axe: any;
describe('aria.labelVirtual', function () {
  const fixture = document.getElementById('fixture');
  const fixtureSetup = axe.testUtils.fixtureSetup;

  afterEach(function () {
    fixture.innerHTML = '';
    axe._tree = undefined;
  });

  it('is called through aria.label with a DOM node', function () {
    fixtureSetup(
      '<div id="monkeys">monkeys</div><div id="bananas">bananas</div>' +
        '<input id="target" aria-labelledby="monkeys bananas">'
    );
    const target = fixture.querySelector('#target');

    expect(axe.commons.aria.label(target)).toBe('monkeys bananas');
  });

  describe('aria-labelledby', function () {
    it('should join text with a single space', function () {
      fixtureSetup(
        '<div id="monkeys">monkeys</div><div id="bananas">bananas</div>' +
          '<input id="target" aria-labelledby="monkeys bananas">'
      );
      const target = axe.utils.querySelectorAll(axe._tree[0], '#target')[0];

      expect(axe.commons.aria.labelVirtual(target)).toBe('monkeys bananas');
    });

    it('should filter invisible elements', function () {
      fixtureSetup(
        '<div id="monkeys">monkeys</div><div id="bananas" style="display: none">bananas</div>' +
          '<input id="target" aria-labelledby="monkeys bananas">'
      );
      const target = axe.utils.querySelectorAll(axe._tree[0], '#target')[0];

      expect(axe.commons.aria.labelVirtual(target)).toBe('monkeys');
    });

    it('should take precedence over aria-label', function () {
      fixtureSetup(
        '<div id="monkeys">monkeys</div><div id="bananas">bananas</div>' +
          '<input id="target" aria-labelledby="monkeys bananas" aria-label="nope">'
      );
      const target = axe.utils.querySelectorAll(axe._tree[0], '#target')[0];

      expect(axe.commons.aria.labelVirtual(target)).toBe('monkeys bananas');
    });

    it('should ignore whitespace only labels', function () {
      fixtureSetup(
        '<div id="monkeys">	\n  </div><div id="bananas"></div>' +
          '<input id="target" aria-labelledby="monkeys bananas">'
      );
      const target = axe.utils.querySelectorAll(axe._tree[0], '#target')[0];

      expect(axe.commons.aria.labelVirtual(target)).toBeNull();
    });
  });

  describe('aria-label', function () {
    it('should detect it', function () {
      fixtureSetup('<input id="target" aria-label="monkeys">');
      const target = axe.utils.querySelectorAll(axe._tree[0], '#target')[0];

      expect(axe.commons.aria.labelVirtual(target)).toBe('monkeys');
    });

    it('should ignore whitespace only labels', function () {
      fixtureSetup('<input id="target" aria-label="   \n	">');
      const target = axe.utils.querySelectorAll(axe._tree[0], '#target')[0];

      expect(axe.commons.aria.labelVirtual(target)).toBeNull();
    });
  });
});
