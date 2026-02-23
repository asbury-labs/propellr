import { describe, it, afterEach, expect } from 'vitest';

declare const axe: any;
describe('aria.validateAttr', function () {
  afterEach(function () {
    axe.reset();
  });

  it('should return true if attribute is found in lut', function () {
    axe.configure({
      standards: {
        ariaAttrs: {
          cats: {}
        }
      }
    });

    expect(axe.commons.aria.validateAttr('cats')).toBe(true);
  });

  it('should return false if attribute is found in lut', function () {
    expect(axe.commons.aria.validateAttr('cats')).toBe(false);
  });
});
