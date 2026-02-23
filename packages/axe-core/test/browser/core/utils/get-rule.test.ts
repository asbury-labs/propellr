import { describe, it, expect, beforeEach } from 'vitest';

declare const axe: any;
describe('axe.utils.getRule', () => {
  beforeEach(() => {
    axe._load({
      rules: [
        {
          id: 'rule1'
        },
        {
          id: 'rule2'
        }
      ]
    });
  });

  it('should return the rule by the id', () => {
    const rule = axe.utils.getRule('rule1');
    expect(rule.id === 'rule1').toBe(true);
  });

  it("should throw error if the rule doesn't exist", () => {
    expect(() => {
      axe.utils.getRule('no-id');
    }).toThrow();
  });
});
