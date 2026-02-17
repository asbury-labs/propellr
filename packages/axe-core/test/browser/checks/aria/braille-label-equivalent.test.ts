import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('braille-label-equivalent tests', () => {
  const { checkSetup, getCheckEvaluate } = axe.testUtils;
  const checkContext = axe.testUtils.MockCheckContext();
  const checkEvaluate = getCheckEvaluate('braille-label-equivalent');

  afterEach(() => {
    checkContext.reset();
  });

  it('returns true without aria-braillelabel', () => {
    const params = checkSetup('<img id="target" alt="" />');
    expect(checkEvaluate.apply(checkContext, params)).toBe(true);
  });

  it('returns true when aria-braillelabel is empty', () => {
    const params = checkSetup(
      '<img id="target" alt="" aria-braillelabel="" />'
    );
    expect(checkEvaluate.apply(checkContext, params)).toBe(true);
  });

  it('returns true when aria-braillelabel is whitespace-only', () => {
    const params = checkSetup(
      '<img id="target" alt="" aria-braillelabel=" \r\t\n " />'
    );
    expect(checkEvaluate.apply(checkContext, params)).toBe(true);
  });

  describe('when aria-braillelabel has text', () => {
    it('returns false when the accessible name is empty', () => {
      const params = checkSetup(`
        <img id="target" alt="" aria-braillelabel="foo" />
      `);
      expect(checkEvaluate.apply(checkContext, params)).toBe(false);
    });

    it('returns false when the accessible name has only whitespace', () => {
      const params = checkSetup(`
        <img id="target" alt=" \r\t\n " aria-braillelabel="foo" />
      `);
      expect(checkEvaluate.apply(checkContext, params)).toBe(false);
    });

    it('returns true when the accessible name is not empty', () => {
      const params = checkSetup(`
        <img id="target" alt="foo" aria-braillelabel="foo" />
      `);
      expect(checkEvaluate.apply(checkContext, params)).toBe(true);
    });
  });
});
