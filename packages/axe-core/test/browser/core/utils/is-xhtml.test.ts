import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('axe.utils.isXHTML', () => {
  it('should return true on any document that is XHTML', () => {
    const doc = document.implementation.createDocument(
      'http://www.w3.org/1999/xhtml',
      'html',
      null
    );
    expect(axe.utils.isXHTML(doc)).toBe(true);
  });

  it('should return false on any document that is HTML', () => {
    const doc = document.implementation.createHTMLDocument('Monkeys');
    expect(axe.utils.isXHTML(doc)).toBe(false);
  });

  it('should return false on any document that is HTML - fixture', () => {
    expect(axe.utils.isXHTML(document)).toBe(false);
  });
});
