import { describe, it, expect } from 'vitest';

describe('index', () => {
  it('should redefine `define`', () => {
    expect(typeof define).toBe('undefined');
  });
  it('should redefine `require`', () => {
    expect(typeof require).toBe('undefined');
  });
});
