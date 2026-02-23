import { describe, it, expect, afterEach, afterAll } from 'vitest';
import {
  checkSetup,
  checks,
  getCheckEvaluate,
  MockCheckContext,
  shadowCheckSetup,
  shadowSupport
} from '../../../testutils';

declare const axe: any;
describe('page-has-*', function () {
  const fixture = document.getElementById('fixture')!;
  const checkContext = new MockCheckContext();
  const shadowSupported = shadowSupport.v1;

  afterEach(function () {
    fixture.innerHTML = '';
    checkContext.reset();
    axe._tree = undefined;
  });

  describe('evaluate', function () {
    const evaluate = getCheckEvaluate('page-has-main');

    it('throws if there is no selector', function () {
      expect(function () {
        const params = checkSetup('<div id="target">No role</div>', undefined);
        checks['page-has-main'].evaluate.apply(checkContext, params);
      }).toThrow();

      expect(function () {
        const params = checkSetup('<div id="target">No role</div>', {});
        checks['page-has-main'].evaluate.apply(checkContext, params);
      }).toThrow();

      expect(function () {
        const badOptions = { selector: [] };
        const params = checkSetup('<div id="target">No role</div>', badOptions);
        checks['page-has-main'].evaluate.apply(checkContext, params);
      }).toThrow();
    });

    it('returns true if there are any matching elements', function () {
      const options = { selector: 'b' };
      const params = checkSetup(
        '<div id="target"><b>No role</b></div>',
        options
      );
      expect(evaluate.apply(checkContext, params)).toBe(true);
    });

    it('returns false if there are no matching elements', function () {
      const options = { selector: 'i' };
      const params = checkSetup(
        '<div id="target"><b>No role</b></div>',
        options
      );
      expect(evaluate.apply(checkContext, params)).toBe(false);
    });

    it('does not find hidden elements', function () {
      const options = { selector: 'b' };
      const params = checkSetup(
        '<div id="target"><b style="display: none;">No role</b></div>',
        options
      );
      expect(evaluate.apply(checkContext, params)).toBe(false);
    });

    it('does find screen-reader only elements', function () {
      const options = { selector: 'b' };
      const params = checkSetup(
        '<style type="text/css">' +
          '.sr-only {' +
          'border: 0;' +
          'clip: rect(0 0 0 0);' +
          'clip-path: polygon(0px 0px, 0px 0px, 0px 0px);' +
          '-webkit-clip-path: polygon(0px 0px, 0px 0px, 0px 0px);' +
          'height: 1px;' +
          'margin: -1px;' +
          'overflow: hidden;' +
          'padding: 0;' +
          'position: absolute;' +
          'width: 1px;' +
          'white-space: nowrap;' +
          '}' +
          '</style>' +
          '<div id="target"><b class="sr-only">No role</b></div>',
        options
      );
      expect(evaluate.apply(checkContext, params)).toBe(true);
    });
  });

  describe('after', function () {
    const after = checks['page-has-main'].after;

    it('sets all results to true if any are true', function () {
      const results = [
        { result: true },
        { result: false },
        { result: undefined }
      ];
      expect(afterAll(results)).toEqual([
        { result: true },
        { result: true },
        { result: true }
      ]);
    });

    it('Leave the results as is if none of them were true', function () {
      const results = [
        { result: false },
        { result: false },
        { result: undefined }
      ];
      expect(afterAll(results)).toBe(results);
    });
  });

  describe('page-has-main', function () {
    const check = checks['page-has-main'];

    it('should return false if no div has role property', function () {
      const params = checkSetup(
        '<div id="target">No role</div>',
        check.options
      );
      const mainIsFound = check.evaluate.apply(checkContext, params);
      expect(mainIsFound).toBe(false);
    });

    it('should return false if div has role not equal to main', function () {
      const params = checkSetup(
        '<div id="target" role="bananas">Wrong role</div>',
        check.options
      );
      const mainIsFound = check.evaluate.apply(checkContext, params);
      expect(mainIsFound).toBe(false);
    });

    it('should return true if main landmark exists', function () {
      const params = checkSetup(
        '<main id="target">main landmark</main>',
        check.options
      );
      const mainIsFound = check.evaluate.apply(checkContext, params);
      expect(mainIsFound).toBe(true);
    });

    it('should return true if one div has role equal to main', function () {
      const params = checkSetup(
        '<div id="target" role="main">Div with role main</div>',
        check.options
      );
      const mainIsFound = check.evaluate.apply(checkContext, params);
      expect(mainIsFound).toBe(true);
    });

    (shadowSupported ? it : xit)(
      'should return true if main is inside of shadow dom',
      function () {
        const params = shadowCheckSetup(
          '<div id="target"></div>',
          '<main>main landmark</main>',
          check.options
        );
        const mainIsFound = check.evaluate.apply(checkContext, params);
        expect(mainIsFound).toBe(true);
      }
    );
  });

  describe('page-has-heading-one', function () {
    const check = checks['page-has-heading-one'];

    it('should return false if div has role not equal to heading', function () {
      const params = checkSetup(
        '<div id="target" role="bananas">Wrong role</div>',
        check.options
      );
      const h1IsFound = check.evaluate.apply(checkContext, params);
      expect(h1IsFound).toBe(false);
    });

    it('should return false if div has role heading but not aria-level=1', function () {
      const params = checkSetup(
        '<div id="target" role="heading" aria-level="one">Wrong role</div>',
        check.options
      );
      const h1IsFound = check.evaluate.apply(checkContext, params);
      expect(h1IsFound).toBe(false);
    });

    it('should return true if h1 exists', function () {
      const params = checkSetup(
        '<h1 id="target">My heading</h1>',
        check.options
      );
      const h1IsFound = check.evaluate.apply(checkContext, params);
      expect(h1IsFound).toBe(true);
    });

    it('should return true if a div has role=heading and aria-level=1', function () {
      const params = checkSetup(
        '<div id="target" role="heading" aria-level="1">Diversity heading</div>',
        check.options
      );
      const h1IsFound = check.evaluate.apply(checkContext, params);
      expect(h1IsFound).toBe(true);
    });

    (shadowSupported ? it : xit)(
      'should return true if h1 is inside of shadow dom',
      function () {
        const params = shadowCheckSetup(
          '<div id="target"></div>',
          '<h1>Shady Heading</h1>',
          check.options
        );
        const h1IsFound = check.evaluate.apply(checkContext, params);
        expect(h1IsFound).toBe(true);
      }
    );
  });
});
