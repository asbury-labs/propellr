import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('meta-refresh', function () {
  const checkContext = axe.testUtils.MockCheckContext();
  const checkSetup = axe.testUtils.checkSetup;
  const metaRefreshCheck = axe.testUtils.getCheckEvaluate('meta-refresh');

  afterEach(function () {
    checkContext.reset();
  });

  it('returns false if there is a number', function () {
    const checkArgs = checkSetup(
      '<meta id="target" name="refresh" content="3">'
    );
    expect(metaRefreshCheck.apply(checkContext, checkArgs)).toBe(false);
  });

  describe('returns false when valid', function () {
    it('there is a decimal', function () {
      const checkArgs = checkSetup(
        '<meta id="target" name="refresh" content="3.1">'
      );
      expect(metaRefreshCheck.apply(checkContext, checkArgs)).toBe(false);
    });

    it('there is a number followed by a dot', function () {
      const checkArgs = checkSetup(
        '<meta id="target" name="refresh" content="3.">'
      );
      expect(metaRefreshCheck.apply(checkContext, checkArgs)).toBe(false);
    });

    it('there is a dot followed by a number', function () {
      const checkArgs = checkSetup(
        '<meta id="target" name="refresh" content=".5">'
      );
      expect(metaRefreshCheck.apply(checkContext, checkArgs)).toBe(false);
    });

    it('there is whitespace before the number', function () {
      const checkArgs = checkSetup(
        '<meta id="target" name="refresh" content="  \n\t3">'
      );
      expect(metaRefreshCheck.apply(checkContext, checkArgs)).toBe(false);
    });

    describe('with a valid separator', function () {
      it('the number is followed by a semicolon', function () {
        const checkArgs = checkSetup(
          '<meta id="target" name="refresh" content="3;">'
        );
        expect(metaRefreshCheck.apply(checkContext, checkArgs)).toBe(false);
      });

      it('the number is followed by a comma', function () {
        const checkArgs = checkSetup(
          '<meta id="target" name="refresh" content="3,">'
        );
        expect(metaRefreshCheck.apply(checkContext, checkArgs)).toBe(false);
      });

      it('the number is followed spaces, and then a separator', function () {
        const checkArgs = checkSetup(
          '<meta id="target" name="refresh" content="3 \t\n;">'
        );
        expect(metaRefreshCheck.apply(checkContext, checkArgs)).toBe(false);
      });

      it('the separator is followed by non-separator characters', function () {
        const checkArgs = checkSetup(
          '<meta id="target" name="refresh" content="3; https://deque.com/">'
        );
        expect(metaRefreshCheck.apply(checkContext, checkArgs)).toBe(false);
      });

      it('the separator is a space', function () {
        const checkArgs = checkSetup(
          '<meta id="target" name="refresh" content="3 https://deque.com/">'
        );
        expect(metaRefreshCheck.apply(checkContext, checkArgs)).toBe(false);
      });
    });
  });

  describe('returns true when invalid', function () {
    it('the number is prefaced with a plus', function () {
      const checkArgs = checkSetup(
        '<meta id="target" name="refresh" content="+3">'
      );
      expect(metaRefreshCheck.apply(checkContext, checkArgs)).toBe(true);
    });

    it('the number is prefaced with a minus', function () {
      const checkArgs = checkSetup(
        '<meta id="target" name="refresh" content="-3">'
      );
      expect(metaRefreshCheck.apply(checkContext, checkArgs)).toBe(true);
    });

    it('the number is prefaced with a letter', function () {
      const checkArgs = checkSetup(
        '<meta id="target" name="refresh" content="a3">'
      );
      expect(metaRefreshCheck.apply(checkContext, checkArgs)).toBe(true);
    });

    it('the number is followed by an invalid separator character', function () {
      const checkArgs = checkSetup(
        '<meta id="target" name="refresh" content="3: https://deque.com/">'
      );
      expect(metaRefreshCheck.apply(checkContext, checkArgs)).toBe(true);
    });
  });

  describe('options.minDelay', function () {
    it('returns false when the redirect number is greater than minDelay', function () {
      const options = { minDelay: 2 };
      const checkArgs = checkSetup(
        '<meta id="target" name="refresh" content="3">',
        options
      );
      expect(metaRefreshCheck.apply(checkContext, checkArgs)).toBe(false);
    });

    it('returns true when the redirect number equals minDelay', function () {
      const options = { minDelay: 3 };
      const checkArgs = checkSetup(
        '<meta id="target" name="refresh" content="3">',
        options
      );
      expect(metaRefreshCheck.apply(checkContext, checkArgs)).toBe(true);
    });

    it('returns true when the redirect number is less than minDelay', function () {
      const options = { minDelay: 4 };
      const checkArgs = checkSetup(
        '<meta id="target" name="refresh" content="3">',
        options
      );
      expect(metaRefreshCheck.apply(checkContext, checkArgs)).toBe(true);
    });

    it('ignores minDelay when set to false', function () {
      const options = { minDelay: false };
      const checkArgs = checkSetup(
        '<meta id="target" name="refresh" content="0">',
        options
      );
      expect(metaRefreshCheck.apply(checkContext, checkArgs)).toBe(false);
    });
  });

  describe('options.maxDelay', function () {
    it('returns true when the redirect number is greater than maxDelay', function () {
      const options = { maxDelay: 2 };
      const checkArgs = checkSetup(
        '<meta id="target" name="refresh" content="3">',
        options
      );
      expect(metaRefreshCheck.apply(checkContext, checkArgs)).toBe(true);
    });

    it('returns false when the redirect number equals maxDelay', function () {
      const options = { maxDelay: 3 };
      const checkArgs = checkSetup(
        '<meta id="target" name="refresh" content="3">',
        options
      );
      expect(metaRefreshCheck.apply(checkContext, checkArgs)).toBe(false);
    });

    it('returns false when the redirect number is less than maxDelay', function () {
      const options = { maxDelay: 4 };
      const checkArgs = checkSetup(
        '<meta id="target" name="refresh" content="3">',
        options
      );
      expect(metaRefreshCheck.apply(checkContext, checkArgs)).toBe(false);
    });

    it('ignores maxDelay when set to false', function () {
      const options = { maxDelay: false };
      const checkArgs = checkSetup(
        '<meta id="target" name="refresh" content="9999">',
        options
      );
      expect(metaRefreshCheck.apply(checkContext, checkArgs)).toBe(false);
    });
  });
});
