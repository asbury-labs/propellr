import { describe, it, expect } from 'vitest';
import axe from '../../../dist/axe.js';

describe('valid-lang virtual-rule', function () {
  it('should pass for valid lang value', function () {
    const results = axe.runVirtualRule('valid-lang', {
      nodeName: 'div',
      attributes: { lang: 'en' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should pass for valid xml:lang value', function () {
    const results = axe.runVirtualRule('valid-lang', {
      nodeName: 'div',
      attributes: { 'xml:lang': 'en' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should pass for valid L10N lang value', function () {
    const results = axe.runVirtualRule('valid-lang', {
      nodeName: 'div',
      attributes: { lang: 'en-GB' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should pass for valid L10N xml:lang value', function () {
    const results = axe.runVirtualRule('valid-lang', {
      nodeName: 'div',
      attributes: { 'xml:lang': 'en-GB' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail for invalid lang value', function () {
    const results = axe.runVirtualRule('valid-lang', {
      nodeName: 'div',
      attributes: { lang: 'a' }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail for invalid L10N xml:lang value', function () {
    const results = axe.runVirtualRule('valid-lang', {
      nodeName: 'div',
      attributes: { 'xml:lang': 'a' }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should not apply for html element', function () {
    const results = axe.runVirtualRule('valid-lang', {
      nodeName: 'html',
      attributes: { 'xml:lang': 'a' }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
    expect(results.inapplicable).toHaveLength(1);
  });
});
