import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('helpers.incompleteFallbackMessage', () => {
  it('returns a non-empty string by default', () => {
    let summary = helpers.incompleteFallbackMessage();
    expect(typeof summary).toBe('string');
    expect(summary).not.toBe('');
  });

  it('should return a string', () => {
    axe._load({
      messages: {},
      rules: [],
      data: {
        incompleteFallbackMessage: 'Dogs are the best'
      }
    });
    let summary = helpers.incompleteFallbackMessage();
    expect(summary).toBe('Dogs are the best');
  });

  it('should handle doT.js template function', () => {
    axe._load({
      messages: {},
      rules: [],
      data: {
        incompleteFallbackMessage: function anonymous() {
          return 'Dogs are the best';
        }
      }
    });

    let summary = helpers.incompleteFallbackMessage();
    expect(summary).toBe('Dogs are the best');
  });

  describe('when passed an invalid value', () => {
    it('returns `` when set to an object', () => {
      axe._load({
        messages: {},
        rules: [],
        data: {
          incompleteFallbackMessage: {}
        }
      });
      expect(helpers.incompleteFallbackMessage()).toBe('');
    });

    it('returns `` when set to null', () => {
      axe._load({
        messages: {},
        rules: [],
        data: {
          incompleteFallbackMessage: null
        }
      });
      expect(helpers.incompleteFallbackMessage()).toBe('');
    });

    it('returns `` when set to undefined', () => {
      axe._load({
        messages: {},
        rules: [],
        data: {
          incompleteFallbackMessage: undefined
        }
      });
      expect(helpers.incompleteFallbackMessage()).toBe('');
    });
  });
});
