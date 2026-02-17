import { describe, it, expect } from 'vitest';
import axe from '../../../dist/axe.js';

describe('presentation-role-conflict virtual-rule', function () {
  it('fails img[alt=""] with aria-label', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'img',
      attributes: { alt: '', 'aria-label': 'foobar' }
    });
    const results = axe.runVirtualRule('presentation-role-conflict', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail when role is presentation and aria-label is present', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'li',
      attributes: { role: 'presentation', 'aria-label': 'foobar' }
    });
    const results = axe.runVirtualRule('presentation-role-conflict', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail when role is none and aria-label is present', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'li',
      attributes: { role: 'none', 'aria-label': 'foobar' }
    });
    const results = axe.runVirtualRule('presentation-role-conflict', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should be inapplicable when explicit role is presentation for element without conflict', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'presentation' }
    });
    const results = axe.runVirtualRule('presentation-role-conflict', node);
    expect(results.inapplicable).toHaveLength(1);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should be inapplicable when explicit role is none for element without conflict', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { role: 'none' }
    });
    const results = axe.runVirtualRule('presentation-role-conflict', node);
    expect(results.inapplicable).toHaveLength(1);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should pass for element with implicit role in chromium', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'svg',
      attributes: { role: 'presentation' }
    });
    const results = axe.runVirtualRule('presentation-role-conflict', node);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail if element has native focusability', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'a',
      attributes: { role: 'presentation', href: '#' }
    });
    const results = axe.runVirtualRule('presentation-role-conflict', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should pass if element has native focusability but is disabled', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'button',
      attributes: { role: 'presentation', disabled: 'disabled' }
    });
    const results = axe.runVirtualRule('presentation-role-conflict', node);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail if element is focusable with tabIndex', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'svg',
      attributes: { role: 'presentation', tabindex: 1 }
    });
    const results = axe.runVirtualRule('presentation-role-conflict', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
});
