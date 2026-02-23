import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('export', () => {
  it('should publish a global `axe` variable', () => {
    expect(window.axe).toBeDefined();
  });
  it('should define version', () => {
    expect(axe.version).not.toBeNull();
  });
});
