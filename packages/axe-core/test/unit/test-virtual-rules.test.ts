/**
 * This file is a stub that verifies the virtual-rules test files exist
 * and are importable. The actual tests now live in test/unit/virtual-rules/*.test.ts
 * and are discovered automatically by Vitest.
 */
import { describe, it, expect } from 'vitest';
import { globSync } from 'glob';
import path from 'path';

describe('virtual-rule node tests', function () {
  it('should have virtual-rule test files', function () {
    const files = globSync(path.join(__dirname, 'virtual-rules/*.test.ts'));
    expect(files.length).toBeGreaterThan(0);
  });
});
