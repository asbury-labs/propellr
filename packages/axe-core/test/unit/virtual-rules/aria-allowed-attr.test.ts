import { describe, it, expect } from 'vitest';
import axe from '../../../dist/axe.js';

describe('aria-allowed-attr virtual-rule', function () {
  it('should pass for required attributes', function () {
    const results = axe.runVirtualRule('aria-allowed-attr', {
      nodeName: 'div',
      attributes: {
        role: 'checkbox',
        'aria-checked': true
      }
    });

    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should pass for allowed attributes', function () {
    const results = axe.runVirtualRule('aria-allowed-attr', {
      nodeName: 'div',
      attributes: {
        role: 'radio',
        'aria-required': true,
        'aria-checked': true
      }
    });

    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should pass for invalid attributes', function () {
    const results = axe.runVirtualRule('aria-allowed-attr', {
      nodeName: 'div',
      attributes: {
        role: 'dialog',
        'aria-cats': true
      }
    });

    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should pass for global attributes and element with no role', function () {
    const results = axe.runVirtualRule('aria-allowed-attr', {
      nodeName: 'div',
      attributes: {
        'aria-busy': true
      }
    });

    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail for non-global attributes and element with no role', function () {
    const results = axe.runVirtualRule('aria-allowed-attr', {
      nodeName: 'div',
      attributes: {
        'aria-checked': true
      }
    });

    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail for unallowed attributes', function () {
    const results = axe.runVirtualRule('aria-allowed-attr', {
      nodeName: 'div',
      attributes: {
        role: 'link',
        'aria-selected': true
      }
    });

    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail for unallowed attributes - implicit role', function () {
    const results = axe.runVirtualRule('aria-allowed-attr', {
      nodeName: 'a',
      attributes: {
        href: '#',
        'aria-selected': true
      }
    });

    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail for unsupported attributes', function () {
    axe.configure({
      standards: {
        ariaAttrs: {
          'aria-mccheddarton': {
            unsupported: true
          }
        }
      }
    });

    const results = axe.runVirtualRule('aria-allowed-attr', {
      nodeName: 'div',
      attributes: {
        role: 'checkbox',
        'aria-mccheddarton': true
      }
    });

    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should incomplete for non-global attributes and custom element', function () {
    const results = axe.runVirtualRule('aria-allowed-attr', {
      nodeName: 'custom-elm1',
      attributes: {
        'aria-checked': true
      }
    });

    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });
});
