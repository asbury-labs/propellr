import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('axe.utils.isValidLang', () => {
  describe('isValidLang', () => {
    it('should return true for valid 3-character lang', () => {
      expect(axe.utils.isValidLang('bbb')).toBe(true);
    });

    it('should return true for valid 2-character lang', () => {
      expect(axe.utils.isValidLang('aa')).toBe(true);
    });

    it('should return false for invalid lang', () => {
      expect(axe.utils.isValidLang('xyz')).toBe(false);
    });

    it('should return false for invalid 2-character lang', () => {
      expect(axe.utils.isValidLang('bb')).toBe(false);
    });

    it('should return false for invalid 1-character lang code', () => {
      expect(axe.utils.isValidLang('a')).toBe(false);
    });

    it('should return false for invalid 4-character lang code', () => {
      expect(axe.utils.isValidLang('abcd')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(axe.utils.isValidLang('')).toBe(false);
    });

    it('should return false for invalid lang code', () => {
      expect(axe.utils.isValidLang('123')).toBe(false);
    });
  });

  describe('validLangs', () => {
    it('should return an array of langs', () => {
      expect(Array.isArray(axe.utils.validLangs())).toBe(true);
    });

    it('should include valid langs', () => {
      const langs = axe.utils.validLangs();
      expect(langs.indexOf('aaa') !== -1).toBe(true);
      expect(langs.indexOf('aa') !== -1).toBe(true);
      expect(langs.indexOf('en') !== -1).toBe(true);
      expect(langs.indexOf('zzj') !== -1).toBe(true);
    });
  });
});
