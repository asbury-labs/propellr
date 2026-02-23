import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('text.isValidAutocomplete', () => {
  const isValidAutocomplete = axe.commons.text.isValidAutocomplete;
  const options = {
    standaloneTerms: ['standalone-term'],
    qualifiedTerms: ['qualified-term']
  };

  it('is true when empty', () => {
    expect(isValidAutocomplete('', options)).toBe(true);
  });

  it('is true when there is a stateTerm', () => {
    expect(isValidAutocomplete('on', options)).toBe(true);
  });

  it('is true when there is a standaloneTerms', () => {
    expect(isValidAutocomplete('standalone-term', options)).toBe(true);
  });

  it('is true when there is a qualifiedTerms', () => {
    expect(isValidAutocomplete('qualified-term', options)).toBe(true);
  });

  it('is false when there is no stateTerm, standaloneTerms, or qualifiedTerms', () => {
    expect(isValidAutocomplete('bad-term', options)).toBe(false);
  });

  describe('section-* grouping', () => {
    it('is false when used by itself', () => {
      expect(isValidAutocomplete('section-foo', options)).toBe(false);
    });

    it('is true when used before a standaloneTerm', () => {
      expect(isValidAutocomplete('section-foo standalone-term', options)).toBe(
        true
      );
    });

    it('is true when used before a qualifiedTerm', () => {
      expect(isValidAutocomplete('section-foo qualified-term', options)).toBe(
        true
      );
    });

    it('is false when used with a stateTerm', () => {
      expect(isValidAutocomplete('section-foo off', options)).toBe(false);
      expect(isValidAutocomplete('section-foo on', options)).toBe(false);
    });

    it('is false when used out of order', () => {
      expect(isValidAutocomplete('qualified-term section-foo', options)).toBe(
        false
      );
      expect(isValidAutocomplete('standalone-term section-foo', options)).toBe(
        false
      );
    });
  });

  describe('locations', () => {
    it('is false when used by itself', () => {
      expect(isValidAutocomplete('shipping', options)).toBe(false);
    });

    it('is true when in order', () => {
      expect(isValidAutocomplete('shipping standalone-term', options)).toBe(
        true
      );
      expect(isValidAutocomplete('shipping qualified-term', options)).toBe(
        true
      );
      expect(
        isValidAutocomplete('section-foo shipping standalone-term', options)
      ).toBe(true);
      expect(
        isValidAutocomplete('section-foo shipping qualified-term', options)
      ).toBe(true);
    });

    it('is false when used out of order', () => {
      expect(isValidAutocomplete('standalone-term shipping', options)).toBe(
        false
      );
      expect(isValidAutocomplete('qualified-term shipping', options)).toBe(
        false
      );
      expect(
        isValidAutocomplete('shipping section-foo standalone-term', options)
      ).toBe(false);
      expect(
        isValidAutocomplete('shipping section-foo qualified-term', options)
      ).toBe(false);
    });

    it('is false when used with a stateTerm', () => {
      expect(isValidAutocomplete('shipping off', options)).toBe(false);
      expect(isValidAutocomplete('shipping on', options)).toBe(false);
    });
  });

  describe('qualifiers', () => {
    it('is true when used before a qualifiedTerm', () => {
      expect(isValidAutocomplete('home qualified-term', options)).toBe(true);
      expect(isValidAutocomplete('shipping home qualified-term', options)).toBe(
        true
      );
    });

    it('is false when used before a standaloneTerm', () => {
      expect(isValidAutocomplete('home standalone-term', options)).toBe(false);
    });

    it('is false when used with a stateTerm', () => {
      expect(isValidAutocomplete('home off', options)).toBe(false);
      expect(isValidAutocomplete('home on', options)).toBe(false);
    });

    it('is false when used out of order', () => {
      expect(isValidAutocomplete('qualified-term home', options)).toBe(false);
      expect(
        isValidAutocomplete('home section-foo qualified-term', options)
      ).toBe(false);
      expect(isValidAutocomplete('home shipping qualified-term', options)).toBe(
        false
      );
      expect(
        isValidAutocomplete('section-foo home shipping qualified-term', options)
      ).toBe(false);
      expect(
        isValidAutocomplete('home section-foo shipping qualified-term', options)
      ).toBe(false);
    });
  });

  describe('webauthn', () => {
    it('returns false if used as the only term', () => {
      expect(isValidAutocomplete('webauthn', options)).toBe(false);
    });

    it('returns false if used with a state term', () => {
      expect(isValidAutocomplete('on webauthn', options)).toBe(false);
      expect(isValidAutocomplete('off webauthn', options)).toBe(false);
    });

    it('returns true if used after a standalone term', () => {
      expect(isValidAutocomplete('standalone-term webauthn', options)).toBe(
        true
      );
      expect(
        isValidAutocomplete('billing standalone-term webauthn', options)
      ).toBe(true);
      expect(
        isValidAutocomplete('section-foo standalone-term webauthn', options)
      ).toBe(true);
      expect(
        isValidAutocomplete(
          'section-foo billing standalone-term webauthn',
          options
        )
      ).toBe(true);
    });

    it('returns false if used before a standalone term', () => {
      expect(isValidAutocomplete('webauthn standalone-term', options)).toBe(
        false
      );
      expect(
        isValidAutocomplete('webauthn section-foo standalone-term', options)
      ).toBe(false);
      expect(
        isValidAutocomplete('section-foo webauthn standalone-term', options)
      ).toBe(false);
    });

    it('returns true if used after a qualified term', () => {
      expect(isValidAutocomplete('qualified-term webauthn', options)).toBe(
        true
      );
      expect(
        isValidAutocomplete('section-foo qualified-term webauthn', options)
      ).toBe(true);
      expect(isValidAutocomplete('home qualified-term webauthn', options)).toBe(
        true
      );
      expect(
        isValidAutocomplete('section-foo home qualified-term webauthn', options)
      ).toBe(true);
    });

    it('returns false when used with only optional tokens', () => {
      expect(isValidAutocomplete('home webauthn', options)).toBe(false);
      expect(isValidAutocomplete('section-foo webauthn', options)).toBe(false);
      expect(isValidAutocomplete('section-foo home webauthn', options)).toBe(
        false
      );
    });
  });

  describe('options.strictMode:false', () => {
    it('returns true if the last term is a valid autocomplete term', () => {
      expect(
        isValidAutocomplete('do not care! valid-term', {
          looseTyped: true,
          standaloneTerms: ['valid-term']
        })
      ).toBe(true);
    });

    it('returns true if the last term is webauthn, and the term before is valid', () => {
      expect(
        isValidAutocomplete('do not care! valid-term webauthn', {
          looseTyped: true,
          standaloneTerms: ['valid-term']
        })
      ).toBe(true);
    });

    it('returns false if the last term is an invalid autocomplete term', () => {
      expect(
        isValidAutocomplete('shipping invalid', {
          looseTyped: true,
          standaloneTerms: ['valid-term']
        })
      ).toBe(false);
    });
  });

  describe('options.ignoredValues', () => {
    it('returns undefined if value is invalid and ignored', () => {
      expect(
        isValidAutocomplete('bad-term', {
          ignoredValues: ['bad-term']
        })
      ).toBeUndefined();
    });
  });
});
