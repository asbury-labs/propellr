import { describe, it, expect } from 'vitest';
import axe from '../../../dist/axe.js';

describe('tabindex virtual-rule', function () {
  it('should pass for tabindex = 0', function () {
    const results = axe.runVirtualRule('tabindex', {
      nodeName: 'div',
      attributes: { tabindex: 0 }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should pass for tabindex = -1', function () {
    const results = axe.runVirtualRule('tabindex', {
      nodeName: 'div',
      attributes: { tabindex: -1 }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
  it('should fail for tabindex > 0', function () {
    const results = axe.runVirtualRule('tabindex', {
      nodeName: 'div',
      attributes: { tabindex: 1 }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
});
