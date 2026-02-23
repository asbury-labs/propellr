import { describe, it, expect, afterEach } from 'vitest';
import { getCheckEvaluate, queryFixture } from '../../../testutils';

describe('frame-focusable-content tests', function () {
  const fixture = document.querySelector('#fixture')!;
  const frameFocusableContent = getCheckEvaluate('frame-focusable-content');

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('should return true if element has no focusable content', function () {
    const vNode = queryFixture('<div id="target"><span>Hello</span></div>');
    expect(frameFocusableContent(null, null, vNode)).toBe(true);
  });

  it('should return true if element is empty', function () {
    const vNode = queryFixture('<div id="target"></div>');
    expect(frameFocusableContent(null, null, vNode)).toBe(true);
  });

  it('should return true if element only has text content', function () {
    const vNode = queryFixture('<div id="target">Hello</div>');
    expect(frameFocusableContent(null, null, vNode)).toBe(true);
  });

  it('should return false if element has focusable content', function () {
    const vNode = queryFixture(
      '<div id="target"><span tabindex="0">Hello</span></div>'
    );
    expect(frameFocusableContent(null, null, vNode)).toBe(false);
  });

  it('should return false if element has natively focusable content', function () {
    const vNode = queryFixture(
      '<div id="target"><a href="foo.html">Hello</a></div>'
    );
    expect(frameFocusableContent(null, null, vNode)).toBe(false);
  });

  it('should return true if element is natively focusable but has tabindex=-1', function () {
    const vNode = queryFixture(
      '<div id="target"><button tabindex="-1">Hello</button></div>'
    );
    expect(frameFocusableContent(null, null, vNode)).toBe(true);
  });

  it('should return false if element is natively focusable but has tabindex=0', function () {
    const vNode = queryFixture(
      '<div id="target"><button tabindex="0">Hello</button></div>'
    );
    expect(frameFocusableContent(null, null, vNode)).toBe(false);
  });
});
