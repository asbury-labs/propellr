import { describe, it, expect } from 'vitest';
import axe from '../../../dist/axe.js';

describe('aria-roles virtual-rule', function () {
  it('should pass for valid role', function () {
    const results = axe.runVirtualRule('aria-roles', {
      nodeName: 'div',
      attributes: { role: 'alert' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail for abstract role', function () {
    const results = axe.runVirtualRule('aria-roles', {
      nodeName: 'div',
      attributes: { role: 'command' }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail for invalid role', function () {
    const results = axe.runVirtualRule('aria-roles', {
      nodeName: 'div',
      attributes: { role: 'foobar' }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should pass for fallback role', function () {
    const results = axe.runVirtualRule('aria-roles', {
      nodeName: 'div',
      attributes: { role: 'presentation none' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail for unsupported role', function () {
    axe.configure({
      standards: { ariaRoles: { alert: { unsupported: true } } }
    });
    const results = axe.runVirtualRule('aria-roles', {
      nodeName: 'div',
      attributes: { role: 'alert' }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
});
