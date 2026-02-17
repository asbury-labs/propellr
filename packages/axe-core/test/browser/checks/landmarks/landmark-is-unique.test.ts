import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
describe('landmark-is-unique', function () {
  const checkContext = new axe.testUtils.MockCheckContext();
  const fixture;
  const axeFixtureSetup;

  beforeEach(function () {
    fixture = document.getElementById('fixture');
    axeFixtureSetup = axe.testUtils.fixtureSetup;
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
      axe.testUtils
        .getCheckEvaluate('landmark-is-unique')
        .call(checkContext, node, {}, virtualNode)
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
      axe.testUtils
        .getCheckEvaluate('landmark-is-unique')
        .call(checkContext, node, {}, virtualNode)
    ).toBe(true);
    expect(checkContext._data).toEqual(expectedData);
    expect(checkContext._relatedNodes).toEqual([node]);
  });
});
