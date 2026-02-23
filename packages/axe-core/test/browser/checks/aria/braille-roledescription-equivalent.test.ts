import { describe, it, expect, afterEach } from 'vitest';
import {
  checkSetup,
  getCheckEvaluate,
  MockCheckContext
} from '../../../testutils';

describe('braille-roledescription-equivalent tests', () => {
  const checkContext = MockCheckContext();
  const checkEvaluate = getCheckEvaluate('braille-roledescription-equivalent');

  afterEach(() => {
    checkContext.reset();
  });

  it('returns true without aria-brailleroledescription', () => {
    const params = checkSetup('<div id="target"></div>');
    expect(checkEvaluate.apply(checkContext, params)).toBe(true);
  });

  it('returns true when aria-brailleroledecription is empty', () => {
    const params = checkSetup(
      '<div id="target" aria-brailleroledescription=""></div>'
    );
    expect(checkEvaluate.apply(checkContext, params)).toBe(true);
  });

  it('returns true when aria-brailleroledecription is whitespace-only', () => {
    const params = checkSetup(
      '<div id="target" aria-brailleroledescription=" \r\t\n "></div>'
    );
    expect(checkEvaluate.apply(checkContext, params)).toBe(true);
  });

  describe('when aria-brailleroledescription has text', () => {
    it('returns false without aria-roledescription', () => {
      const params = checkSetup(`
        <div
          id="target"
          aria-brailleroledescription="foo"
        ></div>
      `);
      expect(checkEvaluate.apply(checkContext, params)).toBe(false);
      expect(checkContext._data).toEqual({ messageKey: 'noRoleDescription' });
    });

    it('returns false when aria-roledescription is empty', () => {
      const params = checkSetup(`
        <div
          id="target"
          aria-roledescription=""
          aria-brailleroledescription="foo"
        ></div>
      `);
      expect(checkEvaluate.apply(checkContext, params)).toBe(false);
      expect(checkContext._data).toEqual({
        messageKey: 'emptyRoleDescription'
      });
    });

    it('returns false when aria-roledescription has only whitespace', () => {
      const params = checkSetup(`
        <div
          id="target"
          aria-roledescription=" \r\t\n "
          aria-brailleroledescription="foo"
        ></div>
      `);
      expect(checkEvaluate.apply(checkContext, params)).toBe(false);
      expect(checkContext._data).toEqual({
        messageKey: 'emptyRoleDescription'
      });
    });

    it('returns true when aria-roledescription is not empty', () => {
      const params = checkSetup(`
        <div
          id="target"
          aria-roledescription="foo"
          aria-brailleroledescription="foo"
        ></div>
      `);
      expect(checkEvaluate.apply(checkContext, params)).toBe(true);
    });
  });
});
