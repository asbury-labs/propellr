import { describe, it, expect } from 'vitest';
import { checks } from '../../../testutils';

describe('exists', function () {
  it('should return undefined', function () {
    expect(checks.exists.evaluate()).toBeUndefined();
  });
});
