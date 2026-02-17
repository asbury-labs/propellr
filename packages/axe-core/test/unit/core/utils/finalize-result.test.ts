import { describe, it, expect, beforeEach, afterAll } from 'vitest';

declare const axe: any;
describe('axe.utils.finalizeRuleResult', () => {
  const original = axe._audit;

  beforeEach(() => {
    axe._audit = {
      rules: []
    };
  });

  afterAll(() => {
    axe._audit = original;
  });

  it('returns the first param object', () => {
    const goingIn = {
      nodes: []
    };
    const comingOut = axe.utils.finalizeRuleResult(goingIn);

    expect(goingIn).toBe(comingOut);
  });

  it('assigns impact if rule.impact is defined', () => {
    axe._audit = {
      rules: [{ id: 'foo', impact: 'critical' }]
    };

    let output = axe.utils.finalizeRuleResult({
      id: 'foo',
      nodes: [
        {
          any: [
            {
              result: false,
              impact: 'minor'
            }
          ],
          all: [],
          none: []
        }
      ]
    });

    expect(output.impact).toBe('critical');
    expect(output.violations[0].impact).toBe('critical');
    expect(output.violations[0].any[0].impact).toBe('critical');
  });

  it('leaves impact as null when rule.impact is defined', () => {
    axe._audit = {
      rules: [{ id: 'foo', impact: 'critical' }]
    };

    let output = axe.utils.finalizeRuleResult({
      id: 'foo',
      nodes: [
        {
          any: [
            {
              result: true,
              impact: 'minor'
            }
          ],
          all: [],
          none: []
        }
      ]
    });

    expect(output.impact).toBeNull();
    expect(output.passes[0].impact).toBeNull();
    expect(output.passes[0].any[0].impact).toBe('critical');
  });
});
