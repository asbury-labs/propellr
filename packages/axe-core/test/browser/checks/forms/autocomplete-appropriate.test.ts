import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
describe('autocomplete-appropriate', function () {
  const fixture = document.getElementById('fixture');
  const checkSetup = axe.testUtils.checkSetup;
  const checkContext = axe.testUtils.MockCheckContext();
  const evaluate = axe.testUtils.getCheckEvaluate('autocomplete-appropriate');

  beforeEach(function () {
    axe._tree = undefined;
  });

  afterEach(function () {
    fixture.innerHTML = '';
    checkContext.reset();
  });

  function autocompleteCheckParams(term, type, options) {
    return checkSetup(
      '<input autocomplete="' + term + '" type=' + type + ' id="target" />',
      options
    );
  }

  it('returns true for non-select elements', function () {
    ['div', 'button', 'select', 'textarea'].forEach(function (tagName) {
      const elm = document.createElement(tagName);
      elm.setAttribute('autocomplete', 'foo');
      elm.setAttribute('type', 'email');
      const params = checkSetup(elm);

      expect(evaluate.apply(checkContext, params)).toBe(true);
    });
  });

  it('returns true if the input type is in the map', function () {
    const options = { foo: ['url'] };
    const params = autocompleteCheckParams('foo', 'url', options);
    expect(evaluate.apply(checkContext, params)).toBe(true);
  });

  it('returns false if the input type is not in the map', function () {
    const options = { foo: ['url'] };
    const params = autocompleteCheckParams('foo', 'email', options);
    expect(evaluate.apply(checkContext, params)).toBe(false);
  });

  it('returns true if the input type is text and the term is undefined', function () {
    const options = {};
    const params = autocompleteCheckParams('foo', 'text', options);
    expect(evaluate.apply(checkContext, params)).toBe(true);
  });

  it('returns true if the input type is tel and the term is off', function () {
    const options = {};
    const params = autocompleteCheckParams('off', 'tel', options);
    expect(evaluate.apply(checkContext, params)).toBe(true);
  });

  it('returns true if the input type is url and the term is on', function () {
    const options = {};
    const params = autocompleteCheckParams('on', 'url', options);
    expect(evaluate.apply(checkContext, params)).toBe(true);
  });

  it('returns true if the input type is foobar and the term is undefined', function () {
    const options = {};
    const params = autocompleteCheckParams('foo', 'foobar', options);
    expect(evaluate.apply(checkContext, params)).toBe(true);
  });

  it('returns true if the input type is email and the term is username', function () {
    const options = {};
    const params = autocompleteCheckParams('username', 'email', options);
    expect(evaluate.apply(checkContext, params)).toBe(true);
  });

  it('returns false if the input type is text and the term maps to an empty array', function () {
    const options = { foo: [] };
    const params = autocompleteCheckParams('foo', 'text', options);
    expect(evaluate.apply(checkContext, params)).toBe(false);
  });

  it('returns false if the input type is month and term is bday-month', function () {
    const options = {};
    const params = autocompleteCheckParams('bday-month', 'month', options);
    expect(evaluate.apply(checkContext, params)).toBe(false);
  });

  it('returns false if the input type is MONTH (case-insensitive & sanitized) and term is bday-month', function () {
    const options = {};
    const params = autocompleteCheckParams(
      'bday-month',
      '   MONTH    ',
      options
    );
    expect(evaluate.apply(checkContext, params)).toBe(false);
  });
});
