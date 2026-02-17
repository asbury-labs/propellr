import { describe, it, expect, afterEach, afterAll } from 'vitest';

declare const axe: any;
declare const checks: any;
describe('region-after', function () {
  const checkContext = axe.testUtils.MockCheckContext();

  afterEach(function () {
    checkContext.reset();
  });

  it('should always pass iframes', function () {
    const results = checks.region.afterAll([
      {
        data: { isIframe: true },
        node: {
          ancestry: ['html > body > iframe']
        },
        result: false
      },
      {
        data: { isIframe: false },
        node: {
          ancestry: ['html > body > iframe', 'html > body > p']
        },
        result: false
      }
    ]);
    expect(results[0].result).toBe(true);
    expect(results[1].result).toBe(false);
  });

  it('should pass children of iframes if the iframe contained in it is in a region', function () {
    const results = checks.region.afterAll([
      {
        data: { isIframe: true },
        node: {
          ancestry: ['html > body > iframe']
        },
        result: true
      },
      {
        data: { isIframe: false },
        node: {
          ancestry: ['html > body > iframe', 'html > body > p']
        },
        result: false
      }
    ]);

    expect(results[0].result).toBe(true);
    expect(results[1].result).toBe(true);
  });

  it('should pass nested iframes', function () {
    const results = checks.region.afterAll([
      {
        data: { isIframe: true },
        node: {
          ancestry: ['html > body > iframe']
        },
        result: false
      },
      {
        data: { isIframe: true },
        node: {
          ancestry: ['html > body > iframe', 'html > body > iframe']
        },
        result: false
      },
      {
        data: { isIframe: false },
        node: {
          ancestry: [
            'html > body > iframe',
            'html > body > iframe',
            'html > body > p'
          ]
        },
        result: false
      }
    ]);

    expect(results[0].result).toBe(true);
    expect(results[1].result).toBe(true);
    expect(results[2].result).toBe(false);
  });

  it('should pass children of nested iframes if the nested iframe is in a region', function () {
    const results = checks.region.afterAll([
      {
        data: { isIframe: true },
        node: {
          ancestry: ['html > body > iframe']
        },
        result: false
      },
      {
        data: { isIframe: true },
        node: {
          ancestry: ['html > body > iframe', 'html > body > iframe']
        },
        result: true
      },
      {
        data: { isIframe: false },
        node: {
          ancestry: [
            'html > body > iframe',
            'html > body > iframe',
            'html > body > p'
          ]
        },
        result: false
      }
    ]);

    expect(results[0].result).toBe(true);
    expect(results[1].result).toBe(true);
    expect(results[2].result).toBe(true);
  });

  it('should pass content if a grandparent frame passes', function () {
    const results = checks.region.afterAll([
      {
        data: { isIframe: true },
        node: {
          ancestry: ['html > body > iframe']
        },
        result: true
      },
      {
        data: { isIframe: true },
        node: {
          ancestry: ['html > body > iframe', 'html > body > iframe']
        },
        result: false
      },
      {
        data: { isIframe: false },
        node: {
          ancestry: [
            'html > body > iframe',
            'html > body > iframe',
            'html > body > p'
          ]
        },
        result: false
      }
    ]);
    expect(results[0].result).toBe(true);
    expect(results[1].result).toBe(true);
    expect(results[2].result).toBe(true);
  });
});
