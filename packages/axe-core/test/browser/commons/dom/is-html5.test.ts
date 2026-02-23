import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('dom.isHTML5', function () {
  it('should return false on any document that is not HTML5', function () {
    const doc = document.implementation.createDocument(
      'http://www.w3.org/1999/xhtml',
      'html',
      null
    );
    expect(axe.commons.dom.isHTML5(doc)).toBe(false);
  });

  it('should return true on any document that is HTML5', function () {
    const doc = document.implementation.createHTMLDocument('Monkeys');
    expect(axe.commons.dom.isHTML5(doc)).toBe(true);
  });

  it('should return true on any document that is HTML5 - fixture', function () {
    expect(axe.commons.dom.isHTML5(document)).toBe(true);
  });
});
