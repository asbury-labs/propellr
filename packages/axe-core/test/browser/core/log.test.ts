import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('axe.log', () => {
  it('should invoke console.log', () => {
    const orig = window.console;
    if (!window.console || window.console.log) {
      window.console = { log: () => {} };
    }
    const expected = ['hi', 'hello'];
    let success = false;

    window.console.log = function () {
      success = true;
      expect(arguments[0]).toBe(expected[0]);
      expect(arguments[1]).toBe(expected[1]);
    };

    axe.log.apply(axe.log, expected);
    expect(success).toBe(true);

    window.console = orig;
  });
});
