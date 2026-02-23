import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('axe.utils.objectHasOwn', () => {
  const objectHasOwn = axe.utils.objectHasOwn;

  it('is true for an object with a property', () => {
    expect(objectHasOwn({ prop: true }, 'prop')).toBe(true);
  });

  it('is false for an object without a property', () => {
    expect(objectHasOwn({}, 'prop')).toBe(false);
  });

  it('is false for non-objects', () => {
    expect(objectHasOwn('string', 'prop')).toBe(false);
    expect(objectHasOwn(1, 'prop')).toBe(false);
    expect(objectHasOwn([], 'prop')).toBe(false);
    expect(objectHasOwn(null, 'prop')).toBe(false);
  });

  it('is false if the property comes from the prototype', () => {
    expect(objectHasOwn(Object.create({ prop: true }), 'prop')).toBe(false);
  });
});
