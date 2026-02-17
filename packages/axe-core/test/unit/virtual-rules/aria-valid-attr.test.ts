import { describe, it, expect } from 'vitest';
import axe from '../../../dist/axe.js';

describe('aria-valid-attr virtual-rule', function () {
  it('should pass for valid aria attrs', function () {
    const results = axe.runVirtualRule('aria-valid-attr', {
      nodeName: 'button',
      attributes: { 'aria-expanded': true, 'aria-label': 'Expand' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail for invalid aria attr', function () {
    const results = axe.runVirtualRule('aria-valid-attr', {
      nodeName: 'button',
      attributes: { 'aria-expanded': true, 'aria-undefined': 'Expand' }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should pass when configured to accept attribute names', function () {
    axe.configure({
      checks: [{ id: 'aria-valid-attr', options: ['aria-undefined'] }]
    });
    const results = axe.runVirtualRule('aria-valid-attr', {
      nodeName: 'button',
      attributes: { 'aria-expanded': true, 'aria-undefined': 'Expand' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
});
