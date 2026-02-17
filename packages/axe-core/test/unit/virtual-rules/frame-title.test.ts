import { describe, it, expect } from 'vitest';
import axe from '../../../dist/axe.js';

describe('frame-title virtual-rule', function () {
  it('should pass for aria-label', function () {
    const results = axe.runVirtualRule('frame-title', {
      nodeName: 'iframe',
      attributes: { 'aria-label': 'foobar' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should incomplete for aria-labelledby', function () {
    const results = axe.runVirtualRule('frame-title', {
      nodeName: 'iframe',
      attributes: { 'aria-labelledby': 'foobar' }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });

  it('should pass for title', function () {
    const results = axe.runVirtualRule('frame-title', {
      nodeName: 'iframe',
      attributes: { title: 'foobar' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should pass for role=presentation', function () {
    const results = axe.runVirtualRule('frame-title', {
      nodeName: 'iframe',
      attributes: { role: 'presentation' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should pass for role=none', function () {
    const results = axe.runVirtualRule('frame-title', {
      nodeName: 'iframe',
      attributes: { role: 'none' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail when aria-label is empty', function () {
    const results = axe.runVirtualRule('frame-title', {
      nodeName: 'iframe',
      attributes: { 'aria-label': '' }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail when title is empty', function () {
    const results = axe.runVirtualRule('frame-title', {
      nodeName: 'iframe',
      attributes: { title: '' }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail for role=presentation and title', function () {
    const results = axe.runVirtualRule('frame-title', {
      nodeName: 'iframe',
      attributes: { role: 'presentation', title: '' }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail for role=none and title', function () {
    const results = axe.runVirtualRule('frame-title', {
      nodeName: 'iframe',
      attributes: { role: 'none', title: '' }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
});
