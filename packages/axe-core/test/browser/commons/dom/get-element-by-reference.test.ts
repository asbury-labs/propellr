import { describe, it, afterEach, expect } from 'vitest';

declare const axe: any;
describe('dom.getElementByReference', function () {
  const fixture = document.getElementById('fixture');

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('should return null if the attribute is not found', function () {
    fixture.innerHTML = '<a id="link" href="#target">Hi</a>';
    const node = document.getElementById('link'),
      result = axe.commons.dom.getElementByReference(node, 'usemap');

    expect(result).toBeNull();
  });

  it('should return null if the attribute does not start with "#"', function () {
    fixture.innerHTML = '<a id="link" usemap="target">Hi</a>';
    const node = document.getElementById('link'),
      result = axe.commons.dom.getElementByReference(node, 'href');

    expect(result).toBeNull();
  });

  it('should return null if no targets are found', function () {
    fixture.innerHTML = '<a id="link" href="#target">Hi</a>';
    const node = document.getElementById('link'),
      result = axe.commons.dom.getElementByReference(node, 'href');

    expect(result).toBeNull();
  });

  it('should return node if target is found (href)', function () {
    fixture.innerHTML =
      '<a id="link" href="#target">Hi</a>' + '<a id="target"></a>';

    const node = document.getElementById('link'),
      expected = document.getElementById('target'),
      result = axe.commons.dom.getElementByReference(node, 'href');

    expect(result).toBe(expected);
  });

  it('should return node if target is found (usemap)', function () {
    fixture.innerHTML =
      '<img id="link" usemap="#target">Hi</a>' + '<map id="target"></map>';

    const node = document.getElementById('link'),
      expected = document.getElementById('target'),
      result = axe.commons.dom.getElementByReference(node, 'usemap');

    expect(result).toBe(expected);
  });

  it('should prioritize ID', function () {
    fixture.innerHTML =
      '<a id="link" href="#target">Hi</a>' +
      '<a id="target"></a>' +
      '<a name="target"></a>';

    const node = document.getElementById('link'),
      expected = document.getElementById('target'),
      result = axe.commons.dom.getElementByReference(node, 'href');

    expect(result).toBe(expected);
  });

  it('should fallback to name', function () {
    fixture.innerHTML =
      '<a id="link" href="#target">Hi</a>' +
      '<a name="target" id="target0"></a>';

    const node = document.getElementById('link'),
      expected = document.getElementById('target0'),
      result = axe.commons.dom.getElementByReference(node, 'href');

    expect(result).toBe(expected);
  });

  it('should return the first matching element with name', function () {
    fixture.innerHTML =
      '<a id="link" href="#target">Hi</a>' +
      '<a name="target" id="target0"></a>' +
      '<a name="target"></a>';

    const node = document.getElementById('link'),
      expected = document.getElementById('target0'),
      result = axe.commons.dom.getElementByReference(node, 'href');

    expect(result).toBe(expected);
  });

  it('returns the first matching element using Angular skiplinks', function () {
    fixture.innerHTML =
      '<a id="link" href="/#target">Hi</a>' +
      '<a name="target" id="target0"></a>' +
      '<a name="target"></a>';

    const node = document.getElementById('link'),
      expected = document.getElementById('target0'),
      result = axe.commons.dom.getElementByReference(node, 'href');

    expect(result).toBe(expected);
  });

  it('should work with absolute links', function () {
    const currentPage = window.location.origin + window.location.pathname;

    fixture.innerHTML =
      '<a id="link" href="' +
      currentPage +
      '#target">Hi</a>' +
      '<a id="target"></a>' +
      '<a name="target"></a>';

    const node = document.getElementById('link'),
      expected = document.getElementById('target'),
      result = axe.commons.dom.getElementByReference(node, 'href');

    expect(result).toBe(expected);
  });
});
