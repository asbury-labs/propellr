import { describe, it, expect } from 'vitest';

declare const checks: any;
describe('exists', function () {
  it('should return undefined', function () {
    expect(checks.exists.evaluate()).toBeUndefined();
  });
});
