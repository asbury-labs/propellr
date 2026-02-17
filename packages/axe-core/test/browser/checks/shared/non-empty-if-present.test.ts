import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('non-empty-if-present', function () {
  const fixture = document.getElementById('fixture');

  // These defaults are only available in IE and Edge
  const input = document.createElement('input');
  input.type = 'submit';
  const isEdgeOrIe = typeof input.getAttribute('value') === 'string';

  const checkContext = axe.testUtils.MockCheckContext();
  const queryFixture = axe.testUtils.queryFixture;

  afterEach(function () {
    fixture.innerHTML = '';
    checkContext.reset();
  });

  it('should return false if a value is present', function () {
    const vNode = queryFixture(
      '<input id="target" type="submit" value="woohoo" />'
    );

    expect(
      axe.testUtils
        .getCheckEvaluate('non-empty-if-present', { verifyMessage: false })
        .call(checkContext, null, {}, vNode)
    ).toBe(false);
    expect(checkContext._data.messageKey).toBe('has-label');
  });

  (isEdgeOrIe ? xit : it)(
    'should return true if a value is not present',
    function () {
      const vNode = queryFixture('<input id="target" type="submit" />');

      expect(
        axe.testUtils
          .getCheckEvaluate('non-empty-if-present')
          .call(checkContext, null, {}, vNode)
      ).toBe(true);
      expect(checkContext._data).toBeNull();
    }
  );

  it('should return false if an value is present, but empty', function () {
    const vNode = queryFixture('<input id="target" type="submit" value="" />');

    expect(
      axe.testUtils
        .getCheckEvaluate('non-empty-if-present')
        .call(checkContext, null, {}, vNode)
    ).toBe(false);
  });

  it('should return false if the element is not a submit or reset input', function () {
    const vNode = queryFixture('<input id="target" type="text" />');
    expect(
      axe.testUtils
        .getCheckEvaluate('non-empty-if-present')
        .call(checkContext, null, {}, vNode)
    ).toBe(false);

    const vNode = queryFixture('<input id="target" type="button" />');
    expect(
      axe.testUtils
        .getCheckEvaluate('non-empty-if-present')
        .call(checkContext, null, {}, vNode)
    ).toBe(false);

    const vNode = queryFixture('<button id="target" type="submit"></button');
    expect(
      axe.testUtils
        .getCheckEvaluate('non-empty-if-present')
        .call(checkContext, null, {}, vNode)
    ).toBe(false);
  });
});
