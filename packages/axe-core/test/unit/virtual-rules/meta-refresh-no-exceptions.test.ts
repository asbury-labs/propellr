import { describe, it, expect } from 'vitest';
import axe from '../../../dist/axe.js';

describe('meta-refresh-no-exceptions virtual-rule', function () {
  it('should be inapplicable for missing content', function () {
    const results = axe.runVirtualRule('meta-refresh-no-exceptions', {
      nodeName: 'meta',
      attributes: { 'http-equiv': 'refresh' }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
    expect(results.inapplicable).toHaveLength(1);
  });
  it('should pass for content=0', function () {
    const results = axe.runVirtualRule('meta-refresh-no-exceptions', {
      nodeName: 'meta',
      attributes: { 'http-equiv': 'refresh', content: '0' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should pass for content=0 and url', function () {
    const results = axe.runVirtualRule('meta-refresh-no-exceptions', {
      nodeName: 'meta',
      attributes: {
        'http-equiv': 'refresh',
        content: '0;url=http://example.com/'
      }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should pass for content equal to 72000', function () {
    const results = axe.runVirtualRule('meta-refresh-no-exceptions', {
      nodeName: 'meta',
      attributes: { 'http-equiv': 'refresh', content: '72000' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail for content other greater than 72000', function () {
    const results = axe.runVirtualRule('meta-refresh-no-exceptions', {
      nodeName: 'meta',
      attributes: { 'http-equiv': 'refresh', content: '72001' }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail for content other than 0 and url', function () {
    const results = axe.runVirtualRule('meta-refresh-no-exceptions', {
      nodeName: 'meta',
      attributes: {
        'http-equiv': 'refresh',
        content: '72001;url=http://example.com/'
      }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
});
