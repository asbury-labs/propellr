import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  flatTreeSetup,
  getCheckEvaluate,
  MockCheckContext,
  queryFixture
} from '../../../testutils';

describe('xml-lang-mismatch', function () {
  const checkContext = MockCheckContext();

  beforeEach(function () {
    // using a div element (instead of html), as the check is agnostic of element type
  });

  afterEach(function () {
    checkContext.reset();
  });

  // the rule matches filters out node of type HTML, and tests cover this scenario to ensure other elements are not allowed for this check
  // hence below tests are only for HTML element, although the logic in the check looks for matches in value os lang and xml:lang
  // rather than node type match - hence the check can be re-used.

  it('should return false if a only lang is supplied', function () {
    const vNode = queryFixture('<div id="target" lang="en"></div>');
    expect(
      getCheckEvaluate('xml-lang-mismatch').call(checkContext, null, {}, vNode)
    ).toBe(false);
  });

  it('should return false if a only xml:lang is supplied albeit with region', function () {
    const vNode = queryFixture('<div id="target" xml:lang="fr-FR"></div>');
    expect(
      getCheckEvaluate('xml-lang-mismatch').call(checkContext, null, {}, vNode)
    ).toBe(false);
  });

  it('should return false if lang is undefined', function () {
    const node = document.createElement('div');
    node.setAttribute('lang', undefined);
    const tree = flatTreeSetup(node);
    expect(
      getCheckEvaluate('xml-lang-mismatch').call(
        checkContext,
        null,
        {},
        tree[0]
      )
    ).toBe(false);
  });

  it('should return true if lang and xml:lang is identical', function () {
    const vNode = queryFixture(
      '<div id="target" xml:lang="en-GB" lang="en-GB"></div>'
    );
    expect(
      getCheckEvaluate('xml-lang-mismatch').call(checkContext, null, {}, vNode)
    ).toBe(true);
  });

  it('should return true if lang and xml:lang have identical primary sub tag', function () {
    const vNode = queryFixture(
      '<div id="target" xml:lang="en-US" lang="en-GB"></div>'
    );
    expect(
      getCheckEvaluate('xml-lang-mismatch').call(checkContext, null, {}, vNode)
    ).toBe(true);
  });

  it('should return false if lang and xml:lang are not identical', function () {
    const vNode = queryFixture(
      '<div id="target" xml:lang="fr-FR" lang="en"></div>'
    );
    const actual = getCheckEvaluate('xml-lang-mismatch').call(
      checkContext,
      null,
      {},
      vNode
    );
    expect(actual).toBe(false);
  });
});
