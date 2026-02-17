import { describe, it, expect } from 'vitest';
import axe from '../../../dist/axe.js';

describe('html-has-lang virtual-rule', function () {
  it('should pass for lang', function () {
    const results = axe.runVirtualRule('html-has-lang', {
      nodeName: 'html',
      attributes: { lang: 'en' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should pass for lang and xml:lang', function () {
    const results = axe.runVirtualRule('html-has-lang', {
      nodeName: 'html',
      attributes: { lang: 'en', 'xml:lang': 'en' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail for missing lang', function () {
    const results = axe.runVirtualRule('html-has-lang', { nodeName: 'html' });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail for just xml:lang', function () {
    const results = axe.runVirtualRule('html-has-lang', {
      nodeName: 'html',
      attributes: { 'xml:lang': 'en' }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
});
