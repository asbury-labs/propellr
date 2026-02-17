import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
describe('performance timer', () => {
  const { performanceTimer } = axe.utils;
  const originalLog = performanceTimer._log;
  let messages = [];
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  // Browser sleeps can slop a bit (in either direction) to sync with other work on the main thread.
  const ANIMATION_FRAME_TOLERANCE_MS = 17; // Math.ceil(time per frame at 60Hz)

  const getNumber = msg => {
    const match = msg.match(/([0-9.]+)ms/);
    return match ? parseFloat(match[1]) : 0;
  };

  beforeEach(() => {
    performanceTimer._log = msg => {
      messages.push(msg);
    };
  });

  afterEach(async () => {
    try {
      performanceTimer.end();
    } catch {
      // ignore - performanceTimer.end() was called in a test instead
    }
    try {
      performanceTimer.auditEnd();
    } catch {
      // ignore - performanceTimer.auditEnd() was called in a test instead
    }
    performanceTimer._log = originalLog;
    messages = [];
    // Force a next tick in the test to avoid flakiness
    await sleep(0);
  });

  it('warns using performanceTimer before axe started', () => {
    performanceTimer.mark('foo_start');
    performanceTimer.mark('foo_end');
    performanceTimer.measure('foo', 'foo_start', 'foo_end');
    performanceTimer.logMeasures('foo');
    expect(messages.length).toBe(1);
    expect(messages[0]).toMatch(
      /Axe must be started before using performanceTimer/
    );
  });

  it('measures time elapsed between marks', async () => {
    performanceTimer.start();

    const timestampPreMarkStart = performance.now();
    performanceTimer.mark('foo_start');
    const timestampPostMarkStart = performance.now();

    await sleep(100);

    const timestampPreMarkEnd = performance.now();
    performanceTimer.mark('foo_end');
    const timestampPostMarkEnd = performance.now();

    performanceTimer.measure('foo', 'foo_start', 'foo_end');
    performanceTimer.logMeasures('foo');

    expect(messages.length).toBe(1);
    const actual = getNumber(messages[0]);

    expect(actual).toBeGreaterThanOrEqual(100 - ANIMATION_FRAME_TOLERANCE_MS);

    // The actual value might be significantly >100ms in a browser, especially on a
    // CI agent with a slow CPU, but should be consistent with performance.now()
    const maxExpected = timestampPostMarkEnd - timestampPreMarkStart;
    const minExpected = timestampPreMarkEnd - timestampPostMarkStart;
    expect(actual).toBeGreaterThanOrEqual(minExpected);
    expect(actual).toBeLessThanOrEqual(maxExpected);
  });

  it('measures time elapsed if auditStart() was called', () => {
    performanceTimer.auditStart();
    performanceTimer.mark('foo_start');
    performanceTimer.mark('foo_end');
    performanceTimer.measure('foo', 'foo_start', 'foo_end');
    performanceTimer.logMeasures('foo');

    expect(messages.length).toBe(1);
    expect(messages[0]).toMatch(/Measure foo took [0-9.]+ms/);
  });

  it('measures the time axe takes from .start() to .end()', () => {
    performanceTimer.start();
    performanceTimer.end();
    expect(messages.length).toBe(1);
    expect(messages[0]).toMatch(/Measure axe took [0-9.]+ms/);
  });

  it('measures the time axe takes from .auditStart() to .auditEnd()', () => {
    performanceTimer.auditStart();
    performanceTimer.auditEnd();
    expect(messages.length).toBe(1);
    expect(messages[0]).toMatch(/Measure audit_start_to_end took [0-9.]+ms/);
  });

  describe('.measure', () => {
    it('logs an error if the start mark is not present', () => {
      performanceTimer.mark('foo_end');
      performanceTimer.measure('foo', 'foo_start', 'foo_end');
      expect(messages.length).toBe(1);
      // non-specific message, Firefox has a different message from Chromium
      expect(messages[0]).toMatch(/foo_start/);
    });

    it('logs an error if the end mark is not present', () => {
      performanceTimer.mark('foo_start');
      performanceTimer.measure('foo', 'foo_start', 'foo_end');
      expect(messages.length).toBe(1);
      // non-specific message, Firefox has a different message from Chromium
      expect(messages[0]).toMatch(/foo_end/);
    });
  });

  describe('logMeasures', () => {
    beforeEach(() => {
      performanceTimer.start();
    });

    it('logs a specific measure when provided', () => {
      performanceTimer.mark('foo_start');
      performanceTimer.mark('foo_end');
      performanceTimer.measure('foo', 'foo_start', 'foo_end');

      performanceTimer.mark('bar_start');
      performanceTimer.mark('bar_end');
      performanceTimer.measure('bar', 'bar_start', 'bar_end');

      // Mot measured, should not show up
      performanceTimer.mark('baz_start');
      performanceTimer.mark('baz_end');

      performanceTimer.logMeasures('foo');
      expect(messages.length).toBe(1);
      expect(messages[0]).toMatch(/Measure foo took [0-9.]+ms/);
    });

    it('logs all measures if no measure name is provided', () => {
      performanceTimer.mark('foo_start');
      performanceTimer.mark('foo_end');
      performanceTimer.measure('foo', 'foo_start', 'foo_end');

      performanceTimer.mark('bar_start');
      performanceTimer.mark('bar_end');
      performanceTimer.measure('bar', 'bar_start', 'bar_end');

      // Mot measured, should not show up
      performanceTimer.mark('baz_start');
      performanceTimer.mark('baz_end');

      performanceTimer.logMeasures();
      expect(messages.length).toBe(2);
      expect(messages[0]).toMatch(/Measure foo took [0-9.]+ms/);
      expect(messages[1]).toMatch(/Measure bar took [0-9.]+ms/);
    });
  });

  describe('timeElapsed', () => {
    it('returns the time elapsed since axe started', async () => {
      const timestampPreStart = performance.now();
      performanceTimer.start();
      const timestampPostStart = performance.now();

      await sleep(100);

      const timestampPreTimeElapsed = performance.now();
      const actual = performanceTimer.timeElapsed();
      const timestampPostTimeElapsed = performance.now();

      expect(actual).toBeGreaterThanOrEqual(100 - ANIMATION_FRAME_TOLERANCE_MS);
      const maxExpected = timestampPostTimeElapsed - timestampPreStart;
      const minExpected = timestampPreTimeElapsed - timestampPostStart;
      expect(actual).toBeGreaterThanOrEqual(minExpected);
      expect(actual).toBeLessThanOrEqual(maxExpected);
    });

    it('returns the time elapsed since auditStart() was called', async () => {
      const timestampPreStart = performance.now();
      performanceTimer.auditStart();
      const timestampPostStart = performance.now();

      await sleep(100);

      const timestampPreTimeElapsed = performance.now();
      const actual = performanceTimer.timeElapsed();
      const timestampPostTimeElapsed = performance.now();

      expect(actual).toBeGreaterThanOrEqual(100 - ANIMATION_FRAME_TOLERANCE_MS);
      const maxExpected = timestampPostTimeElapsed - timestampPreStart;
      const minExpected = timestampPreTimeElapsed - timestampPostStart;
      expect(actual).toBeGreaterThanOrEqual(minExpected);
      expect(actual).toBeLessThanOrEqual(maxExpected);
    });

    it('does not use auditStart if axe started', async () => {
      const timestampPreStart = performance.now();
      performanceTimer.start();
      const timestampPostStart = performance.now();

      await sleep(100);
      performanceTimer.auditStart(); // Should be ignored

      const timestampPreTimeElapsed = performance.now();
      const actual = performanceTimer.timeElapsed();
      const timestampPostTimeElapsed = performance.now();

      expect(actual).toBeGreaterThanOrEqual(100 - ANIMATION_FRAME_TOLERANCE_MS);
      const maxExpected = timestampPostTimeElapsed - timestampPreStart;
      const minExpected = timestampPreTimeElapsed - timestampPostStart;
      expect(actual).toBeGreaterThanOrEqual(minExpected);
      expect(actual).toBeLessThanOrEqual(maxExpected);
    });
  });
});
