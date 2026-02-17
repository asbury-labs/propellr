import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('axe.utils.getCheckOption', () => {
  it('should prefer options from rules', () => {
    expect(
      axe.utils.getCheckOption(
        {
          id: 'bananas',
          enabled: 'fail',
          options: 'fail'
        },
        'monkeys',
        {
          rules: {
            monkeys: {
              checks: {
                bananas: {
                  enabled: 'yes',
                  options: 'please'
                }
              }
            }
          },
          checks: {
            bananas: {
              enabled: 'nope',
              options: 'jerk'
            }
          }
        }
      )
    ).toEqual({
      enabled: 'yes',
      options: 'please',
      absolutePaths: undefined
    });
  });
  it('should fallback to global check options if not defined on the rule', () => {
    expect(
      axe.utils.getCheckOption(
        {
          id: 'bananas',
          enabled: 'fail',
          options: 'fail'
        },
        'monkeys',
        {
          rules: {
            monkeys: {
              checks: {
                bananas: {
                  enabled: 'yes'
                }
              }
            }
          },
          checks: {
            bananas: {
              enabled: 'nope',
              options: 'please'
            }
          }
        }
      )
    ).toEqual({
      enabled: 'yes',
      options: 'please',
      absolutePaths: undefined
    });
  });

  it('should prefer fallback to global check options if not defined on the rule', () => {
    expect(
      axe.utils.getCheckOption(
        {
          id: 'bananas',
          enabled: 'fail',
          options: 'fail'
        },
        'monkeys',
        {
          checks: {
            bananas: {
              enabled: 'yes',
              options: 'please'
            }
          }
        }
      )
    ).toEqual({
      enabled: 'yes',
      options: 'please',
      absolutePaths: undefined
    });
  });

  it('should otherwise use the check', () => {
    expect(
      axe.utils.getCheckOption(
        {
          id: 'bananas',
          enabled: 'yes',
          options: 'please'
        },
        'monkeys',
        {}
      )
    ).toEqual({
      enabled: 'yes',
      options: 'please',
      absolutePaths: undefined
    });
  });

  it('passes absolutePaths option along', () => {
    expect(
      axe.utils.getCheckOption(
        {
          id: 'bananas',
          enabled: 'on',
          options: 'many'
        },
        'monkeys',
        {
          absolutePaths: 'yep'
        }
      )
    ).toEqual({
      enabled: 'on',
      options: 'many',
      absolutePaths: 'yep'
    });
  });
});
