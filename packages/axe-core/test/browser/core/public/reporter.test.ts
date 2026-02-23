import { describe, it, expect, beforeAll, afterAll } from 'vitest';

declare const axe: any;
describe('axe.reporter', () => {
  const orig = {};
  beforeAll(() => {
    orig.reporters = window.reporters;
  });

  afterAll(() => {
    Object.keys(orig).forEach(k => {
      window[k] = orig[k];
    });
  });

  it('should add reporter with given name', () => {
    axe.addReporter('bob', 'joe');
    expect(axe.getReporter('bob')).toBe('joe');
  });

  it('returns false when reporter does not exist', () => {
    expect(axe.hasReporter('fancy-bob')).toBe(false);
  });

  it('returns true when reporter exists', () => {
    axe.addReporter('sponge');
    expect(axe.hasReporter('sponge')).toBe(true);
  });
});
