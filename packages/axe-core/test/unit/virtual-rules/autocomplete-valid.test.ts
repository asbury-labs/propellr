import { describe, it, expect } from 'vitest';
import axe from '../../../dist/axe.js';

describe('autocomplete-valid virtual-rule', function () {
  it('should pass when autocomplete is valid', function () {
    const results = axe.runVirtualRule('autocomplete-valid', {
      nodeName: 'input',
      attributes: { type: 'text', autocomplete: 'country-name' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should pass when autocomplete is correctly used', function () {
    const results = axe.runVirtualRule('autocomplete-valid', {
      nodeName: 'input',
      attributes: { type: 'text', autocomplete: 'email' }
    });
    expect(results.passes).toHaveLength(1);
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete).toHaveLength(0);
  });

  it('should fail autocomplete is not valid', function () {
    const results = axe.runVirtualRule('autocomplete-valid', {
      nodeName: 'input',
      attributes: { type: 'text', autocomplete: 'foobar' }
    });
    expect(results.passes).toHaveLength(0);
    expect(results.violations).toHaveLength(1);
    expect(results.incomplete).toHaveLength(0);
  });
});
