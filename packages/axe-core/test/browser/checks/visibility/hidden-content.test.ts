import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
/* global xit */
describe('hidden content', function () {
  const fixture = document.getElementById('fixture');
  const shadowSupport = axe.testUtils.shadowSupport.v1;
  const checkSetup = axe.testUtils.checkSetup;
  const checkContext = axe.testUtils.MockCheckContext();

  afterEach(function () {
    fixture.innerHTML = '';
    checkContext.reset();
    axe._tree = undefined;
  });

  it('should return undefined with display:none and children', function () {
    const params = checkSetup(
      '<div id="target" style="display: none;"><p>Some paragraph text.</p></div>'
    );
    expect(
      axe.testUtils
        .getCheckEvaluate('hidden-content')
        .apply(checkContext, params)
    ).toBeUndefined();
  });

  it('should return undefined with visibility:hidden and children', function () {
    const params = checkSetup(
      '<div id="target" style="visibility: hidden;"><p>Some paragraph text.</p></div>'
    );
    expect(
      axe.testUtils
        .getCheckEvaluate('hidden-content')
        .apply(checkContext, params)
    ).toBeUndefined();
  });

  it('should return true with visibility:hidden and parent with visibility:hidden', function () {
    const params = checkSetup(
      '<div style="visibility: hidden;"><p id="target" style="visibility: hidden;">Some paragraph text.</p></div>'
    );
    expect(
      axe.testUtils
        .getCheckEvaluate('hidden-content')
        .apply(checkContext, params)
    ).toBe(true);
  });

  it('should return true with aria-hidden and no content', function () {
    const params = checkSetup(
      '<span id="target" class="icon" aria-hidden="true"></span>'
    );
    expect(
      axe.testUtils
        .getCheckEvaluate('hidden-content')
        .apply(checkContext, params)
    ).toBe(true);
  });

  it('should skip whitelisted elements', function () {
    const node = document.querySelector('head');
    axe.testUtils.flatTreeSetup(document.documentElement);
    const virtualNode = axe.utils.getNodeFromTree(node);
    expect(
      axe.testUtils.getCheckEvaluate('hidden-content')(
        node,
        undefined,
        virtualNode
      )
    ).toBe(true);
  });

  (shadowSupport ? it : xit)('works on elements in a shadow DOM', function () {
    fixture.innerHTML = '<div id="shadow"> <div id="content">text</div> </div>';
    const shadowRoot = document
      .getElementById('shadow')
      .attachShadow({ mode: 'open' });
    shadowRoot.innerHTML =
      '<div id="target" style="display:none">' + '<slot></slot>' + '</div>';
    axe.testUtils.flatTreeSetup(fixture);

    const shadow = document.querySelector('#shadow');
    const virtualShadow = axe.utils.getNodeFromTree(shadow);
    expect(
      axe.testUtils.getCheckEvaluate('hidden-content')(
        shadow,
        undefined,
        virtualShadow
      )
    ).toBe(true);

    const target = shadowRoot.querySelector('#target');
    const virtualTarget = axe.utils.getNodeFromTree(target);
    expect(
      axe.testUtils.getCheckEvaluate('hidden-content')(
        target,
        undefined,
        virtualTarget
      )
    ).toBeUndefined();

    const content = document.querySelector('#content');
    const virtualContent = axe.utils.getNodeFromTree(content);
    expect(
      axe.testUtils.getCheckEvaluate('hidden-content')(
        content,
        undefined,
        virtualContent
      )
    ).toBe(true);
  });
});
