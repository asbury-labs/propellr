import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
describe('axe.configure', () => {
  // var Rule = axe._thisWillBeDeletedDoNotUse.base.Rule;
  // var Check = axe._thisWillBeDeletedDoNotUse.base.Check;
  const fixture = document.getElementById('fixture');
  const axeVersion = axe.version;
  const ver = axe.version.substring(0, axe.version.lastIndexOf('.'));

  afterEach(() => {
    fixture.innerHTML = '';
    axe.version = axeVersion;
  });

  beforeEach(() => {
    axe._audit = null;
  });

  it('should throw if audit is not configured', () => {
    expect(() => {
      axe.configure({});
    }).toThrow(/^No audit configured/);
  });

  it("should override an audit's reporter - string", () => {
    axe._load({});
    expect(axe._audit.reporter).toBeNull();

    axe.configure({ reporter: 'v1' });
    expect(axe._audit.reporter).toBe('v1');
  });

  it('should not allow setting to an un-registered reporter', () => {
    axe._load({ reporter: 'v1' });
    axe.configure({ reporter: 'no-exist-evar-plz' });
    expect(axe._audit.reporter).toBe('v1');
  });

  it('should allow for addition of rules', () => {
    axe._load({});
    axe.configure({
      rules: [
        {
          id: 'bob',
          metadata: {
            joe: 'joe'
          }
        }
      ]
    });

    expect(axe._audit.rules).toHaveLength(1);
    // TODO: this does not work yet thanks to webpack
    // expect(axe._audit.rules[0]).toBeInstanceOf(Rule);
    expect(axe._audit.rules[0].id).toBe('bob');
    expect(axe._audit.data.rules.bob.joe).toEqual('joe');
  });

  it('should throw error if rules property is invalid', () => {
    expect(() => {
      (axe.configure({ rules: 'hello' }),
        TypeError,
        /^Rules property must be an array/);
    }).toThrow();
  });

  it('should throw error if rule is invalid', () => {
    expect(() => {
      (axe.configure({ rules: ['hello'] }),
        TypeError,
        /Configured rule "hello" is invalid/);
    }).toThrow();
  });

  it('should throw error if rule does not have an id', () => {
    expect(() => {
      (axe.configure({ rules: [{ foo: 'bar' }] }),
        TypeError,
        /Configured rule "{foo:"bar"}" is invalid/);
    }).toThrow();
  });

  it('should call setBranding when passed options', () => {
    axe._load({});
    axe.configure({
      rules: [
        {
          id: 'bob',
          selector: 'pass'
        }
      ],
      branding: {}
    });
    expect(axe._audit.rules).toHaveLength(1);
    expect(axe._audit.data.rules.bob.helpUrl).toBe(
      'https://dequeuniversity.com/rules/axe/' + ver + '/bob?application=axeAPI'
    );
    axe.configure({
      branding: {
        application: 'thing',
        brand: 'thung'
      }
    });
    expect(axe._audit.data.rules.bob.helpUrl).toBe(
      'https://dequeuniversity.com/rules/thung/' +
        ver +
        '/bob?application=thing'
    );
  });

  it('sets branding on newly configured rules', () => {
    axe._load({});
    axe.configure({
      branding: {
        application: 'thing',
        brand: 'thung'
      }
    });
    axe.configure({
      rules: [
        {
          id: 'bob',
          selector: 'pass'
        }
      ]
    });

    expect(axe._audit.data.rules.bob.helpUrl).toBe(
      'https://dequeuniversity.com/rules/thung/' +
        ver +
        '/bob?application=thing'
    );
  });

  it('should allow for overwriting of rules', () => {
    axe._load({
      data: {
        rules: {
          bob: 'not-joe'
        }
      },
      rules: {
        id: 'bob',
        selector: 'fail'
      }
    });
    axe.configure({
      rules: [
        {
          id: 'bob',
          selector: 'pass',
          metadata: {
            joe: 'joe'
          }
        }
      ]
    });

    expect(axe._audit.rules).toHaveLength(1);
    // expect(axe._audit.rules[0]).toBeInstanceOf(Rule);
    expect(axe._audit.rules[0].id).toBe('bob');
    expect(axe._audit.rules[0].selector).toBe('pass');
    expect(axe._audit.data.rules.bob.joe).toBe('joe');
  });

  it('should allow for the addition of checks', () => {
    axe._load({});
    axe.configure({
      checks: [
        {
          id: 'bob',
          options: { value: true },
          metadata: {
            joe: 'joe'
          }
        }
      ]
    });

    // expect(axe._audit.checks.bob).toBeInstanceOf(Check);
    expect(axe._audit.checks.bob.id).toBe('bob');
    expect(axe._audit.checks.bob.options.value).toBe(true);
    expect(axe._audit.data.checks.bob.joe).toBe('joe');
  });

  it('should throw error if checks property is invalid', () => {
    expect(() => {
      (axe.configure({ checks: 'hello' }),
        TypeError,
        /^Checks property must be an array/);
    }).toThrow();
  });

  it('should throw error if check is invalid', () => {
    expect(() => {
      (axe.configure({ checks: ['hello'] }),
        TypeError,
        /Configured check "hello" is invalid/);
    }).toThrow();
  });

  it('should throw error if check does not have an id', () => {
    expect(() => {
      (axe.configure({ checks: [{ foo: 'bar' }] }),
        TypeError,
        /Configured check "{foo:"bar"}" is invalid/);
    }).toThrow();
  });

  it('should allow for the overwriting of checks', () => {
    axe._load({
      data: {
        checks: {
          bob: 'not-joe'
        }
      },
      checks: [
        {
          id: 'bob',
          options: { value: false }
        }
      ]
    });
    axe.configure({
      checks: [
        {
          id: 'bob',
          options: { value: true },
          metadata: {
            joe: 'joe'
          }
        }
      ]
    });

    // expect(axe._audit.checks.bob).toBeInstanceOf(Check);
    expect(axe._audit.checks.bob.id).toBe('bob');
    expect(axe._audit.checks.bob.options.value).toBe(true);
    expect(axe._audit.data.checks.bob.joe).toBe('joe');
  });

  it('should create an execution context for check messages', () => {
    axe._load({});
    axe.configure({
      checks: [
        {
          id: 'bob',
          metadata: {
            messages: {
              pass: "() => { return 'Bob' + ' John';}",
              fail: 'Bob Pete'
            }
          }
        }
      ]
    });

    expect(typeof axe._audit.data.checks.bob.messages.pass).toBe('function');
    expect(typeof axe._audit.data.checks.bob.messages.fail).toBe('string');
    expect(axe._audit.data.checks.bob.messages.pass()).toBe('Bob John');
    expect(axe._audit.data.checks.bob.messages.fail).toBe('Bob Pete');
  });

  it('overrides the default value of audit.tagExclude', () => {
    axe._load({});
    expect(axe._audit.tagExclude).toEqual(['experimental', 'deprecated']);

    axe.configure({
      tagExclude: ['ninjas']
    });
    expect(axe._audit.tagExclude).toEqual(['ninjas']);
  });

  it('disables all untouched rules with disableOtherRules', () => {
    axe._load({
      rules: [{ id: 'captain-america' }, { id: 'thor' }, { id: 'spider-man' }]
    });
    axe.configure({
      disableOtherRules: true,
      rules: [{ id: 'captain-america' }, { id: 'black-panther' }]
    });

    expect(axe._audit.rules).toHaveLength(4);
    expect(axe._audit.rules[0].id).toBe('captain-america');
    expect(axe._audit.rules[0].enabled).toBe(true);
    expect(axe._audit.rules[1].id).toBe('thor');
    expect(axe._audit.rules[1].enabled).toBe(false);
    expect(axe._audit.rules[2].id).toBe('spider-man');
    expect(axe._audit.rules[2].enabled).toBe(false);
    expect(axe._audit.rules[3].id).toBe('black-panther');
    expect(axe._audit.rules[3].enabled).toBe(true);
  });

  it("should allow overriding an audit's noHtml", () => {
    axe._load({});
    expect(axe._audit.noHtml).toBe(false);

    axe.configure({ noHtml: true });
    expect(axe._audit.noHtml).toBe(true);
  });

  it("should allow overriding an audit's allowedOrigins", () => {
    axe._load({});
    expect(axe._audit.allowedOrigins).not.toEqual(['foo']);

    axe.configure({ allowedOrigins: ['foo'] });
    expect(axe._audit.allowedOrigins).toEqual(['foo']);
  });

  it('should throw error if allowedOrigins is not an array', () => {
    axe._load({});
    expect(() => {
      axe.configure({ allowedOrigins: 'foo' });
    }).toThrow();
  });

  it("should throw error if the origin is '*'", () => {
    axe._load({});
    expect(() => {
      axe.configure({ allowedOrigins: ['foo', '*'] });
    }).toThrow();
  });

  describe('given a locale object', () => {
    beforeEach(() => {
      axe._load({});

      axe.configure({
        rules: [
          {
            id: 'greeting',
            selector: 'div',
            excludeHidden: false,
            tags: ['foo', 'bar'],
            metadata: {
              description: 'This is a rule that rules',
              help: 'ABCDEFGHIKLMNOPQRSTVXYZ'
            }
          }
        ],
        checks: [
          {
            id: 'banana',
            evaluate: () => {},
            metadata: {
              impact: 'srsly serious',
              messages: {
                pass: 'yay',
                fail: 'boo',
                incomplete: {
                  foo: 'a',
                  bar: 'b',
                  baz: 'c'
                }
              }
            }
          }
        ]
      });
    });

    it('should update check and rule metadata', () => {
      axe.configure({
        locale: {
          lang: 'lol',
          rules: {
            greeting: {
              description: 'hello',
              help: 'hi'
            }
          },
          checks: {
            banana: {
              pass: 'pizza',
              fail: 'icecream',
              incomplete: {
                foo: 'meat',
                bar: 'fruit',
                baz: 'vegetables'
              }
            }
          }
        }
      });

      const audit = axe._audit;
      const localeData = audit.data;

      expect(localeData.rules.greeting.help).toBe('hi');
      expect(localeData.rules.greeting.description).toBe('hello');
      expect(localeData.checks.banana.messages.pass).toBe('pizza');
      expect(localeData.checks.banana.messages.fail).toBe('icecream');
      expect(localeData.checks.banana.messages.incomplete).toEqual({
        foo: 'meat',
        bar: 'fruit',
        baz: 'vegetables'
      });
    });

    it('should merge locales (favoring "new")', () => {
      axe.configure({
        locale: {
          lang: 'lol',
          rules: { greeting: { description: 'hello' } },
          checks: {
            banana: {
              fail: 'icecream'
            }
          }
        }
      });

      const audit = axe._audit;
      const localeData = audit.data;

      expect(localeData.rules.greeting.help).toBe('ABCDEFGHIKLMNOPQRSTVXYZ');
      expect(localeData.rules.greeting.description).toBe('hello');
      expect(localeData.checks.banana.messages.pass).toBe('yay');
      expect(localeData.checks.banana.messages.fail).toBe('icecream');
      expect(localeData.checks.banana.messages.incomplete).toEqual({
        foo: 'a',
        bar: 'b',
        baz: 'c'
      });
    });

    it('sets the lang property', () => {
      axe.configure({
        locale: {
          lang: 'lol',
          rules: { greeting: { description: 'hello' } },
          checks: {
            banana: {
              fail: 'icecream'
            }
          }
        }
      });

      expect(axe._audit.lang).toBe('lol');
    });

    it('should call doT.compile if a messages uses doT syntax', () => {
      axe.configure({
        locale: {
          lang: 'lol',
          rules: { greeting: { description: 'hello' } },
          checks: {
            banana: {
              fail: 'icecream {{=it.data.value}}'
            }
          }
        }
      });

      const audit = axe._audit;
      const localeData = audit.data;

      expect(typeof localeData.checks.banana.messages.fail === 'function').toBe(
        true
      );
    });

    it('should leave the messages as a string if it does not use doT syntax', () => {
      axe.configure({
        locale: {
          lang: 'lol',
          rules: { greeting: { description: 'hello' } },
          checks: {
            banana: {
              fail: 'icecream ${data.value}'
            }
          }
        }
      });

      const audit = axe._audit;
      const localeData = audit.data;

      expect(typeof localeData.checks.banana.messages.fail === 'string').toBe(
        true
      );
    });

    it('should update failure messages', () => {
      axe._load({
        data: {
          failureSummaries: {
            any: {
              failureMessage: () => {
                return 'failed any';
              }
            },
            none: {
              failureMessage: () => {
                return 'failed none';
              }
            }
          },
          incompleteFallbackMessage: () => {
            return 'failed incomplete';
          }
        }
      });

      axe.configure({
        locale: {
          lang: 'lol',
          failureSummaries: {
            any: {
              failureMessage: 'foo'
            },
            none: {
              failureMessage: 'bar'
            }
          },
          incompleteFallbackMessage: 'baz'
        }
      });

      const audit = axe._audit;
      const localeData = audit.data;

      expect(localeData.failureSummaries.any.failureMessage).toBe('foo');
      expect(localeData.failureSummaries.none.failureMessage).toBe('bar');
      expect(localeData.incompleteFallbackMessage).toBe('baz');
    });

    it('should merge failure messages', () => {
      axe._load({
        data: {
          failureSummaries: {
            any: {
              failureMessage: () => {
                return 'failed any';
              }
            },
            none: {
              failureMessage: () => {
                return 'failed none';
              }
            }
          },
          incompleteFallbackMessage: () => {
            return 'failed incomplete';
          }
        }
      });

      axe.configure({
        locale: {
          lang: 'lol',
          failureSummaries: {
            any: {
              failureMessage: 'foo'
            }
          }
        }
      });

      const audit = axe._audit;
      const localeData = audit.data;

      expect(localeData.failureSummaries.any.failureMessage).toBe('foo');
      expect(localeData.failureSummaries.none.failureMessage()).toBe(
        'failed none'
      );
      expect(localeData.incompleteFallbackMessage()).toBe('failed incomplete');
    });

    it('should not strip newline characters from doT template', () => {
      axe._load({
        data: {
          failureSummaries: {
            any: {
              failureMessage: () => {
                return 'failed any';
              }
            }
          }
        }
      });

      axe.configure({
        locale: {
          lang: 'lol',
          failureSummaries: {
            any: {
              failureMessage:
                "Fix any of the following:{{~it:value}}\n  {{=value.split('\\n').join('\\n  ')}}{{~}}"
            }
          }
        }
      });

      const audit = axe._audit;
      const localeData = audit.data;

      expect(
        localeData.failureSummaries.any.failureMessage(['1', '2', '3'])
      ).toBe('Fix any of the following:\n  1\n  2\n  3');
    });

    describe('only given checks', () => {
      it('should not error', () => {
        expect(() => {
          axe.configure({
            locale: {
              lang: 'lol',
              checks: {
                banana: {
                  fail: 'icecream',
                  incomplete: {
                    baz: 'vegetables'
                  }
                }
              }
            }
          });
        }).not.toThrow();
      });
    });

    describe('only given rules', () => {
      it('should not error', () => {
        expect(() => {
          axe.configure({
            locale: {
              rules: { greeting: { help: 'foo', description: 'bar' } }
            }
          });
        }).not.toThrow();
      });
    });

    describe('check incomplete messages', () => {
      beforeEach(() => {
        axe.configure({
          checks: [
            {
              id: 'panda',
              evaluate: () => {},
              metadata: {
                impact: 'yep',
                messages: {
                  pass: 'p',
                  fail: 'f',
                  incomplete: 'i'
                }
              }
            }
          ]
        });
      });

      it('should support strings', () => {
        axe.configure({
          locale: {
            checks: {
              panda: {
                incomplete: 'radio'
              }
            }
          }
        });

        expect(axe._audit.data.checks.panda.messages.incomplete).toBe('radio');
      });

      it('should shallow-merge objects', () => {
        axe.configure({
          locale: {
            lang: 'lol',
            checks: {
              banana: {
                incomplete: {
                  baz: 'vegetables'
                }
              }
            }
          }
        });

        expect(axe._audit.data.checks.banana.messages.incomplete).toEqual({
          foo: 'a',
          bar: 'b',
          baz: 'vegetables'
        });
      });
    });

    // This test ensures we do not drop additional properties added to
    // checks. See https://github.com/dequelabs/axe-core/pull/1036/files#r207738673
    // for reasoning.
    it('should keep existing properties on check data', () => {
      axe.configure({
        checks: [
          {
            id: 'banana',
            metadata: {
              impact: 'potato',
              foo: 'bar',
              messages: {
                pass: 'pass',
                fail: 'fail',
                incomplete: 'incomplete'
              }
            }
          }
        ]
      });

      axe.configure({
        locale: {
          lang: 'lol',
          checks: {
            banana: {
              pass: 'yay banana'
            }
          }
        }
      });

      const banana = axe._audit.data.checks.banana;
      expect(banana.impact).toBe('potato');
      expect(banana.foo).toBe('bar');
      expect(banana.messages.pass).toBe('yay banana');
    });

    it('should error when provided an unknown rule id', () => {
      expect(() => {
        axe.configure({
          locale: {
            rules: { nope: { help: 'helpme' } }
          }
        });
      }).toThrow(/unknown rule: "nope"/);
    });

    it('should error when provided an unknown check id', () => {
      expect(() => {
        axe.configure({
          locale: {
            checks: { nope: { pass: 'helpme' } }
          }
        });
      }).toThrow(/unknown check: "nope"/);
    });

    it('should error when provided an unknown failure summary', () => {
      expect(() => {
        axe.configure({
          locale: {
            failureSummaries: {
              nope: { failureMessage: 'helpme' }
            }
          }
        });
      }).toThrow();
    });

    it('should set default locale', () => {
      expect(axe._audit._defaultLocale).toBeNull();
      axe.configure({
        locale: {
          lang: 'lol',
          checks: {
            banana: {
              pass: 'yay banana'
            }
          }
        }
      });
      expect(axe._audit._defaultLocale).toBeTruthy();
    });

    describe('also given metadata', () => {
      it('should favor the locale', () => {
        axe.configure({
          locale: {
            lang: 'lol',
            rules: {
              greeting: {
                help: 'hi'
              }
            }
          },
          rules: [
            {
              id: 'greeting',
              metadata: {
                help: 'potato'
              }
            }
          ]
        });

        const audit = axe._audit;
        const localeData = audit.data;

        expect(localeData.rules.greeting.help).toBe('hi');
      });
    });

    describe('after locale has been set', () => {
      describe('the provided messages', () => {
        it('should allow for doT templating', () => {
          axe.configure({
            locale: {
              lang: 'foo',
              rules: {
                greeting: {
                  help: 'foo: {{=it.data}}.'
                }
              }
            }
          });

          const greeting = axe._audit.data.rules.greeting;
          const value = greeting.help({
            data: 'bar'
          });
          expect(value).toBe('foo: bar.');
        });
      });
    });
  });

  describe('given an axeVersion property', () => {
    beforeEach(() => {
      axe._load({});
      axe.version = '1.2.3';
    });

    it('should not throw if version matches axe.version', () => {
      expect(function fn() {
        axe.configure({
          axeVersion: '1.2.3'
        });

        axe.version = '1.2.3-canary.2664bae';
        axe.configure({
          axeVersion: '1.2.3-canary.2664bae'
        });
      }).not.toThrow();
    });

    it('should not throw if patch version is less than axe.version', () => {
      expect(function fn() {
        axe.configure({
          axeVersion: '1.2.0'
        });
      }).not.toThrow();
    });

    it('should not throw if minor version is less than axe.version', () => {
      expect(function fn() {
        axe.configure({
          axeVersion: '1.1.9'
        });
      }).not.toThrow();
    });

    it('should not throw if versions match and axe has a canary version', () => {
      axe.version = '1.2.3-canary.2664bae';
      expect(function fn() {
        axe.configure({
          axeVersion: '1.2.3'
        });
      }).not.toThrow();
    });

    it('should throw if invalid version', () => {
      expect(function fn() {
        axe.configure({
          axeVersion: '2'
        });
      }).toThrow('Invalid configured version 2');

      expect(function fn() {
        axe.configure({
          axeVersion: '2..'
        });
      }).toThrow('Invalid configured version 2..');
    });

    it('should throw if major version is different than axe.version', () => {
      expect(function fn() {
        axe.configure(
          {
            axeVersion: '2.0.0'
          },
          /^Configured version/
        );
      }).toThrow();
      expect(function fn() {
        axe.configure(
          {
            axeVersion: '0.1.2'
          },
          /^Configured version/
        );
      }).toThrow();
    });

    it('should throw if minor version is greater than axe.version', () => {
      expect(function fn() {
        axe.configure(
          {
            axeVersion: '1.3.0'
          },
          /^Configured version/
        );
      }).toThrow();
    });

    it('should throw if patch version is greater than axe.version', () => {
      expect(function fn() {
        axe.configure(
          {
            axeVersion: '1.2.9'
          },
          /^Configured version/
        );
      }).toThrow();
    });

    it('should throw if versions match and axeVersion has a canary version', () => {
      expect(function fn() {
        axe.configure(
          {
            axeVersion: '1.2.3-canary.2664bae'
          },
          /^Configured version/
        );
      }).toThrow();
    });

    it('should throw if versions match and both have a canary version', () => {
      axe.version = '1.2.3-canary.2664bae';
      expect(function fn() {
        axe.configure(
          {
            axeVersion: '1.2.3-canary.a5d727c'
          },
          /^Configured version/
        );
      }).toThrow();
    });

    it('should accept ver property as fallback', () => {
      expect(function fn() {
        axe.configure(
          {
            ver: '1.3.0'
          },
          /^Configured version/
        );
      }).toThrow();
    });

    it('should accept axeVersion over ver property', () => {
      expect(function fn() {
        axe.configure(
          {
            ver: '0.1.2',
            axeVersion: '1.3.0'
          },
          /^Configured version 1\.3\.0/
        );
      }).toThrow();
    });
  });

  describe('given a standards object', () => {
    beforeEach(() => {
      axe._load({});
    });

    describe('ariaAttrs', () => {
      it('should allow creating new attr', () => {
        axe.configure({
          standards: {
            ariaAttrs: {
              newAttr: {
                type: 'string'
              }
            }
          }
        });

        const ariaAttr = axe._audit.standards.ariaAttrs.newAttr;
        expect(ariaAttr.type).toBe('string');
      });

      it('should override existing attr', () => {
        axe.configure({
          standards: {
            ariaAttrs: {
              newAttr: {
                type: 'string'
              }
            }
          }
        });

        axe.configure({
          standards: {
            ariaAttrs: {
              newAttr: {
                type: 'mntoken',
                values: ['foo', 'bar']
              }
            }
          }
        });

        const ariaAttr = axe._audit.standards.ariaAttrs.newAttr;
        expect(ariaAttr.type).toBe('mntoken');
        expect(ariaAttr.values).toEqual(['foo', 'bar']);
      });

      it('should merge existing attr', () => {
        axe.configure({
          standards: {
            ariaAttrs: {
              newAttr: {
                type: 'mntoken',
                values: ['foo', 'bar']
              }
            }
          }
        });

        axe.configure({
          standards: {
            ariaAttrs: {
              newAttr: {
                type: 'mntokens'
              }
            }
          }
        });

        const ariaAttr = axe._audit.standards.ariaAttrs.newAttr;
        expect(ariaAttr.type).toBe('mntokens');
        expect(ariaAttr.values).toEqual(['foo', 'bar']);
      });

      it('should override and not merge array', () => {
        axe.configure({
          standards: {
            ariaAttrs: {
              newAttr: {
                type: 'mntoken',
                values: ['foo', 'bar']
              }
            }
          }
        });

        axe.configure({
          standards: {
            ariaAttrs: {
              newAttr: {
                values: ['baz']
              }
            }
          }
        });

        const ariaAttr = axe._audit.standards.ariaAttrs.newAttr;
        expect(ariaAttr.values).toEqual(['baz']);
      });
    });
  });
});
