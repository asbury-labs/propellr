import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('RuleResult', () => {
  const RuleResult = axe._thisWillBeDeletedDoNotUse.base.RuleResult;

  it('should have an empty array for nodes', () => {
    expect(new RuleResult({ id: 'monkeys' }).nodes).toEqual([]);
  });

  it('should grab id from passed in rule', () => {
    const result = new RuleResult({ id: 'monkeys' });
    expect(result.id).toBe('monkeys');
  });
});
