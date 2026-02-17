import { describe, it, expect } from 'vitest';
import axe from '../../../dist/axe.js';

describe('area-alt virtual-rule', function () {
  it('should pass for aria-label', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'map'
    });
    const child = new axe.SerialVirtualNode({
      nodeName: 'area',
      attributes: {
        href: 'foobar',
        'aria-label': 'foobar'
      }
    });
    child.parent = node;
    node.children = [child];

    const results = axe.runVirtualRule('area-alt', node);

    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should incomplete for aria-labelledby', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'map'
    });
    const child = new axe.SerialVirtualNode({
      nodeName: 'area',
      attributes: {
        href: 'foobar',
        'aria-labelledby': 'foobar'
      }
    });
    child.parent = node;
    node.children = [child];

    const results = axe.runVirtualRule('area-alt', node);

    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });

  it('should pass for alt', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'map'
    });
    const child = new axe.SerialVirtualNode({
      nodeName: 'area',
      attributes: {
        href: 'foobar',
        alt: 'foobar'
      }
    });
    child.parent = node;
    node.children = [child];

    const results = axe.runVirtualRule('area-alt', node);

    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should pass for title', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'map'
    });
    const child = new axe.SerialVirtualNode({
      nodeName: 'area',
      attributes: {
        href: 'foobar',
        title: 'foobar'
      }
    });
    // children are required since titleText comes after subtree text
    // in accessible name calculation
    child.children = [];
    child.parent = node;
    node.children = [child];

    const results = axe.runVirtualRule('area-alt', node);

    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail when alt contains only whitespace', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'map'
    });
    const child = new axe.SerialVirtualNode({
      nodeName: 'area',
      attributes: {
        href: 'foobar',
        alt: ' \t   \n   '
      }
    });
    child.parent = node;
    node.children = [child];

    const results = axe.runVirtualRule('area-alt', node);

    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail when aria-label is empty', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'map'
    });
    const child = new axe.SerialVirtualNode({
      nodeName: 'area',
      attributes: {
        href: 'foobar',
        'aria-label': ''
      }
    });
    child.parent = node;
    node.children = [child];

    const results = axe.runVirtualRule('area-alt', node);

    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail when title is empty', function () {
    const node = new axe.SerialVirtualNode({
      nodeName: 'map'
    });
    const child = new axe.SerialVirtualNode({
      nodeName: 'area',
      attributes: {
        href: 'foobar',
        title: ''
      }
    });
    child.children = [];
    child.parent = node;
    node.children = [child];

    const results = axe.runVirtualRule('area-alt', node);

    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
});
