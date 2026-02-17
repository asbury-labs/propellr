import { describe, it, expect, beforeEach } from 'vitest';

declare const axe: any;
describe('axe.utils.filterHtmlAttrs', () => {
  const fixture = document.querySelector('#fixture');

  const filterHtmlAttrs = axe.utils.filterHtmlAttrs;
  let html, expected;

  beforeEach(() => {
    fixture.innerHTML =
      '<label> My Label <input type="text" value="my value" /></label>';
    html = fixture.firstChild;
    expected = '<label> My Label <input value="my value"></label>';
  });

  it('should return string if no attributes are passed', () => {
    expect(filterHtmlAttrs(html)).toBe(html);
  });

  it('should filter attribute if exists', () => {
    expect(filterHtmlAttrs(html, { type: true }).outerHTML).toBe(expected);
  });

  it('should filter attribute if matches CSS selector', () => {
    expect(filterHtmlAttrs(html, { type: 'input' }).outerHTML).toBe(expected);
  });

  it('should not filter attribute if does not match value', () => {
    expect(filterHtmlAttrs(html, { type: 'div' }).outerHTML).toBe(
      html.outerHTML
    );
  });

  it('should not change the original element', () => {
    const outerHTML = html.outerHTML;
    expect(filterHtmlAttrs(html, { type: true }) !== html).toBe(true);
    expect(html.outerHTML).toBe(outerHTML);
  });

  it('should filter multiple attributes', () => {
    expect(
      filterHtmlAttrs(html, {
        type: true,
        value: '[value="my value"]'
      }).outerHTML
    ).toBe('<label> My Label <input></label>');
  });
});
