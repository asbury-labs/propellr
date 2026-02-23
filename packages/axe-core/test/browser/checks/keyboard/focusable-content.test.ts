import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import {
  checkSetup,
  checks,
  fixtureSetup,
  MockCheckContext,
  shadowSupport
} from '../../../testutils';

declare const axe: any;
describe('focusable-content tests', function () {
  let check;
  const fixture = document.getElementById('fixture')!;
  const shadowSupported = shadowSupport.v1;
  const checkContext = MockCheckContext();

  beforeAll(function () {
    check = checks['focusable-content'];
  });

  afterEach(function () {
    fixture.innerHTML = '';
    axe._tree = undefined;
    checkContext.reset();
  });

  it('returns false when there are no focusable content elements (content element `div` is not focusable)', function () {
    const params = checkSetup(
      '<div id="target">' + '<div> Content </div>' + '</div>'
    );
    const actual = check.evaluate.apply(checkContext, params);
    expect(actual).toBe(false);
  });

  it('returns false when content element is taken out of focusable order (tabindex = -1)', function () {
    const params = checkSetup(
      '<div id="target">' + '<input type="text" tabindex="-1">' + '</div>'
    );
    const actual = check.evaluate.apply(checkContext, params);
    expect(actual).toBe(false);
  });

  it('returns false when element is focusable (only checks if contents are focusable)', function () {
    const params = checkSetup(
      '<div id="target" tabindex="0">' +
        '<p style="height: 200px;"></p>' +
        '</div>'
    );
    const actual = check.evaluate.apply(checkContext, params);
    expect(actual).toBe(false);
  });

  it('returns false when all content elements are not focusable', function () {
    const params = checkSetup(
      '<div id="target">' +
        '<input type="text" tabindex="-1">' +
        '<select tabindex="-1"></select>' +
        '<textarea tabindex="-1"></textarea>' +
        '</div>'
    );
    const actual = check.evaluate.apply(checkContext, params);
    expect(actual).toBe(false);
  });

  it('returns true when one deeply nested content element is focusable', function () {
    const params = checkSetup(
      '<div id="target">' +
        '<div style="height: 200px"> ' +
        '<div style="height: 200px">' +
        '<input type="text">' +
        '</div>' +
        '</div>' +
        '</div>'
    );
    const actual = check.evaluate.apply(checkContext, params);
    expect(actual).toBe(true);
  });

  it('returns true when content element can be focused', function () {
    const params = checkSetup(
      '<div id="target">' + '<input type="text">' + '</div>'
    );
    const actual = check.evaluate.apply(checkContext, params);
    expect(actual).toBe(true);
  });

  it('returns true when any one of the many content elements can be focused', function () {
    const params = checkSetup(
      '<div id="target">' +
        '<input type="text" tabindex="-1">' +
        '<select tabindex="-1"></select>' +
        '<textarea tabindex="-1"></textarea>' +
        '<p style="height: 200px;" tabindex="0"></p>' +
        '</div>'
    );
    const actual = check.evaluate.apply(checkContext, params);
    expect(actual).toBe(true);
  });

  describe('shadowDOM - focusable content', function () {
    beforeAll(function () {
      if (!shadowSupported) {
        this.skip();
      }
    });

    it('returns true when content element can be focused', function () {
      fixtureSetup('<div id="target">' + '</div>');
      const node = fixture.querySelector('#target');
      const shadow = node.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<input type="text">';
      axe._tree = axe.utils.getFlattenedTree(fixture);
      axe._selectorData = axe.utils.getSelectorData(axe._tree);
      const virtualNode = axe.utils.getNodeFromTree(axe._tree[0], node);
      const actual = check.evaluate.call(checkContext, node, {}, virtualNode);
      expect(actual).toBe(true);
    });

    it('returns false when no focusable content', function () {
      fixtureSetup('<div id="target">' + '</div>');
      const node = fixture.querySelector('#target');
      const shadow = node.attachShadow({ mode: 'open' });
      shadow.innerHTML =
        '<input type="text" tabindex="-1"> <p>just some text</p>';
      axe._tree = axe.utils.getFlattenedTree(fixture);
      axe._selectorData = axe.utils.getSelectorData(axe._tree);
      const virtualNode = axe.utils.getNodeFromTree(axe._tree[0], node);
      const actual = check.evaluate.call(checkContext, node, {}, virtualNode);
      expect(actual).toBe(false);
    });
  });
});
