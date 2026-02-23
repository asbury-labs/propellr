import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  fixtureSetup,
  getCheckEvaluate,
  MockCheckContext
} from '../../../testutils';

declare const axe: any;
describe('landmark-is-unique', function () {
  const checkContext = new MockCheckContext();
  let fixture;
  let axeFixtureSetup;

  beforeEach(function () {
    fixture = document.getElementById('fixture');
    axeFixtureSetup = fixtureSetup;
  });

  afterEach(function () {
    axe._tree = undefined;
    checkContext.reset();
  });

  it('should return true, with correct role and no accessible text', function () {
    axeFixtureSetup('<div role="main">test</div>');
    const node = fixture.querySelector('div');
    const expectedData = {
      accessibleText: null,
      role: 'main'
    };
    axe._tree = axe.utils.getFlattenedTree(fixture);
    const virtualNode = axe.utils.getNodeFromTree(axe._tree[0], node);
    expect(
      getCheckEvaluate('landmark-is-unique').call(
        checkContext,
        node,
        {},
        virtualNode
      )
    ).toBe(true);
    expect(checkContext._data).toEqual(expectedData);
    expect(checkContext._relatedNodes).toEqual([node]);
  });

  it('should return true, with correct role and the accessible text lowercased', function () {
    axeFixtureSetup('<div role="main" aria-label="TEST text">test</div>');
    const node = fixture.querySelector('div');
    const expectedData = {
      accessibleText: 'test text',
      role: 'main'
    };
    axe._tree = axe.utils.getFlattenedTree(fixture);
    const virtualNode = axe.utils.getNodeFromTree(axe._tree[0], node);
    expect(
      getCheckEvaluate('landmark-is-unique').call(
        checkContext,
        node,
        {},
        virtualNode
      )
    ).toBe(true);
    expect(checkContext._data).toEqual(expectedData);
    expect(checkContext._relatedNodes).toEqual([node]);
  });
});
