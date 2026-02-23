import { describe, it, afterEach, expect } from 'vitest';

declare const axe: any;
describe('dom.isMultiline', function () {
  const isMultiline = axe.commons.dom.isMultiline;
  const fixture = document.querySelector('#fixture');

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('returns false if there is a single line', function () {
    fixture.innerHTML = '<p>hello</p>';
    expect(isMultiline(fixture.firstChild)).toBe(false);
  });

  it('returns true if there are two lines', function () {
    fixture.innerHTML = '<p>hello <br> world</p>';
    expect(isMultiline(fixture.firstChild)).toBe(true);
  });

  it('handles single-line texts with varying font-sizes', function () {
    fixture.innerHTML =
      '<p>' +
      '  <span style="font-size: 12px">small</span> ' +
      '  <span style="font-size: 20px">large</span>' +
      '  <span style="font-size: 16px">medium</span>' +
      '</p>';
    expect(isMultiline(fixture.firstChild)).toBe(false);
  });

  describe('with non-text elements', function () {
    it('is true when on a multiple lines', function () {
      fixture.innerHTML =
        '<p>' +
        '  <input /><br>' +
        '  <textarea rows="5"></textarea><br>' +
        '  <button style="font-size: 20px">I like big buttons</button>' +
        '</p>';
      expect(isMultiline(fixture.firstChild)).toBe(true);
    });

    it('is false when on a single line', function () {
      fixture.innerHTML =
        '<p>' +
        '  <span style="font-size: 12px">Hello</span> ' +
        '  <input />' +
        '  <textarea rows="5"></textarea>' +
        '  <button style="font-size: 20px">I like big buttons</button>' +
        '</p>';
      expect(isMultiline(fixture.firstChild)).toBe(false);
    });
  });
});
