import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('CheckResult', () => {
  const CheckResult = axe._thisWillBeDeletedDoNotUse.base.CheckResult;
  it('should have an id', () => {
    let result = new CheckResult({ id: 'monkeys' });
    expect(result.id).toBe('monkeys');
  });

  it('should set `data` to `null`', () => {
    let result = new CheckResult({});
    expect(result.data).toBeNull();
  });

  it('should set `relatedNodes` to `[]`', () => {
    let result = new CheckResult({});
    expect(result.relatedNodes).toEqual([]);
  });

  it('should set `result` to `null`', () => {
    let result = new CheckResult({});
    expect(result.result).toBeNull();
  });
});
