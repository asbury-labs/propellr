import { describe, it, expect } from 'vitest';
import axe from '../../../dist/axe.js';

describe('image-alt virtual-rule', function () {
  it('should pass for alt', function () {
    const results = axe.runVirtualRule('image-alt', {
      nodeName: 'img',
      attributes: { alt: 'foobar' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should pass for empty alt', function () {
    const results = axe.runVirtualRule('image-alt', {
      nodeName: 'img',
      attributes: { alt: '' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should pass for aria-label', function () {
    const results = axe.runVirtualRule('image-alt', {
      nodeName: 'img',
      attributes: { 'aria-label': 'foobar' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should incomplete for aria-labelledby', function () {
    const results = axe.runVirtualRule('image-alt', {
      nodeName: 'img',
      attributes: { 'aria-labelledby': 'foobar' }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });
  it('should pass for title', function () {
    const results = axe.runVirtualRule('image-alt', {
      nodeName: 'img',
      attributes: { title: 'foobar' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should pass for role=presentation', function () {
    const results = axe.runVirtualRule('image-alt', {
      nodeName: 'img',
      attributes: { role: 'presentation' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should pass for role=none', function () {
    const results = axe.runVirtualRule('image-alt', {
      nodeName: 'img',
      attributes: { role: 'none' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail when alt is missing', function () {
    const results = axe.runVirtualRule('image-alt', {
      nodeName: 'img',
      attributes: {}
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail when alt contains only whitespace', function () {
    const results = axe.runVirtualRule('image-alt', {
      nodeName: 'img',
      attributes: { alt: ' \t   \n   ' }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail when aria-label is empty', function () {
    const results = axe.runVirtualRule('image-alt', {
      nodeName: 'img',
      attributes: { 'aria-label': '' }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail when title is empty', function () {
    const results = axe.runVirtualRule('image-alt', {
      nodeName: 'img',
      attributes: { title: '' }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
});
