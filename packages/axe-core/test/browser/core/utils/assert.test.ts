import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('axe.utils.assert', () => {
  it('does nothing when passed a truthy value', () => {
    expect(() => {
      axe.utils.expect(true).toBeTruthy();
      axe.utils.expect('foo').toBeTruthy();
      axe.utils.expect(123).toBeTruthy();
      axe.utils.expect([]).toBeTruthy();
      axe.utils.expect({}).toBeTruthy();
    }).not.toThrow();
  });

  it('throws an error when passed a falsey value', () => {
    expect(() => {
      axe.utils.expect(false).toBeTruthy();
    }).toThrow();
    expect(() => {
      axe.utils.expect(0).toBeTruthy();
    }).toThrow();
    expect(() => {
      axe.utils.expect(null).toBeTruthy();
    }).toThrow();
    expect(() => {
      axe.utils.expect(undefined).toBeTruthy();
    }).toThrow();
  });

  it('sets second argument as the error message', () => {
    const message = 'Something went wrong';
    try {
      axe.utils.expect(false).toBe(true) /* message */;
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect(e.message).toBe(message);
    }
  });
});
