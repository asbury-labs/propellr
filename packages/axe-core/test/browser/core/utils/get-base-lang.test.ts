import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('axe.utils.getBaseLang', () => {
  it('returns base lang as peanut for argument peanut-BUTTER', () => {
    const actual = axe.utils.getBaseLang('peanut-BUTTER');
    expect(actual).toBe('peanut');
  });

  it('returns base lang as fr for argument FR-CA', () => {
    const actual = axe.utils.getBaseLang('FR-CA');
    expect(actual).toBe('fr');
  });

  it('returns base lang which is the prefix string before the first - (hyphen)', () => {
    const actual = axe.utils.getBaseLang('en-GB');
    expect(actual).toBe('en');
  });

  it('returns primary language subtag as base lang for multi hyphenated argument', () => {
    const actual = axe.utils.getBaseLang('SOME-random-lang');
    expect(actual).toBe('some');
  });

  it('returns an empty string when argument is null or undefined', () => {
    const actualNull = axe.utils.getBaseLang(null);
    const actualUndefined = axe.utils.getBaseLang(undefined);
    const actualEmpty = axe.utils.getBaseLang();
    expect(actualNull).toBe('');
    expect(actualUndefined).toBe('');
    expect(actualEmpty).toBe('');
  });
});
