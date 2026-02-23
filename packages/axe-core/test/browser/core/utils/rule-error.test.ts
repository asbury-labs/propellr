import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('utils.RuleError', () => {
  const RuleError = axe.utils.RuleError;

  it('returns a serializable error', () => {
    const error = new Error('test');
    const ruleError = new RuleError({ error });
    expect(ruleError).toMatchObject({
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  });

  it('returns a instanceof Error', () => {
    const error = new Error('test');
    const ruleError = new RuleError({ error });
    expect(ruleError).toBeInstanceOf(Error);
  });

  it('includes the ruleId if provided', () => {
    const error = new Error('test');
    const ruleError = new RuleError({ error, ruleId: 'aria' });
    expect(ruleError.ruleId).toBe('aria');
    expect(ruleError.message).toContain('Skipping aria rule.');
  });

  it('includes the method if provided', () => {
    const error = new Error('test');
    const ruleError = new RuleError({ error, method: '#matches' });
    expect(ruleError.method).toBe('#matches');
  });

  it('includes the errorNode if provided', () => {
    const error = new Error('test');
    const ruleError = new RuleError({ error, errorNode: 'err' });
    expect(ruleError.errorNode).toBe('err');
  });

  it('includes a serialized cause if provided', () => {
    const error = new Error('test');
    error.cause = new Error('cause');
    const ruleError = new RuleError({ error });
    expect(ruleError.cause).toEqual(axe.utils.serializeError(error.cause));
  });
});
