import { describe, it, expect } from 'vitest';
import axe from '../../../dist/axe.js';

describe('aria-required-attr virtual-rule', function () {
  it('should pass for required attributes', function () {
    const results = axe.runVirtualRule('aria-required-attr', {
      nodeName: 'div',
      attributes: { role: 'checkbox', 'aria-checked': true }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail for missing attributes', function () {
    const results = axe.runVirtualRule('aria-required-attr', {
      nodeName: 'div',
      attributes: { role: 'switch' }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
});
