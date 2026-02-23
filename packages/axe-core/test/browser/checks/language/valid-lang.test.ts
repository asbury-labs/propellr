import { describe, it, expect, afterEach } from 'vitest';
import {
  checkSetup,
  getCheckEvaluate,
  MockCheckContext
} from '../../../testutils';

declare const axe: any;
describe('valid-lang', function () {
  const fixture = document.getElementById('fixture')!;
  const checkContext = MockCheckContext();
  const validLangEvaluate = getCheckEvaluate('valid-lang');

  afterEach(function () {
    fixture.innerHTML = '';
    checkContext.reset();
  });

  it('should return false if a lang attribute is present in options', function () {
    const params = checkSetup('<div id="target" lang="woohoo">text</div>', {
      value: ['blah', 'blah', 'woohoo']
    });

    expect(validLangEvaluate.apply(checkContext, params)).toBe(false);
  });

  it('should lowercase options and attribute first', function () {
    const params = checkSetup('<div id="target" lang="wooHOo">text</div>', {
      value: ['blah', 'blah', 'wOohoo']
    });

    expect(validLangEvaluate.apply(checkContext, params)).toBe(false);
  });

  it('should return true if a lang attribute is not present in options', function () {
    const params = checkSetup('<div id="target" lang="FOO">text</div>');

    expect(validLangEvaluate.apply(checkContext, params)).toBe(true);
    expect(checkContext._data).toEqual(['lang="FOO"']);
  });

  it('should return false (and not throw) when given no present in options', function () {
    const params = checkSetup('<div id="target" lang="en">text</div>');

    expect(validLangEvaluate.apply(checkContext, params)).toBe(false);
  });

  it('should return true if the language is badly formatted', function () {
    const params = checkSetup('<div id="target" lang="en_US">text</div>');

    expect(validLangEvaluate.apply(checkContext, params)).toBe(true);
    expect(checkContext._data).toEqual(['lang="en_US"']);
  });

  it('should return false if it matches a substring proceeded by -', function () {
    const params = checkSetup('<div id="target" lang="en-LOL">text</div>');

    expect(validLangEvaluate.apply(checkContext, params)).toBe(false);
  });

  it('should work with xml:lang', function () {
    const params = checkSetup('<div id="target" xml:lang="en-LOL">text</div>');

    expect(validLangEvaluate.apply(checkContext, params)).toBe(false);
  });

  it('should accept options.attributes', function () {
    const params = checkSetup(
      '<div id="target" custom-lang="en_US">text</div>',
      {
        attributes: ['custom-lang']
      }
    );

    expect(validLangEvaluate.apply(checkContext, params)).toBe(true);
    expect(checkContext._data).toEqual(['custom-lang="en_US"']);
  });

  it('should return true if lang value is just whitespace', function () {
    const params = checkSetup('<div id="target" lang="  ">text</div>');

    expect(validLangEvaluate.apply(checkContext, params)).toBe(true);
  });

  it('should return false if a lang attribute element has no content', function () {
    const params = checkSetup('<div id="target" lang="FOO"></div>');

    expect(validLangEvaluate.apply(checkContext, params)).toBe(false);
    expect(checkContext._data).toEqual(null);
  });
});
