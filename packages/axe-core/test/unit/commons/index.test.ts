import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('axe.commons', function () {
  it('should export public api', function () {
    expect(axe.commons.aria).toBeDefined();
    expect(axe.commons.color).toBeDefined();
    expect(axe.commons.dom).toBeDefined();
    expect(axe.commons.forms).toBeDefined();
    expect(axe.commons.matches).toBeDefined();
    expect(axe.commons.standards).toBeDefined();
    expect(axe.commons.table).toBeDefined();
    expect(axe.commons.text).toBeDefined();
    expect(axe.commons.utils).toBeDefined();
  });
});
