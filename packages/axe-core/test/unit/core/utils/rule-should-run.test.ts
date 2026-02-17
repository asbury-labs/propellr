import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';

declare const axe: any;
describe('axe.utils.ruleShouldRun', () => {
  it('should return false if rule.pageOnly and !context.page', () => {
    expect(
      axe.utils.ruleShouldRun(
        {
          pageLevel: true
        },
        {
          page: false
        },
        {}
      )
    ).toBe(false);
  });

  it('should return false if rule.enabled is false, option.enabled is false and ruleID is not present runOnly', () => {
    expect(
      axe.utils.ruleShouldRun(
        {
          id: 'bananas',
          enabled: false
        },
        {},
        {
          rules: {
            bananas: {
              enabled: false
            }
          },
          runOnly: {
            type: 'rule',
            values: ['apples']
          }
        }
      )
    ).toBe(false);
  });

  it('should return true if rule.enabled is false, option.enabled is false and ruleID is present in runOnly', () => {
    expect(
      axe.utils.ruleShouldRun(
        {
          id: 'bananas',
          enabled: false
        },
        {},
        {
          rules: {
            bananas: {
              enabled: false
            }
          },
          runOnly: {
            type: 'rule',
            values: ['bananas']
          }
        }
      )
    ).toBe(true);
  });

  it('should return true if rule.enabled is false, option is undefined and ruleID is present in runOnly', () => {
    expect(
      axe.utils.ruleShouldRun(
        {
          id: 'bananas',
          enabled: false
        },
        {},
        {
          runOnly: {
            type: 'rule',
            values: ['bananas']
          }
        }
      )
    ).toBe(true);
  });

  it('should return false even if enabled is set to true if ruleID is not present in runOnly', () => {
    expect(
      axe.utils.ruleShouldRun(
        {
          id: 'bananas',
          enabled: true
        },
        {},
        {
          runOnly: {
            type: 'rule',
            values: ['apples']
          }
        }
      )
    ).toBe(false);
  });

  it('should return false if rule.enabled is false', () => {
    expect(
      axe.utils.ruleShouldRun(
        {
          id: 'bananas',
          enabled: false,
          tags: ['fruit']
        },
        {},
        {}
      )
    ).toBe(false);
  });

  it('should return true if rule.enabled is true', () => {
    expect(
      axe.utils.ruleShouldRun(
        {
          id: 'bananas',
          enabled: true,
          tags: ['fruit']
        },
        {},
        {}
      )
    ).toBe(true);
  });

  it('should return true if option is set to true but rule is set to false', () => {
    expect(
      axe.utils.ruleShouldRun(
        {
          id: 'bananas',
          enabled: false
        },
        {},
        {
          rules: {
            bananas: {
              enabled: true
            }
          }
        }
      )
    ).toBe(true);
  });

  it('should return false if option is set to false but rule is set to true', () => {
    expect(
      axe.utils.ruleShouldRun(
        {
          id: 'bananas',
          enabled: true
        },
        {},
        {
          rules: {
            bananas: {
              enabled: false
            }
          }
        }
      )
    ).toBe(false);
  });

  it('should use option.rules.enabled over option.runOnly tags', () => {
    expect(
      axe.utils.ruleShouldRun(
        {
          id: 'bananas',
          enabled: true,
          tags: ['fruit']
        },
        {},
        {
          rules: {
            bananas: {
              enabled: true
            }
          },
          runOnly: {
            type: 'tag',
            values: ['meat']
          }
        }
      )
    ).toBe(true);

    expect(
      axe.utils.ruleShouldRun(
        {
          id: 'bananas',
          enabled: true,
          tags: ['fruit']
        },
        {},
        {
          rules: {
            bananas: {
              enabled: false
            }
          },
          runOnly: {
            type: 'tag',
            values: ['fruit']
          }
        }
      )
    ).toBe(false);
  });

  describe('default axe._tagExclude', () => {
    let origTagExclude;
    beforeAll(() => {
      axe._load({});
      origTagExclude = axe._audit.tagExclude;
    });
    afterAll(() => {
      axe._audit.tagExclude = origTagExclude;
    });

    beforeEach(() => {
      axe._audit.tagExclude = [];
    });

    it('excludes rules with a tag put in axe._tagExclude', () => {
      axe._audit.tagExclude = ['the-cheat'];
      expect(
        axe.utils.ruleShouldRun(
          {
            id: 'e-mail',
            enabled: true,
            tags: ['strongbad']
          },
          {},
          {}
        )
      ).toBe(true);

      expect(
        axe.utils.ruleShouldRun(
          {
            id: 'party',
            enabled: true,
            tags: ['the-cheat']
          },
          {},
          {}
        )
      ).toBe(false);
    });

    it('adds axe.tagExclude to the existing exclude tags', () => {
      axe._audit.tagExclude = ['the-cheat'];
      expect(
        axe.utils.ruleShouldRun(
          {
            id: 'e-mail',
            enabled: true,
            tags: ['the-cheat']
          },
          {},
          {
            runOnly: {
              type: 'tag',
              values: { exclude: ['strongbad'] }
            }
          }
        )
      ).toBe(false);
    });

    it('does not exclude tags explicitly included', () => {
      axe._audit.tagExclude = ['the-cheat'];
      expect(
        axe.utils.ruleShouldRun(
          {
            id: 'e-mail',
            enabled: false,
            tags: ['the-cheat']
          },
          {},
          {
            runOnly: {
              type: 'tag',
              values: { include: ['the-cheat'] }
            }
          }
        )
      ).toBe(true);

      expect(
        axe.utils.ruleShouldRun(
          {
            id: 'e-mail',
            enabled: false,
            tags: ['the-cheat']
          },
          {},
          {
            runOnly: {
              type: 'rule',
              values: ['e-mail']
            }
          }
        )
      ).toBe(true);

      expect(
        axe.utils.ruleShouldRun(
          {
            id: 'e-mail',
            enabled: false,
            tags: ['the-cheat']
          },
          {},
          {
            rules: {
              'e-mail': {
                enabled: true
              }
            }
          }
        )
      ).toBe(true);
    });
  });

  describe('runOnly type:tag', () => {
    it('should return true if passed an array with a matching tag', () => {
      expect(
        axe.utils.ruleShouldRun(
          {
            id: 'bananas',
            enabled: false,
            tags: ['fruit']
          },
          {},
          {
            runOnly: {
              type: 'tag',
              values: ['fruit']
            }
          }
        )
      ).toBe(true);
    });

    it('should return false if passed an array with a matching tag', () => {
      expect(
        axe.utils.ruleShouldRun(
          {
            id: 'bananas',
            enabled: true,
            tags: ['fruit']
          },
          {},
          {
            runOnly: {
              type: 'tag',
              values: ['meat']
            }
          }
        )
      ).toBe(false);
    });

    it('should accept string as an include value', () => {
      expect(
        axe.utils.ruleShouldRun(
          {
            id: 'bananas',
            enabled: false,
            tags: ['fruit']
          },
          {},
          {
            runOnly: {
              type: 'tag',
              values: {
                include: 'fruit'
              }
            }
          }
        )
      ).toBe(true);
    });

    it('should accept array as an include value', () => {
      expect(
        axe.utils.ruleShouldRun(
          {
            id: 'bananas',
            enabled: false,
            tags: ['fruit']
          },
          {},
          {
            runOnly: {
              type: 'tag',
              values: {
                include: ['fruit', 'veggie']
              }
            }
          }
        )
      ).toBe(true);
    });

    it('should accept string as an exclude value', () => {
      expect(
        axe.utils.ruleShouldRun(
          {
            id: 'bananas',
            enabled: false,
            tags: ['fruit', 'tasty']
          },
          {},
          {
            runOnly: {
              type: 'tag',
              values: {
                exclude: 'tasty'
              }
            }
          }
        )
      ).toBe(false);
    });

    it('should accept array as an exclude value', () => {
      expect(
        axe.utils.ruleShouldRun(
          {
            id: 'bananas',
            enabled: false,
            tags: ['fruit']
          },
          {},
          {
            runOnly: {
              type: 'tag',
              values: {
                exclude: ['fruit', 'tasty']
              }
            }
          }
        )
      ).toBe(false);
    });

    it('should return true if it matches include but not exclude', () => {
      expect(
        axe.utils.ruleShouldRun(
          {
            id: 'cabbage',
            enabled: false,
            tags: ['veggie']
          },
          {},
          {
            runOnly: {
              type: 'tag',
              values: {
                include: ['fruit', 'veggie'],
                exclude: ['tasty']
              }
            }
          }
        )
      ).toBe(true);
    });

    it('should return false if it matches no include', () => {
      expect(
        axe.utils.ruleShouldRun(
          {
            id: 'bananas',
            enabled: false,
            tags: ['fruit']
          },
          {},
          {
            runOnly: {
              type: 'tag',
              values: {
                include: ['veggies'],
                exclude: ['fruit', 'tasty']
              }
            }
          }
        )
      ).toBe(false);
    });

    it('should return false if it matches include and exclude', () => {
      expect(
        axe.utils.ruleShouldRun(
          {
            id: 'bananas',
            enabled: false,
            tags: ['fruit', 'tasty']
          },
          {},
          {
            runOnly: {
              type: 'tag',
              values: {
                include: ['fruit', 'veggies'],
                exclude: ['tasty']
              }
            }
          }
        )
      ).toBe(false);
    });
  });
});
