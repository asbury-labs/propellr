import { describe, it, expect } from 'vitest';
import axe from '../../../dist/axe.js';

describe('html-lang-valid virtual-rule', function () {
  it('is inapplicable without lang or xml:lang', function () {
    const results = axe.runVirtualRule('html-lang-valid', {
      nodeName: 'html',
      attributes: {}
    });
    expect(results.inapplicable).toHaveLength(1);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('is inapplicable with empty lang or xml:lang', function () {
    const results = axe.runVirtualRule('html-lang-valid', {
      nodeName: 'html',
      attributes: { lang: '' }
    });
    expect(results.inapplicable).toHaveLength(1);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should pass with a valid lang', function () {
    const results = axe.runVirtualRule('html-lang-valid', {
      nodeName: 'html',
      attributes: { lang: 'en' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should pass with a valid xml:lang', function () {
    const results = axe.runVirtualRule('html-lang-valid', {
      nodeName: 'html',
      attributes: { 'xml:lang': 'en' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should pass for both lang and xml:lang', function () {
    const results = axe.runVirtualRule('html-lang-valid', {
      nodeName: 'html',
      attributes: { lang: 'en', 'xml:lang': 'en' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail with an invalid lang', function () {
    const results = axe.runVirtualRule('html-lang-valid', {
      nodeName: 'html',
      attributes: { lang: 'invalid' }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail with an invalid xml:lang', function () {
    const results = axe.runVirtualRule('html-lang-valid', {
      nodeName: 'html',
      attributes: { 'xml:lang': 'invalid' }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail with an invalid lang, and explicitly no children', function () {
    const html = new axe.SerialVirtualNode({
      nodeName: 'html',
      attributes: { lang: 'invalid' }
    });
    html.children = [];
    const results = axe.runVirtualRule('html-lang-valid', html);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
});
