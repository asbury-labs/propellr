import { describe, it, expect, afterEach, beforeAll } from 'vitest';

declare const axe: any;
describe('focusable-element tests', function () {
  const check;
  const fixture = document.getElementById('fixture');
  const checkContext = axe.testUtils.MockCheckContext();
  const checkSetup = axe.testUtils.checkSetup;

  beforeAll(function () {
    check = checks['focusable-element'];
  });

  afterEach(function () {
    fixture.innerHTML = '';
    axe._tree = undefined;
    checkContext.reset();
  });

  it('returns true when element is focusable', function () {
    const params = checkSetup('<input id="target" type="radio">');
    const actual = check.evaluate.apply(checkContext, params);
    expect(actual).toBe(true);
  });

  it('returns false when element made not focusable by tabindex', function () {
    const params = checkSetup(
      '<input id="target" type="checkbox" tabindex="-1">'
    );
    const actual = check.evaluate.apply(checkContext, params);
    expect(actual).toBe(false);
  });

  it('returns false when element is not focusable by default', function () {
    const params = checkSetup('<p id="target">I hold some text </p>');
    const actual = check.evaluate.apply(checkContext, params);
    expect(actual).toBe(false);
  });

  it('returns true when element made focusable by tabindex', function () {
    const params = checkSetup(
      '<p id="target" tabindex="0">I hold some text </p>'
    );
    const actual = check.evaluate.apply(checkContext, params);
    expect(actual).toBe(true);
  });

  it('returns true when element made focusable by contenteditable', function () {
    const params = checkSetup(
      '<p id="target" contenteditable>I hold some text </p>'
    );
    const actual = check.evaluate.apply(checkContext, params);
    expect(actual).toBe(true);
  });

  it('returns true when element made focusable by contenteditable="true"', function () {
    const params = checkSetup(
      '<p id="target" contenteditable="true">I hold some text </p>'
    );
    const actual = check.evaluate.apply(checkContext, params);
    expect(actual).toBe(true);
  });

  it('returns false when element made focusable by contenteditable="false"', function () {
    const params = checkSetup(
      '<p id="target" contenteditable="false">I hold some text </p>'
    );
    const actual = check.evaluate.apply(checkContext, params);
    expect(actual).toBe(false);
  });

  it('returns true when element made focusable by contenteditable="invalid" and parent is contenteditable', function () {
    const params = checkSetup(
      '<div contenteditable><p id="target" contenteditable="invalid">I hold some text </p></div>'
    );
    const actual = check.evaluate.apply(checkContext, params);
    expect(actual).toBe(true);
  });

  it('returns false when element made focusable by contenteditable="invalid" and parent is not contenteditable', function () {
    const params = checkSetup(
      '<div><p id="target" contenteditable="invalid">I hold some text </p></div>'
    );
    const actual = check.evaluate.apply(checkContext, params);
    expect(actual).toBe(false);
  });

  it('returns false when element made focusable by contenteditable="invalid" and parent is contenteditable="false"', function () {
    const params = checkSetup(
      '<div contenteditable="false"><p id="target" contenteditable="invalid">I hold some text </p></div>'
    );
    const actual = check.evaluate.apply(checkContext, params);
    expect(actual).toBe(false);
  });
});
