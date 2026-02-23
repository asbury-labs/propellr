import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('text.hasUnicode', () => {
  describe('text.hasUnicode, characters of type Non Bi Multilingual Plane', () => {
    it('returns false when given string is alphanumeric', () => {
      const actual = axe.commons.text.hasUnicode('1 apple', {
        nonBmp: true
      });
      expect(actual).toBe(false);
    });

    it('returns false when given string is number', () => {
      const actual = axe.commons.text.hasUnicode('100', {
        nonBmp: true
      });
      expect(actual).toBe(false);
    });

    it('returns false when given string is a sentence', () => {
      const actual = axe.commons.text.hasUnicode('Earth is round', {
        nonBmp: true
      });
      expect(actual).toBe(false);
    });

    it('returns true when given string is a phonetic extension', () => {
      const actual = axe.commons.text.hasUnicode('ᴁ', {
        nonBmp: true
      });
      expect(actual).toBe(true);
    });

    it('returns true when given string is a combining diacritical marks supplement', () => {
      const actual = axe.commons.text.hasUnicode('ᴁ', {
        nonBmp: true
      });
      expect(actual).toBe(true);
    });

    it('returns true when given string is a currency symbols', () => {
      const actual = axe.commons.text.hasUnicode('₨ 20000', {
        nonBmp: true
      });
      expect(actual).toBe(true);
    });

    it('returns true when given string has arrows', () => {
      const actual = axe.commons.text.hasUnicode('← turn left', {
        nonBmp: true
      });
      expect(actual).toBe(true);
    });

    it('returns true when given string has geometric shapes', () => {
      const actual = axe.commons.text.hasUnicode('◓', {
        nonBmp: true
      });
      expect(actual).toBe(true);
    });

    it('returns true when given string has math operators', () => {
      const actual = axe.commons.text.hasUnicode('√4 = 2', {
        nonBmp: true
      });
      expect(actual).toBe(true);
    });

    it('returns true when given string has windings font', () => {
      const actual = axe.commons.text.hasUnicode('▽', {
        nonBmp: true
      });
      expect(actual).toBe(true);
    });

    it('returns true for a string with characters in supplementary private use area A', () => {
      const actual = axe.commons.text.hasUnicode('\uDB80\uDFFE', {
        nonBmp: true
      });
      expect(actual).toBe(true);
    });

    it('returns true when given string has format unicode', () => {
      // zero-width spacer character U+200B
      const actual = axe.commons.text.hasUnicode('\u200BHello World', {
        nonBmp: true
      });
      expect(actual).toBe(true);
    });
  });

  describe('text.hasUnicode, characters of type Emoji', () => {
    it('returns false when given string is alphanumeric', () => {
      const actual = axe.commons.text.hasUnicode(
        '1 apple a day, keeps the doctor away',
        {
          emoji: true
        }
      );
      expect(actual).toBe(false);
    });

    it('returns false when given string is number', () => {
      const actual = axe.commons.text.hasUnicode('100', {
        emoji: true
      });
      expect(actual).toBe(false);
    });

    it('returns false when given string is a sentence', () => {
      const actual = axe.commons.text.hasUnicode('Earth is round', {
        emoji: true
      });
      expect(actual).toBe(false);
    });

    it('returns true when given string has emoji', () => {
      const actual = axe.commons.text.hasUnicode('🌎 is round', {
        emoji: true
      });
      expect(actual).toBe(true);
    });

    it('returns true when given string has emoji', () => {
      const actual = axe.commons.text.hasUnicode('plant a 🌱', {
        emoji: true
      });
      expect(actual).toBe(true);
    });
  });

  describe('text.hasUnicode, characters of type punctuations', () => {
    it('returns false when given string is number', () => {
      const actual = axe.commons.text.hasUnicode('100', {
        punctuations: true
      });
      expect(actual).toBe(false);
    });

    it('returns false when given string is a sentence', () => {
      const actual = axe.commons.text.hasUnicode('Earth is round', {
        punctuations: true
      });
      expect(actual).toBe(false);
    });

    it('returns true when given string has punctuations', () => {
      const actual = axe.commons.text.hasUnicode("What's your name?", {
        punctuations: true
      });
      expect(actual).toBe(true);
    });

    it('returns true for strings with money signs and odd symbols', () => {
      ['£', '¢', '¥', '€', '§', '±'].forEach(function (str) {
        const actual = axe.commons.text.hasUnicode(str, {
          punctuations: true
        });
        expect(actual).toBe(true);
      });
    });
  });

  describe('text.hasUnicode, has combination of unicode', () => {
    it('returns false when given string is number', () => {
      const actual = axe.commons.text.hasUnicode('100', {
        emoji: true,
        nonBmp: true,
        punctuations: true
      });
      expect(actual).toBe(false);
    });

    it('returns true when given string has unicode characters', () => {
      const actual = axe.commons.text.hasUnicode(
        'The ☀️ is orange, the ◓ is white.',
        {
          emoji: true,
          nonBmp: true,
          punctuations: true
        }
      );
      expect(actual).toBe(true);
    });

    it('returns true when given format unicode characters', () => {
      // zero-width spacer character U+200B
      const actual = axe.commons.text.hasUnicode('\u200BHello World', {
        emoji: true,
        nonBmp: true,
        punctuations: true
      });
      expect(actual).toBe(true);
    });

    it('returns true when given punctuation characters', () => {
      const actual = axe.commons.text.hasUnicode('Earth!!!', {
        emoji: true,
        nonBmp: true,
        punctuations: true
      });
      expect(actual).toBe(true);
    });
  });
});

describe('text.removeUnicode', () => {
  it('returns string by removing non BMP unicode ', () => {
    const actual = axe.commons.text.removeUnicode('₨₨20000₨₨', {
      nonBmp: true
    });
    expect(actual).toBe('20000');
  });

  it('returns string by removing emoji unicode ', () => {
    const actual = axe.commons.text.removeUnicode('☀️Sun 🌎Earth', {
      emoji: true
    });
    expect(actual).toBe('Sun Earth');
  });

  it('returns string after removing punctuations from word', () => {
    const actual = axe.commons.text.removeUnicode('Earth!!!', {
      punctuations: true
    });
    expect(actual).toBe('Earth');
  });

  it('returns string removing all punctuations', () => {
    const actual = axe.commons.text.removeUnicode('<!,."\':;!>', {
      punctuations: true
    });
    expect(actual).toBe('');
  });

  it('returns string removing all private use unicode', () => {
    const actual = axe.commons.text.removeUnicode('', {
      nonBmp: true
    });
    expect(actual).toBe('');
  });

  it('returns string removing all supplementary private use unicode', () => {
    const actual = axe.commons.text.removeUnicode('󰀀󿰀󿿽󰏽', {
      nonBmp: true
    });
    expect(actual).toBe('');
  });

  it('returns the string with supplementary private use area A characters removed', () => {
    const actual = axe.commons.text.removeUnicode('\uDB80\uDFFE', {
      nonBmp: true
    });
    expect(actual).toBe('');
  });

  it('returns string removing combination of unicode characters', () => {
    const actual = axe.commons.text.removeUnicode(
      'The ☀️ is orange, the ◓ is white.',
      {
        emoji: true,
        nonBmp: true,
        punctuations: true
      }
    );
    expect(actual).toBe('The  is orange the  is white');
  });

  it('returns string removing format unicode', () => {
    // zero-width spacer character U+200B
    const actual = axe.commons.text.removeUnicode('\u200BHello World', {
      nonBmp: true
    });
    expect(actual).toBe('Hello World');
  });
});
