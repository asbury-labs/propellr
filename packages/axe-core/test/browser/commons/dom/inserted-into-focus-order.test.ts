import { describe, it, expect } from 'vitest';
import { fixtureSetup } from '../../../testutils';

declare const axe: any;
describe('dom.insertedIntoFocusOrder', () => {
  const fixture = document.getElementById('fixture');
  const insertedIntoFocusOrder = axe.commons.dom.insertedIntoFocusOrder;

  function hideByClipping(el) {
    el.style.cssText =
      'position: absolute !important;' +
      ' clip: rect(0px 0px 0px 0px); /* IE6, IE7 */' +
      ' clip: rect(0px, 0px, 0px, 0px);';
  }

  function hideByMovingOffScreen(el) {
    el.style.cssText =
      'position:absolute;' +
      ' left:-10000px;' +
      ' top:auto;' +
      ' width:1px;' +
      ' height:1px;' +
      ' overflow:hidden;';
  }

  it('should return true for span with tabindex 0', () => {
    fixtureSetup('<span id="spanTabindex0" tabindex="0"></span>');
    const node = fixture.querySelector('#spanTabindex0');

    expect(insertedIntoFocusOrder(node)).toBe(true);
  });

  it('should return true for clipped span with tabindex 0', () => {
    fixtureSetup('<span id="clippedSpanTabindex0" tabindex="0"></span>');
    const node = fixture.querySelector('#clippedSpanTabindex0');
    hideByClipping(node);

    expect(insertedIntoFocusOrder(node)).toBe(true);
  });

  it('should return true for off screen span with tabindex 0', () => {
    fixtureSetup('<span id="offScreenSpanTabindex0" tabindex="0"></span>');
    const node = fixture.querySelector('#offScreenSpanTabindex0');
    hideByMovingOffScreen(node);

    expect(insertedIntoFocusOrder(node)).toBe(true);
  });

  it('should return false for span with negative tabindex', () => {
    fixtureSetup('<span id="spanNegativeTabindex" tabindex="-1"></span>');
    const node = fixture.querySelector('#spanNegativeTabindex');

    expect(insertedIntoFocusOrder(node)).toBe(false);
  });

  it('should return false for native button with tabindex 0', () => {
    fixtureSetup('<button id="nativeButtonTabindex0" tabindex="0"></button>');
    const node = fixture.querySelector('#nativeButtonTabindex0');

    expect(insertedIntoFocusOrder(node)).toBe(false);
  });

  it('should return false for native button with tabindex implicitly 0', () => {
    fixtureSetup('<button id="nativeButtonTabindexImplicitly0"></button>');
    const node = fixture.querySelector('#nativeButtonTabindexImplicitly0');

    expect(insertedIntoFocusOrder(node)).toBe(false);
  });

  it('should return false for anchor with href and positive tabindex', () => {
    fixtureSetup(
      '<a id="anchorWithHrefAndPositiveTabindex" href="javascript:void(0)" tabindex="1"></a>'
    );
    const node = fixture.querySelector('#anchorWithHrefAndPositiveTabindex');

    expect(insertedIntoFocusOrder(node)).toBe(false);
  });

  it('should return false for input with tabindex 0', () => {
    fixtureSetup('<input id="inputWithTabindex0" tabindex="0">');
    const node = fixture.querySelector('#inputWithTabindex0');

    expect(insertedIntoFocusOrder(node)).toBe(false);
  });

  it('should return false for off screen native button with tabindex 0', () => {
    fixtureSetup(
      '<button id="offScreenNativeButtonTabindex0" tabindex="0"></button>'
    );
    const node = fixture.querySelector('#offScreenNativeButtonTabindex0');
    hideByMovingOffScreen(node);

    expect(insertedIntoFocusOrder(node)).toBe(false);
  });

  it('should return false for off screen anchor with href and tabindex 1', () => {
    fixtureSetup(
      '<a id="offScreenAnchorWithHrefTabindex1" href="javascript:void(0)" tabindex="1"></a>'
    );
    const node = fixture.querySelector('#offScreenAnchorWithHrefTabindex1');
    hideByMovingOffScreen(node);

    expect(insertedIntoFocusOrder(node)).toBe(false);
  });

  it('should return false for off screen input with tabindex 0', () => {
    fixtureSetup('<input id="offScreenInputWithTabindex0" tabindex="0">');
    const node = fixture.querySelector('#offScreenInputWithTabindex0');
    hideByMovingOffScreen(node);

    expect(insertedIntoFocusOrder(node)).toBe(false);
  });

  it('should return false for clipped native button with tabindex 0', () => {
    fixtureSetup(
      '<button id="clippedNativeButtonTabindex0" tabindex="0"></button>'
    );
    const node = fixture.querySelector('#clippedNativeButtonTabindex0');
    hideByClipping(node);

    expect(insertedIntoFocusOrder(node)).toBe(false);
  });

  it('should return false for display none native button with tabindex 0', () => {
    fixtureSetup(
      '<button id="displayNoneNativeButtonTabindex0" tabindex="0"></button>'
    );
    const node = fixture.querySelector('#displayNoneNativeButtonTabindex0');

    expect(insertedIntoFocusOrder(node)).toBe(false);
  });

  it('should return false for clipped anchor with href and tabindex 1', () => {
    fixtureSetup(
      '<a id="clippedAnchorWithHrefTabindex1" href="javascript:void(0)" tabindex="1"></a>'
    );
    const node = fixture.querySelector('#clippedAnchorWithHrefTabindex1');
    hideByClipping(node);

    expect(insertedIntoFocusOrder(node)).toBe(false);
  });

  it('should return false for display none anchor with href and tabindex 1', () => {
    fixtureSetup(
      '<a id="displayNoneAnchorWithHrefTabindex1" href="javascript:void(0)" tabindex="1"></a>'
    );
    const node = fixture.querySelector('#displayNoneAnchorWithHrefTabindex1');

    expect(insertedIntoFocusOrder(node)).toBe(false);
  });

  it('should return false for clipped input with tabindex 0', () => {
    fixtureSetup('<input id="clippedInputWithTabindex0" tabindex="0">');
    const node = fixture.querySelector('#clippedInputWithTabindex0');
    hideByClipping(node);

    expect(insertedIntoFocusOrder(node)).toBe(false);
  });

  it('should return false for display none input with tabindex 0', () => {
    fixtureSetup('<input id="displayNoneInputWithTabindex0" tabindex="0">');
    const node = fixture.querySelector('#displayNoneInputWithTabindex0');

    expect(insertedIntoFocusOrder(node)).toBe(false);
  });

  it('should return false for hidden native button with tabindex 0', () => {
    fixtureSetup(
      '<button id="hiddenNativeButtonTabindex0" tabindex="0"></button>'
    );
    const node = fixture.querySelector('#hiddenNativeButtonTabindex0');

    expect(insertedIntoFocusOrder(node)).toBe(false);
  });

  it('should return false for hidden anchor with href and tabindex 1', () => {
    fixtureSetup(
      '<a id="hiddenAnchorWithHrefTabindex1" href="javascript:void(0)" tabindex="1"></a>'
    );
    const node = fixture.querySelector('#hiddenAnchorWithHrefTabindex1');

    expect(insertedIntoFocusOrder(node)).toBe(false);
  });

  it('should return false for hidden input with tabindex 0', () => {
    fixtureSetup('<input id="hiddenInputWithTabindex0" tabindex="0">');
    const node = fixture.querySelector('#hiddenInputWithTabindex0');

    expect(insertedIntoFocusOrder(node)).toBe(false);
  });

  it('should return false for disabled native button with tabindex 0', () => {
    fixtureSetup(
      '<button id="disabledNativeButtonTabindex0" tabindex="0" disabled></button>'
    );
    const node = fixture.querySelector('#disabledNativeButtonTabindex0');

    expect(insertedIntoFocusOrder(node)).toBe(false);
  });

  it('should return false for disabled input with tabindex 0', () => {
    fixtureSetup('<input id="disabledInputTabindex0" tabindex="0" disabled>');
    const node = fixture.querySelector('#disabledInputTabindex0');

    expect(insertedIntoFocusOrder(node)).toBe(false);
  });

  it('should return false for an invalid tabindex', () => {
    fixtureSetup('<span id="spanTabindexInvalid" tabindex="invalid"></span>');
    const node = fixture.querySelector('#spanTabindexInvalid');

    expect(insertedIntoFocusOrder(node)).toBe(false);
  });
});
