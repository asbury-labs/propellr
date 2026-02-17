import { describe, it, expect } from 'vitest';
import axe from '../../../dist/axe.js';

describe('meta-viewport virtual-rule', function () {
  it('should pass for missing user-scalable', function () {
    const results = axe.runVirtualRule('meta-viewport', {
      nodeName: 'meta',
      attributes: { name: 'viewport', content: 'foo=bar' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should pass for user-scalable=yes', function () {
    const results = axe.runVirtualRule('meta-viewport', {
      nodeName: 'meta',
      attributes: { name: 'viewport', content: 'user-scalable=yes' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should pass comma-separated list', function () {
    const results = axe.runVirtualRule('meta-viewport', {
      nodeName: 'meta',
      attributes: { name: 'viewport', content: 'foo=bar, user-scalable=yes' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should pass semicolon-separated list', function () {
    const results = axe.runVirtualRule('meta-viewport', {
      nodeName: 'meta',
      attributes: { name: 'viewport', content: 'foo=bar; user-scalable=yes' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail for user-scalable=no', function () {
    const results = axe.runVirtualRule('meta-viewport', {
      nodeName: 'meta',
      attributes: { name: 'viewport', content: 'user-scalable=no' }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail for user-scalable=0', function () {
    const results = axe.runVirtualRule('meta-viewport', {
      nodeName: 'meta',
      attributes: { name: 'viewport', content: 'user-scalable=0' }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail for maximum-scale=yes', function () {
    const results = axe.runVirtualRule('meta-viewport', {
      nodeName: 'meta',
      attributes: { name: 'viewport', content: 'maximum-scale=yes' }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
});
