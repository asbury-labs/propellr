import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('no-focusable-content tests', function () {
  const queryFixture = axe.testUtils.queryFixture;
  const noFocusableContent = axe.testUtils.getCheckEvaluate(
    'no-focusable-content'
  );
  const checkSetup = axe.testUtils.checkSetup;
  const check = checks['no-focusable-content'];
  const checkContext = new axe.testUtils.MockCheckContext();

  afterEach(function () {
    checkContext.reset();
  });

  it('should return true if element has no focusable content', function () {
    const vNode = queryFixture(
      '<button id="target"><span>Hello</span></button>'
    );
    expect(noFocusableContent(null, null, vNode)).toBe(true);
  });

  it('should return true if element is empty', function () {
    const vNode = queryFixture('<button id="target"></button>');
    expect(noFocusableContent(null, null, vNode)).toBe(true);
  });

  it('should return true if element only has text content', function () {
    const vNode = queryFixture('<button id="target">Hello</button>');
    expect(noFocusableContent(null, null, vNode)).toBe(true);
  });

  it('should return true if element has content which is focusable (tabindex=0) and does not have a widget role', function () {
    const params = checkSetup(
      '<button id="target"><span tabindex="0">Hello</span></button>'
    );

    expect(noFocusableContent.apply(checkContext, params)).toBe(true);
  });

  it('should return true if element has content which has negative tabindex and non-widget role', function () {
    const vNode = queryFixture(
      '<button id="target"><span tabindex="-1">Hello</span></button>'
    );
    expect(noFocusableContent(null, null, vNode)).toBe(true);
  });

  it('should return false if element has content which has negative tabindex and an explicit widget role', function () {
    const params = checkSetup(
      '<button id="target"><span role="link" tabindex="-1">Hello</span></button>'
    );

    expect(check.evaluate.apply(checkContext, params)).toBe(false);
    expect(checkContext._data).toEqual({ messageKey: 'notHidden' });
    expect(checkContext._relatedNodes).toEqual([params[2].children[0]]);
  });

  it('should return false if element has content which is natively focusable and has a widget role', function () {
    const params = checkSetup(
      '<button id="target"><a href="foo.html">Hello</a></button>'
    );

    expect(noFocusableContent.apply(checkContext, params)).toBe(false);
    expect(checkContext._data).toEqual(null);
    expect(checkContext._relatedNodes).toEqual([params[2].children[0]]);
  });

  it('should add each focusable child as related nodes', function () {
    const params = checkSetup(
      '<button id="target"><input type="checkbox"><a href="foo.html">Hello</a></button>'
    );

    expect(noFocusableContent.apply(checkContext, params)).toBe(false);
    expect(checkContext._data).toEqual(null);
    expect(checkContext._relatedNodes).toEqual([
      params[2].children[0],
      params[2].children[1]
    ]);
  });

  it('should return false if element has natively focusable widget role content with negative tabindex', function () {
    const params = checkSetup(
      '<button id="target"><a href="foo.html" tabindex="-1">Hello</a></button>'
    );
    expect(check.evaluate.apply(checkContext, params)).toBe(false);
    expect(checkContext._data).toEqual({ messageKey: 'notHidden' });
    expect(checkContext._relatedNodes).toEqual([params[2].children[0]]);
  });

  it('should return true if element has content which is natively focusable and has a widget role but is disabled', function () {
    const vNode = queryFixture(
      '<button id="target"><input value="hello" disabled></button>'
    );
    expect(noFocusableContent(null, null, vNode)).toBe(true);
  });

  it('should return false if "disabled" is specified on an element which doesn\'t allow it', function () {
    const params = checkSetup(
      '<button id="target"><a href="foo.html" disabled>Hello</a></button>'
    );
    expect(noFocusableContent.apply(checkContext, params)).toBe(false);
  });

  it('should return true on span with negative tabindex (focusable, does not have a widget role)', function () {
    const vNode = queryFixture(
      '<span id="target" role="text"> some text ' +
        '<span tabIndex="-1">JavaScript is able to focus this</span> ' +
        '</span>'
    );
    expect(noFocusableContent(null, null, vNode)).toBe(true);
  });

  it('should return true on aria-hidden span with negative tabindex (focusable, does not have a widget role)', function () {
    const vNode = queryFixture(
      '<span id="target" role="text"> some text ' +
        '<span tabIndex="-1" aria-hidden="true">JavaScript is able to focus this</span> ' +
        '</span>'
    );
    expect(noFocusableContent(null, null, vNode)).toBe(true);
  });

  it('should return true on nested span with tabindex=0 (focusable, does not have a widget role)', function () {
    const vNode = queryFixture(
      '<span id="target" role="text"> some text ' +
        '<span tabIndex="0">anyone is able to focus this</span> ' +
        '</span>'
    );
    expect(noFocusableContent(null, null, vNode)).toBe(true);
  });
});
