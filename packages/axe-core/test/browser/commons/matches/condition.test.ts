import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('matches.condition', function () {
  const condition = axe.commons.matches.condition;

  it('passes the first argument to the condition', function () {
    let count = 0;
    condition('foo', function (foo) {
      expect('foo').toBe(foo);
      count++;
    });
    expect(count).toBe(1);
  });

  it('returns true if the condition returns a truthy value', function () {
    expect(
      condition('foo', function () {
        return 123;
      })
    ).toBe(true);
  });

  it('returns false if the condition returns a falsey value', function () {
    expect(
      condition('foo', function () {
        return 0;
      })
    ).toBe(false);
  });
});
