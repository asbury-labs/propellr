import { describe, it, expect } from 'vitest';
import axe from '../../../dist/axe.js';

describe('aria-roledescription virtual-rule', function () {
  it('should pass for elements with an implicit supported role', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'button',
      attributes: { 'aria-roledescription': 'Awesome Button' }
    });
    const results = axe.runVirtualRule('aria-roledescription', node);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should pass for elements with an explicit supported role', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { 'aria-roledescription': 'Awesome Radio', role: 'radio' }
    });
    const results = axe.runVirtualRule('aria-roledescription', node);
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should incomplete for elements with an unsupported role', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { 'aria-roledescription': 'Awesome Main', role: 'main' }
    });
    const results = axe.runVirtualRule('aria-roledescription', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });

  it('should fail for elements without role', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { 'aria-roledescription': 'Awesome Main' }
    });
    const results = axe.runVirtualRule('aria-roledescription', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail for elements with role=presentation', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: {
        'aria-roledescription': 'Awesome Main',
        role: 'presentation'
      }
    });
    const results = axe.runVirtualRule('aria-roledescription', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail for elements with role=none', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: { 'aria-roledescription': 'Awesome Main', role: 'none' }
    });
    const results = axe.runVirtualRule('aria-roledescription', node);
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
});
