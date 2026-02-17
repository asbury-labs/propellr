import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('axe.utils.getStandards', () => {
  it('returns the standards object', () => {
    const standards = axe.utils.getStandards();
    ['ariaAttrs', 'ariaRoles', 'htmlElms', 'cssColors'].forEach(k =>
      expect(standards).toHaveProperty(k)
    );
  });
});
