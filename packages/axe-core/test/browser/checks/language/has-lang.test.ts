import { describe, it, expect, afterEach } from 'vitest';
import {
  checkSetup,
  getCheckEvaluate,
  MockCheckContext
} from '../../../testutils';

declare const axe: any;
describe('has-lang', function () {
  const fixture = document.getElementById('fixture')!;
  const checkContext = MockCheckContext();
  const hasLangEvaluate = getCheckEvaluate('has-lang');

  afterEach(function () {
    fixture.innerHTML = '';
    checkContext.reset();
  });

  it('should return true if a lang attribute is present', function () {
    const params = checkSetup('<div id="target" lang="woohoo"></div>');

    expect(hasLangEvaluate.apply(checkContext, params)).toBe(true);
  });

  it('should return false if only `xml:lang` attribute is present', function () {
    const params = checkSetup('<div id="target" xml:lang="cats"></div>');

    expect(hasLangEvaluate.apply(checkContext, params)).toBe(false);
    expect(checkContext._data.messageKey).toBe('noXHTML');
  });

  it('should return true if both `lang` and `xml:lang` attribute is present', function () {
    const params = checkSetup(
      '<div id="target" lang="cats" xml:lang="cats"></div>'
    );

    expect(hasLangEvaluate.apply(checkContext, params)).toBe(true);
  });

  it('should return false if xml:lang and lang attributes are not present', function () {
    const params = checkSetup('<div id="target"></div>');

    expect(hasLangEvaluate.apply(checkContext, params)).toBe(false);
    expect(checkContext._data.messageKey).toBe('noLang');
  });

  it('should return false if lang is left empty', function () {
    const params = checkSetup('<div id="target" lang=""></div>');

    expect(hasLangEvaluate.apply(checkContext, params)).toBe(false);
    expect(checkContext._data.messageKey).toBe('noLang');
  });

  it('should support options.attributes', function () {
    const params = checkSetup('<div id="target" foo="cats"></div>', {
      attributes: ['foo']
    });

    expect(hasLangEvaluate.apply(checkContext, params)).toBe(true);
  });
});
