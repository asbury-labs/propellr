import { describe, it, expect, afterEach } from 'vitest';
import axe from '../../../dist/axe.js';

describe('aria-allowed-role virtual-rule', function () {
  afterEach(function () {
    axe.reset();
  });

  it('should pass for allowed role', function () {
    const results = axe.runVirtualRule('aria-allowed-role', {
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

  it('should fail for unallowed role', function () {
    const results = axe.runVirtualRule('aria-allowed-role', {
      nodeName: 'dd',
      attributes: {
        role: 'link'
      }
    });

    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should pass for element with ignored option', function () {
    axe.configure({
      checks: [
        {
          id: 'aria-allowed-role',
          options: {
            ignoredTags: ['dd']
          }
        }
      ]
    });

    const results = axe.runVirtualRule('aria-allowed-role', {
      nodeName: 'dd',
      attributes: {
        role: 'link'
      }
    });

    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should incomplete for hidden element', function () {
    const results = axe.runVirtualRule('aria-allowed-role', {
      nodeName: 'dd',
      attributes: {
        'aria-hidden': true,
        role: 'link'
      }
    });

    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });

  it('should incomplete for hidden element parent', function () {
    const vNode = new axe.SerialVirtualNode({
      nodeName: 'dd',
      attributes: {
        role: 'link'
      }
    });
    const parent = new axe.SerialVirtualNode({
      nodeName: 'div',
      attributes: {
        'aria-hidden': true
      }
    });
    parent.children = [vNode];
    vNode.parent = parent;

    const results = axe.runVirtualRule('aria-allowed-role', vNode);

    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });
});
