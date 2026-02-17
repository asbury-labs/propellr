import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('presentational-role', function () {
  const fixture = document.getElementById('fixture');
  const queryFixture = axe.testUtils.queryFixture;
  const checkEvaluate = axe.testUtils.getCheckEvaluate('presentational-role');
  const checkContext = axe.testUtils.MockCheckContext();

  afterEach(function () {
    fixture.innerHTML = '';
    checkContext.reset();
  });

  it('should detect role="none" on the element', function () {
    const vNode = queryFixture('<div id="target" role="none"></div>');

    expect(checkEvaluate.call(checkContext, null, null, vNode)).toBe(true);
    expect(checkContext._data.role).toEqual('none');
  });

  it('should detect role="presentation" on the element', function () {
    const vNode = queryFixture('<div id="target" role="presentation"></div>');

    expect(checkEvaluate.call(checkContext, null, null, vNode)).toBe(true);
    expect(checkContext._data.role).toEqual('presentation');
  });

  it('should return false when role !== none', function () {
    const vNode = queryFixture('<div id="target" role="cats"></div>');

    expect(checkEvaluate.call(checkContext, null, null, vNode)).toBe(false);
  });

  it('should return false when there is no role attribute', function () {
    const vNode = queryFixture('<div id="target"></div>');

    expect(checkEvaluate.call(checkContext, null, null, vNode)).toBe(false);
  });

  it('should return false when the element is focusable', function () {
    const vNode = queryFixture(
      '<button id="target" role="none">Still a button</button>'
    );

    expect(checkEvaluate.call(checkContext, null, null, vNode)).toBe(false);
    expect(checkContext._data.messageKey).toEqual('focusable');
  });

  it('should return false when the element has global aria attributes', function () {
    const vNode = queryFixture(
      '<img id="target" role="none" aria-live="assertive" />'
    );

    expect(checkEvaluate.call(checkContext, null, null, vNode)).toBe(false);
    expect(checkContext._data.messageKey).toEqual('globalAria');
  });

  it('should return false when the element has global aria attributes and is focusable', function () {
    const vNode = queryFixture(
      '<button id="target" role="none" aria-live="assertive">Still a button</button>'
    );

    expect(checkEvaluate.call(checkContext, null, null, vNode)).toBe(false);
    expect(checkContext._data.messageKey).toEqual('both');
  });

  it('should return false for iframe element with role=none and title', function () {
    const vNode = queryFixture(
      '<iframe id="target" role="none" title="  "></iframe>'
    );

    expect(checkEvaluate.call(checkContext, null, null, vNode)).toBe(false);
    expect(checkContext._data).toEqual({
      messageKey: 'iframe',
      nodeName: 'iframe'
    });
  });

  it('should return false for iframe element with role=presentation and title', function () {
    const vNode = queryFixture(
      '<iframe id="target" role="presentation" title=""></iframe>'
    );

    expect(checkEvaluate.call(checkContext, null, null, vNode)).toBe(false);
    expect(checkContext._data).toEqual({
      messageKey: 'iframe',
      nodeName: 'iframe'
    });
  });
});
