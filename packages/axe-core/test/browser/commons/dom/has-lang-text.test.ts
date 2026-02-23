import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('dom.hasLangText', function () {
  const hasLangText = axe.commons.dom.hasLangText;
  const fixture = document.getElementById('fixture');
  const tree;

  it('returns true when the element has a non-empty text node as its content', function () {
    fixture.innerHTML = '<div id="target">  text  </div>';
    tree = axe.utils.getFlattenedTree(fixture);
    const target = axe.utils.querySelectorAll(tree, '#target')[0];
    expect(hasLangText(target)).toBe(true);
  });

  it('returns true when the element has nested text node as its content', function () {
    fixture.innerHTML = '<div id="target"> <span> text </span> </div>';
    tree = axe.utils.getFlattenedTree(fixture);
    const target = axe.utils.querySelectorAll(tree, '#target')[0];
    expect(hasLangText(target)).toBe(true);
  });

  it('returns false when the element has nested text is hidden', function () {
    fixture.innerHTML = '<div id="target"> <span hidden> text </span> </div>';
    tree = axe.utils.getFlattenedTree(fixture);
    const target = axe.utils.querySelectorAll(tree, '#target')[0];
    expect(hasLangText(target)).toBe(false);
  });

  it('returns true when the element has nested text is aria-hidden', function () {
    fixture.innerHTML =
      '<div id="target"> <span aria-hidden="true"> text </span> </div>';
    tree = axe.utils.getFlattenedTree(fixture);
    const target = axe.utils.querySelectorAll(tree, '#target')[0];
    expect(hasLangText(target)).toBe(true);
  });

  it('returns true when the element has nested text is off screen', function () {
    fixture.innerHTML =
      '<div id="target">' +
      '  <span style="position: absolute; top:-99em;"> text </span> ' +
      '</div>';
    tree = axe.utils.getFlattenedTree(fixture);
    const target = axe.utils.querySelectorAll(tree, '#target')[0];
    expect(hasLangText(target)).toBe(true);
  });

  it('returns false when the element has an empty text node as its content', function () {
    fixture.innerHTML = '<div id="target">  <!-- comment -->  </div>';
    tree = axe.utils.getFlattenedTree(fixture);
    const target = axe.utils.querySelectorAll(tree, '#target')[0];
    expect(hasLangText(target)).toBe(false);
  });

  it('returns false if all text is in a child with a lang attribute', function () {
    fixture.innerHTML = '<div id="target"><span lang="en"> text </span></div>';
    tree = axe.utils.getFlattenedTree(fixture);
    const target = axe.utils.querySelectorAll(tree, '#target')[0];
    expect(hasLangText(target)).toBe(false);
  });

  it('does not skip if lang is on the starting node', function () {
    fixture.innerHTML = '<div id="target" lang="en"><span> text </span></div>';
    tree = axe.utils.getFlattenedTree(fixture);
    const target = axe.utils.querySelectorAll(tree, '#target')[0];
    expect(hasLangText(target)).toBe(true);
  });

  it('ignores empty lang attributes', function () {
    fixture.innerHTML = '<div id="target"><span lang=""> text </span></div>';
    tree = axe.utils.getFlattenedTree(fixture);
    const target = axe.utils.querySelectorAll(tree, '#target')[0];
    expect(hasLangText(target)).toBe(true);
  });

  it('ignores null lang attributes', function () {
    fixture.innerHTML = '<div id="target"><span lang> text </span></div>';
    tree = axe.utils.getFlattenedTree(fixture);
    const target = axe.utils.querySelectorAll(tree, '#target')[0];
    expect(hasLangText(target)).toBe(true);
  });

  it('true for non-text content with an accessible name', function () {
    fixture.innerHTML = '<div id="target"><img alt="foo"></div>';
    tree = axe.utils.getFlattenedTree(fixture);
    const target = axe.utils.querySelectorAll(tree, '#target')[0];
    expect(hasLangText(target)).toBe(true);
  });

  it('false for non-text content without accessible name', function () {
    fixture.innerHTML = '<div id="target"><img alt=""></div>';
    tree = axe.utils.getFlattenedTree(fixture);
    const target = axe.utils.querySelectorAll(tree, '#target')[0];
    expect(hasLangText(target)).toBe(false);
  });

  it('returns false for non-text content with a lang attr', function () {
    fixture.innerHTML = '<div id="target"><img alt="foo" lang="en"></div>';
    tree = axe.utils.getFlattenedTree(fixture);
    const target = axe.utils.querySelectorAll(tree, '#target')[0];
    expect(hasLangText(target)).toBe(false);
  });
});
