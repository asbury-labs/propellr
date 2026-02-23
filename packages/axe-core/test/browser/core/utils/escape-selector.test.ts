import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('utils.escapeSelector', () => {
  const escapeSelector = axe.utils.escapeSelector;

  it('leaves characters that do not need to escape alone', () => {
    expect(escapeSelector('a0b')).toBe('a0b');
    expect(escapeSelector('a1b')).toBe('a1b');
    expect(escapeSelector('a2b')).toBe('a2b');
    expect(escapeSelector('a3b')).toBe('a3b');
    expect(escapeSelector('a4b')).toBe('a4b');
    expect(escapeSelector('a5b')).toBe('a5b');
    expect(escapeSelector('a6b')).toBe('a6b');
    expect(escapeSelector('a7b')).toBe('a7b');
    expect(escapeSelector('a8b')).toBe('a8b');
    expect(escapeSelector('a9b')).toBe('a9b');
    expect(escapeSelector('a0123456789b')).toBe('a0123456789b');
    expect(escapeSelector('abcdefghijklmnopqrstuvwxyz')).toBe(
      'abcdefghijklmnopqrstuvwxyz'
    );
    expect(escapeSelector('ABCDEFGHIJKLMNOPQRSTUVWXYZ')).toBe(
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    );
  });

  it('escapes null characters', () => {
    expect(escapeSelector('\0')).toBe('\uFFFD');
    expect(escapeSelector('a\0')).toBe('a\uFFFD');
    expect(escapeSelector('a\0b')).toBe('a\uFFFDb');
  });

  it('stringifies non-string characters', () => {
    expect(escapeSelector()).toBe('undefined');
    expect(escapeSelector(true)).toBe('true');
    expect(escapeSelector(false)).toBe('false');
    expect(escapeSelector(null)).toBe('null');
    expect(escapeSelector('')).toBe('');
  });

  it('escapes strings starting with a number', () => {
    expect(escapeSelector('0a')).toBe('\\30 a');
    expect(escapeSelector('1a')).toBe('\\31 a');
    expect(escapeSelector('2a')).toBe('\\32 a');
    expect(escapeSelector('3a')).toBe('\\33 a');
    expect(escapeSelector('4a')).toBe('\\34 a');
    expect(escapeSelector('5a')).toBe('\\35 a');
    expect(escapeSelector('6a')).toBe('\\36 a');
    expect(escapeSelector('7a')).toBe('\\37 a');
    expect(escapeSelector('8a')).toBe('\\38 a');
    expect(escapeSelector('9a')).toBe('\\39 a');
  });

  it('only escapes "-" when before a number, or on its own', () => {
    expect(escapeSelector('-123')).toBe('-\\31 23');
    expect(escapeSelector('-')).toBe('\\-');
    expect(escapeSelector('--a')).toBe('--a');
  });

  it('escapes characters staring with a negative number', () => {
    expect(escapeSelector('-0a')).toBe('-\\30 a');
    expect(escapeSelector('-1a')).toBe('-\\31 a');
    expect(escapeSelector('-2a')).toBe('-\\32 a');
    expect(escapeSelector('-3a')).toBe('-\\33 a');
    expect(escapeSelector('-4a')).toBe('-\\34 a');
    expect(escapeSelector('-5a')).toBe('-\\35 a');
    expect(escapeSelector('-6a')).toBe('-\\36 a');
    expect(escapeSelector('-7a')).toBe('-\\37 a');
    expect(escapeSelector('-8a')).toBe('-\\38 a');
    expect(escapeSelector('-9a')).toBe('-\\39 a');
  });

  it('escapes hex character codes', () => {
    expect(escapeSelector('\x80\x2D\x5F\xA9')).toBe('\x80\x2D\x5F\xA9');
    expect(escapeSelector('\xA0\xA1\xA2')).toBe('\xA0\xA1\xA2');

    expect(escapeSelector('\x01\x02\x1E\x1F')).toBe('\\1 \\2 \\1e \\1f ');
    expect(escapeSelector('\x20\x21\x78\x79')).toBe('\\ \\!xy');

    // astral symbol (U+1D306 TETRAGRAM FOR CENTRE)
    expect(escapeSelector('\uD834\uDF06')).toBe('\uD834\uDF06');
    // lone surrogates
    expect(escapeSelector('\uDF06')).toBe('\uDF06');
    expect(escapeSelector('\uD834')).toBe('\uD834');
  });
});
