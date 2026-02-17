import { describe, it, expect } from 'vitest';
import axe from '../../../dist/axe.js';

describe('aria-valid-attr-value virtual-rule', function () {
  it('should pass for valid values', function () {
    const results = axe.runVirtualRule('aria-valid-attr-value', {
      nodeName: 'div',
      attributes: {
        role: 'slider',
        'aria-valuemin': 1,
        'aria-valuetext': '10',
        'aria-expanded': false,
        'aria-haspopup': 'grid',
        'aria-valuenow': 2.1
      }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail for invalid values', function () {
    const results = axe.runVirtualRule('aria-valid-attr-value', {
      nodeName: 'div',
      attributes: {
        role: 'slider',
        'aria-valuemin': true,
        'aria-expanded': 'grid',
        'aria-haspopup': 'Range',
        'aria-valuenow': false
      }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
    expect(results.violations[0].nodes[0].all[0].data).toHaveLength(4);
  });

  it('should only mark invalid values', function () {
    const results = axe.runVirtualRule('aria-valid-attr-value', {
      nodeName: 'div',
      attributes: {
        role: 'slider',
        'aria-valuemin': 0,
        'aria-valuetext': '10',
        'aria-expanded': 'grid',
        'aria-haspopup': 'Range',
        'aria-valuenow': false
      }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
    expect(results.violations[0].nodes[0].all[0].data).toHaveLength(3);
  });

  it('should incomplete for idref attributes', function () {
    const results = axe.runVirtualRule('aria-valid-attr-value', {
      nodeName: 'div',
      attributes: { role: 'slider', 'aria-labelledby': 'el1' }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });

  it('should pass for empty idref attributes', function () {
    const results = axe.runVirtualRule('aria-valid-attr-value', {
      nodeName: 'div',
      attributes: { role: 'slider', 'aria-labelledby': '' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });
});
