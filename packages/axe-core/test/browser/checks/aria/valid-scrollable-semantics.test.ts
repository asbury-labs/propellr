import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('valid-scrollable-semantics', function () {
  const fixture = document.getElementById('fixture');
  const flatTreeSetup = axe.testUtils.flatTreeSetup;
  const checkContext = axe.testUtils.MockCheckContext();

  afterEach(function () {
    fixture.innerHTML = '';
    checkContext._data = null;
  });

  it('should return false for role=banner', function () {
    const node = document.createElement('div');
    node.setAttribute('role', '"banner');
    fixture.appendChild(node);
    flatTreeSetup(fixture);
    expect(
      axe.testUtils
        .getCheckEvaluate('valid-scrollable-semantics')
        .call(checkContext, node)
    ).toBe(false);
  });

  it('should return false for role=search', function () {
    const node = document.createElement('div');
    node.setAttribute('role', 'search');
    fixture.appendChild(node);
    flatTreeSetup(fixture);
    expect(
      axe.testUtils
        .getCheckEvaluate('valid-scrollable-semantics')
        .call(checkContext, node)
    ).toBe(false);
  });

  it('should return true for role=form', function () {
    const node = document.createElement('div');
    node.setAttribute('role', 'form');
    fixture.appendChild(node);
    flatTreeSetup(fixture);
    expect(
      axe.testUtils
        .getCheckEvaluate('valid-scrollable-semantics')
        .call(checkContext, node)
    ).toBe(true);
  });

  it('should return true for role=navigation', function () {
    const node = document.createElement('div');
    node.setAttribute('role', 'navigation');
    fixture.appendChild(node);
    flatTreeSetup(fixture);
    expect(
      axe.testUtils
        .getCheckEvaluate('valid-scrollable-semantics')
        .call(checkContext, node)
    ).toBe(true);
  });

  it('should return true for role=complementary', function () {
    const node = document.createElement('div');
    node.setAttribute('role', 'complementary');
    fixture.appendChild(node);
    flatTreeSetup(fixture);
    expect(
      axe.testUtils
        .getCheckEvaluate('valid-scrollable-semantics')
        .call(checkContext, node)
    ).toBe(true);
  });

  it('should return true for role=contentinfo', function () {
    const node = document.createElement('div');
    node.setAttribute('role', 'contentinfo');
    fixture.appendChild(node);
    flatTreeSetup(fixture);
    expect(
      axe.testUtils
        .getCheckEvaluate('valid-scrollable-semantics')
        .call(checkContext, node)
    ).toBe(true);
  });

  it('should return true for role=main', function () {
    const node = document.createElement('div');
    node.setAttribute('role', 'main');
    fixture.appendChild(node);
    flatTreeSetup(fixture);
    expect(
      axe.testUtils
        .getCheckEvaluate('valid-scrollable-semantics')
        .call(checkContext, node)
    ).toBe(true);
  });

  it('should return true for role=region', function () {
    const node = document.createElement('div');
    node.setAttribute('role', 'region');
    fixture.appendChild(node);
    flatTreeSetup(fixture);
    expect(
      axe.testUtils
        .getCheckEvaluate('valid-scrollable-semantics')
        .call(checkContext, node)
    ).toBe(true);
  });

  it('should return true for role=alertdialog', function () {
    const node = document.createElement('div');
    node.setAttribute('role', 'alertdialog');
    fixture.appendChild(node);
    flatTreeSetup(fixture);
    expect(
      axe.testUtils
        .getCheckEvaluate('valid-scrollable-semantics')
        .call(checkContext, node)
    ).toBe(true);
  });

  it('should return true for role=article', function () {
    const node = document.createElement('div');
    node.setAttribute('role', 'article');
    fixture.appendChild(node);
    flatTreeSetup(fixture);
    expect(
      axe.testUtils
        .getCheckEvaluate('valid-scrollable-semantics')
        .call(checkContext, node)
    ).toBe(true);
  });

  it('should return true for role=dialog', function () {
    const node = document.createElement('div');
    node.setAttribute('role', 'dialog');
    fixture.appendChild(node);
    flatTreeSetup(fixture);
    expect(
      axe.testUtils
        .getCheckEvaluate('valid-scrollable-semantics')
        .call(checkContext, node)
    ).toBe(true);
  });

  it('should return true for nav elements', function () {
    const node = document.createElement('nav');
    fixture.appendChild(node);
    flatTreeSetup(fixture);
    expect(
      axe.testUtils
        .getCheckEvaluate('valid-scrollable-semantics')
        .call(checkContext, node)
    ).toBe(true);
  });

  it('should return true for section elements', function () {
    const node = document.createElement('section');
    fixture.appendChild(node);
    flatTreeSetup(fixture);
    expect(
      axe.testUtils
        .getCheckEvaluate('valid-scrollable-semantics')
        .call(checkContext, node)
    ).toBe(true);
  });

  it('should return true for article elements', function () {
    const node = document.createElement('article');
    fixture.appendChild(node);
    flatTreeSetup(fixture);
    expect(
      axe.testUtils
        .getCheckEvaluate('valid-scrollable-semantics')
        .call(checkContext, node)
    ).toBe(true);
  });

  it('should return true for aside elements', function () {
    const node = document.createElement('aside');
    fixture.appendChild(node);
    flatTreeSetup(fixture);
    expect(
      axe.testUtils
        .getCheckEvaluate('valid-scrollable-semantics')
        .call(checkContext, node)
    ).toBe(true);
  });

  it('should return true for role=tabpanel', function () {
    const node = document.createElement('div');
    node.setAttribute('role', 'tabpanel');
    fixture.appendChild(node);
    flatTreeSetup(fixture);
    expect(
      axe.testUtils
        .getCheckEvaluate('valid-scrollable-semantics')
        .call(checkContext, node)
    ).toBe(true);
  });

  it('should return true for role=tooltip', function () {
    const node = document.createElement('div');
    node.setAttribute('role', 'tooltip');
    fixture.appendChild(node);
    flatTreeSetup(fixture);
    expect(
      axe.testUtils
        .getCheckEvaluate('valid-scrollable-semantics')
        .call(checkContext, node)
    ).toBe(true);
  });

  describe('options', function () {
    it('should allow options.roles to return true for role', function () {
      const node = document.createElement('div');
      node.setAttribute('role', 'banner');
      fixture.appendChild(node);
      flatTreeSetup(fixture);
      expect(
        axe.testUtils
          .getCheckEvaluate('valid-scrollable-semantics')
          .call(checkContext, node, { roles: ['banner'] })
      ).toBe(true);
    });
  });
});
