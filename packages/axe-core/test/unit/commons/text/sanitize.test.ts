import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('text.sanitize', function () {
  it('should collapse whitespace and trim', function () {
    expect(axe.commons.text.sanitize('\thi\t')).toBe('hi');
    expect(axe.commons.text.sanitize('\t\nhi \t')).toBe('hi');
    expect(axe.commons.text.sanitize('\thi \n\t ')).toBe('hi');
    expect(axe.commons.text.sanitize(' hi\r\nok')).toBe('hi\nok');
    expect(axe.commons.text.sanitize('hello\u00A0there')).toBe('hello there');
  });

  it('should accept null', function () {
    expect(axe.commons.text.sanitize(null)).toBe('');
  });
});
