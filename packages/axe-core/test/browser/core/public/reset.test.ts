import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
describe('axe.reset', () => {
  // var Rule = axe._thisWillBeDeletedDoNotUse.base.Rule;
  const fixture = document.getElementById('fixture');
  afterEach(() => {
    fixture.innerHTML = '';
  });

  beforeEach(() => {
    axe._audit = null;
  });

  it('should throw if no audit is configured', () => {
    expect(() => {
      axe.reset(
        () => {},
        () => {}
      );
    }).toThrow(/^No audit configured/);
  });

  it('should restore the default configuration', () => {
    axe._load({
      data: {
        rules: {
          bob: {
            knows: 'not-joe'
          }
        }
      },
      rules: [
        {
          id: 'bob',
          selector: 'fail'
        }
      ],
      reporter: 'v2'
    });
    expect(axe._audit.rules).toHaveLength(1);
    // TODO: this does not work yet thanks to webpack
    // expect(axe._audit.rules[0]).toBeInstanceOf(Rule);
    expect(axe._audit.rules[0].id).toBe('bob');
    expect(axe._audit.rules[0].selector).toBe('fail');
    expect(axe._audit.reporter).toBe('v2');

    axe.configure({
      rules: [
        {
          id: 'bob',
          selector: 'pass',
          metadata: {
            knows: 'joe'
          }
        }
      ],
      reporter: 'raw'
    });
    expect(axe._audit.rules).toHaveLength(1);
    // expect(axe._audit.rules[0]).toBeInstanceOf(Rule);
    expect(axe._audit.rules[0].id).toBe('bob');
    expect(axe._audit.rules[0].selector).toBe('pass');
    expect(axe._audit.reporter).toBe('raw');
    expect(axe._audit.data.rules.bob.knows).toBe('joe');

    axe.reset();

    expect(axe._audit.rules).toHaveLength(1);
    // expect(axe._audit.rules[0]).toBeInstanceOf(Rule);
    expect(axe._audit.rules[0].id).toBe('bob');
    expect(axe._audit.rules[0].selector).toBe('fail');
    expect(axe._audit.reporter).toBe('v2');
    expect(axe._audit.data.rules.bob.knows).toBe('not-joe');
  });

  describe('when custom locale was provided', () => {
    beforeEach(() => {
      axe._load({
        data: {
          checks: {
            banana: {
              impact: 'serious',
              messages: {
                pass: 'yay',
                fail: 'boo',
                incomplete: 'donno'
              }
            }
          }
        },
        checks: [
          {
            id: 'banana',
            evaluate: () => {}
          }
        ]
      });
    });

    it('should restore the original locale', () => {
      axe.configure({
        locale: {
          checks: {
            banana: {
              pass: 'wonderful',
              fail: 'horrible job',
              incomplete: 'donno'
            }
          }
        }
      });

      axe.reset();

      const banana = axe._audit.data.checks.banana;
      expect(banana.impact).toBe('serious');
      expect(banana.messages.pass).toBe('yay');
      expect(banana.messages.fail).toBe('boo');
      expect(banana.messages.incomplete).toBe('donno');
    });
  });

  it('should restore standards object', () => {
    axe._load({});

    axe.configure({
      standards: {
        ariaAttrs: {
          'aria-live': {
            type: 'string'
          }
        }
      }
    });

    axe.reset();

    const ariaLiveAttr = axe._audit.standards.ariaAttrs['aria-live'];
    expect(ariaLiveAttr.type).toBe('nmtoken');
  });
});
