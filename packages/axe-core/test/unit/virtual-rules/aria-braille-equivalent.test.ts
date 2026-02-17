import { describe, it, expect, afterEach } from 'vitest';
import axe from '../../../dist/axe.js';

describe('aria-braille-equivalent virtual-rule', () => {
  afterEach(() => {
    axe.reset();
  });

  it('passes when aria-braillelabel is not empty', () => {
    const results = axe.runVirtualRule('aria-braille-equivalent', {
      nodeName: 'img',
      attributes: {
        alt: 'Hello world',
        'aria-braillelabel': 'Hello world'
      }
    });

    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('incompletes when accessible text is empty but braille label is not', () => {
    const results = axe.runVirtualRule('aria-braille-equivalent', {
      nodeName: 'img',
      attributes: {
        alt: '',
        'aria-braillelabel': 'hello world'
      }
    });

    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });

  it('passes when roledescription and brailleroledescription are not empty', () => {
    const results = axe.runVirtualRule('aria-braille-equivalent', {
      nodeName: 'div',
      attributes: {
        'aria-roledescription': 'Hello world',
        'aria-brailleroledescription': 'Hello world'
      }
    });

    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('incompletes when roledescription is empty but brailleroledescription is not', () => {
    const results = axe.runVirtualRule('aria-braille-equivalent', {
      nodeName: 'div',
      attributes: {
        'aria-roledescription': '',
        'aria-brailleroledescription': 'Hello world'
      }
    });

    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });

  it('incompletes if the subtree fails to compute with aria-braillelabel', () => {
    const results = axe.runVirtualRule('aria-braille-equivalent', {
      nodeName: 'button',
      attributes: {
        'aria-braillelabel': 'Hello world'
      }
    });

    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(1);
  });
});
