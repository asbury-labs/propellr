import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
describe('Audit', () => {
  const Audit = axe._thisWillBeDeletedDoNotUse.base.Audit;
  const Rule = axe._thisWillBeDeletedDoNotUse.base.Rule;
  const ver = axe.version.substring(0, axe.version.lastIndexOf('.'));
  const { fixtureSetup, captureError } = axe.testUtils;
  let audit;
  const isNotCalled = err => {
    throw err || new Error('Reject should not be called');
  };
  const noop = () => {};

  const assertEqualRuleError = (actual, expected) => {
    expect(actual.message).toContain(expected.message);
    expect(actual.stack).toBe(expected.stack);
    expect(actual.name).toBe(expected.name);
  };

  const assertErrorResults = (result, error, selector) => {
    expect(result.result).toBe('cantTell');
    assertEqualRuleError(result.error, error);

    expect(result.nodes).toHaveLength(1);
    const node1 = result.nodes[0];
    expect(node1.any).toHaveLength(0);
    expect(node1.all).toHaveLength(0);
    expect(node1.node.selector).toContain(selector);

    expect(node1.none).toHaveLength(1);
    const none = node1.none[0];
    expect(none.id).toBe('error-occurred');
    expect(none.result).toBe(undefined);
    expect(none.data).toBeDefined();
    assertEqualRuleError(none.data, error);
    expect(none.relatedNodes).toHaveLength(0);
  };

  const mockChecks = [
    {
      id: 'positive1-check1',
      evaluate: () => true
    },
    {
      id: 'positive2-check1',
      evaluate: () => true
    },
    {
      id: 'negative1-check1',
      evaluate: () => true
    },
    {
      id: 'positive3-check1',
      evaluate: () => true
    }
  ];

  const mockRules = [
    {
      id: 'positive1',
      selector: 'input',
      tags: ['positive'],
      any: [
        {
          id: 'positive1-check1'
        }
      ]
    },
    {
      id: 'positive2',
      selector: '#monkeys',
      tags: ['positive'],
      any: ['positive2-check1']
    },
    {
      id: 'negative1',
      selector: 'div',
      tags: ['negative'],
      none: ['negative1-check1']
    },
    {
      id: 'positive3',
      selector: 'blink',
      tags: ['positive'],
      any: ['positive3-check1']
    }
  ];

  const fixture = document.getElementById('fixture');
  let origAuditRun;
  let origUtils;
  beforeEach(() => {
    audit = new Audit();
    mockRules.forEach(r => {
      audit.addRule(r);
    });
    mockChecks.forEach(c => {
      audit.addCheck(c);
    });
    origAuditRun = audit.run;
    origUtils = axe.utils;
    axe._audit = audit;
  });

  afterEach(() => {
    axe.teardown();
    audit.run = origAuditRun;
    axe.utils = origUtils;
  });

  describe('defaults', () => {
    it('should set noHtml', () => {
      audit = new Audit();
      expect(audit.noHtml).toBe(false);
    });

    it('should set allowedOrigins', () => {
      audit = new Audit();
      expect(audit.allowedOrigins).toEqual([window.location.origin]);
    });
  });

  describe('Audit#_constructHelpUrls', () => {
    it('should create default help URLS', () => {
      audit = new Audit();
      audit.addRule({
        id: 'target',
        matches: '() => {return "hello";}',
        selector: 'bob'
      });
      expect(audit.rules).toHaveLength(1);
      expect(audit.data.rules.target).toBe(undefined);
      audit._constructHelpUrls();
      expect(audit.data.rules.target).toEqual({
        helpUrl:
          'https://dequeuniversity.com/rules/axe/' +
          ver +
          '/target?application=axeAPI'
      });
    });
    it('should use changed branding', () => {
      audit = new Audit();
      audit.addRule({
        id: 'target',
        matches: '() => {return "hello";}',
        selector: 'bob'
      });
      expect(audit.rules).toHaveLength(1);
      expect(audit.data.rules.target).toBe(undefined);
      audit.brand = 'thing';
      audit._constructHelpUrls();
      expect(audit.data.rules.target).toEqual({
        helpUrl:
          'https://dequeuniversity.com/rules/thing/' +
          ver +
          '/target?application=axeAPI'
      });
    });
    it('should use changed application', () => {
      audit = new Audit();
      audit.addRule({
        id: 'target',
        matches: '() => {return "hello";}',
        selector: 'bob'
      });
      expect(audit.rules).toHaveLength(1);
      expect(audit.data.rules.target).toBe(undefined);
      audit.application = 'thing';
      audit._constructHelpUrls();
      expect(audit.data.rules.target).toEqual({
        helpUrl:
          'https://dequeuniversity.com/rules/axe/' +
          ver +
          '/target?application=thing'
      });
    });

    it('does not override helpUrls of different products', () => {
      audit = new Audit();
      audit.addRule({
        id: 'target1',
        matches: '() => {return "hello";}',
        selector: 'bob',
        metadata: {
          helpUrl:
            'https://dequeuniversity.com/rules/myproject/' +
            ver +
            '/target1?application=axeAPI'
        }
      });
      audit.addRule({
        id: 'target2',
        matches: '() => {return "hello";}',
        selector: 'bob'
      });

      expect(audit.data.rules.target1.helpUrl).toBe(
        'https://dequeuniversity.com/rules/myproject/' +
          ver +
          '/target1?application=axeAPI'
      );
      expect(audit.data.rules.target2).toBeUndefined();

      expect(audit.rules).toHaveLength(2);
      audit.brand = 'thing';
      audit._constructHelpUrls();

      expect(audit.data.rules.target1.helpUrl).toBe(
        'https://dequeuniversity.com/rules/myproject/' +
          ver +
          '/target1?application=axeAPI'
      );
      expect(audit.data.rules.target2.helpUrl).toBe(
        'https://dequeuniversity.com/rules/thing/' +
          ver +
          '/target2?application=axeAPI'
      );
    });
    it('understands prerelease type version numbers', () => {
      const tempVersion = axe.version;
      audit = new Audit();
      audit.addRule({
        id: 'target',
        matches: '() => {return "hello";}',
        selector: 'bob'
      });

      axe.version = '3.2.1-alpha.0';
      audit._constructHelpUrls();

      axe.version = tempVersion;
      expect(audit.data.rules.target.helpUrl).toBe(
        'https://dequeuniversity.com/rules/axe/3.2/target?application=axeAPI'
      );
    });

    it('matches major release versions', () => {
      const tempVersion = axe.version;
      audit = new Audit();
      audit.addRule({
        id: 'target',
        matches: '() => {return "hello";}',
        selector: 'bob'
      });

      axe.version = '1.0.0';
      audit._constructHelpUrls();

      axe.version = tempVersion;
      expect(audit.data.rules.target.helpUrl).toBe(
        'https://dequeuniversity.com/rules/axe/1.0/target?application=axeAPI'
      );
    });
    it('sets the lang query if locale has been set', () => {
      audit = new Audit();
      audit.addRule({
        id: 'target',
        matches: '() => {return "hello";}',
        selector: 'bob'
      });
      audit.applyLocale({
        lang: 'de'
      });
      expect(audit.rules).toHaveLength(1);
      expect(audit.data.rules.target).toBe(undefined);
      audit._constructHelpUrls();
      expect(audit.data.rules.target).toEqual({
        helpUrl:
          'https://dequeuniversity.com/rules/axe/' +
          ver +
          '/target?application=axeAPI&lang=de'
      });
    });
  });

  describe('Audit#setBranding', () => {
    it('should change the brand', () => {
      audit = new Audit();
      expect(audit.brand).toBe('axe');
      expect(audit.application).toBe('axeAPI');
      audit.setBranding({
        brand: 'thing'
      });
      expect(audit.brand).toBe('thing');
      expect(audit.application).toBe('axeAPI');
    });
    it('should change the application', () => {
      audit = new Audit();
      expect(audit.brand).toBe('axe');
      expect(audit.application).toBe('axeAPI');
      audit.setBranding({
        application: 'thing'
      });
      expect(audit.brand).toBe('axe');
      expect(audit.application).toBe('thing');
    });
    it('should change the application when passed a string', () => {
      audit = new Audit();
      expect(audit.brand).toBe('axe');
      expect(audit.application).toBe('axeAPI');
      audit.setBranding('thing');
      expect(audit.brand).toBe('axe');
      expect(audit.application).toBe('thing');
    });
    it('should call _constructHelpUrls', () => {
      audit = new Audit();
      audit.addRule({
        id: 'target',
        matches: '() => {return "hello";}',
        selector: 'bob'
      });
      expect(audit.rules).toHaveLength(1);
      expect(audit.data.rules.target).toBe(undefined);
      audit.setBranding({
        application: 'thing'
      });
      expect(audit.data.rules.target).toEqual({
        helpUrl:
          'https://dequeuniversity.com/rules/axe/' +
          ver +
          '/target?application=thing'
      });
    });
    it('should call _constructHelpUrls even when nothing changed', () => {
      audit = new Audit();
      audit.addRule({
        id: 'target',
        matches: '() => {return "hello";}',
        selector: 'bob'
      });
      expect(audit.rules).toHaveLength(1);
      expect(audit.data.rules.target).toBe(undefined);
      audit.setBranding(undefined);
      expect(audit.data.rules.target).toEqual({
        helpUrl:
          'https://dequeuniversity.com/rules/axe/' +
          ver +
          '/target?application=axeAPI'
      });
    });
    it('should not replace custom set branding', () => {
      audit = new Audit();
      audit.addRule({
        id: 'target',
        matches: '() => {return "hello";}',
        selector: 'bob',
        metadata: {
          helpUrl:
            'https://dequeuniversity.com/rules/customer-x/' +
            ver +
            '/target?application=axeAPI'
        }
      });
      audit.setBranding({
        application: 'thing',
        brand: 'other'
      });
      expect(audit.data.rules.target.helpUrl).toBe(
        'https://dequeuniversity.com/rules/customer-x/' +
          ver +
          '/target?application=axeAPI'
      );
    });
  });

  describe('Audit#addRule', () => {
    it('should override existing rule', () => {
      audit = new Audit();
      audit.addRule({
        id: 'target',
        matches: '() => {return "hello";}',
        selector: 'bob'
      });
      expect(audit.rules).toHaveLength(1);
      expect(audit.rules[0].selector).toBe('bob');
      expect(audit.rules[0].matches()).toBe('hello');

      audit.addRule({
        id: 'target',
        selector: 'fred'
      });

      expect(audit.rules).toHaveLength(1);
      expect(audit.rules[0].selector).toBe('fred');
      expect(audit.rules[0].matches()).toBe('hello');
    });
    it('should otherwise push new rule', () => {
      audit = new Audit();
      audit.addRule({
        id: 'target',
        selector: 'bob'
      });
      expect(audit.rules).toHaveLength(1);
      expect(audit.rules[0].id).toBe('target');
      expect(audit.rules[0].selector).toBe('bob');

      audit.addRule({
        id: 'target2',
        selector: 'fred'
      });

      expect(audit.rules).toHaveLength(2);
      expect(audit.rules[1].id).toBe('target2');
      expect(audit.rules[1].selector).toBe('fred');
    });
  });

  describe('Audit#resetRulesAndChecks', () => {
    it('should override newly created check', () => {
      audit = new Audit();
      expect(audit.checks.target).toBe(undefined);
      audit.addCheck({
        id: 'target',
        options: { value: 'jane' }
      });
      expect(audit.checks.target).toBeTruthy();
      expect(audit.checks.target.options).toEqual({ value: 'jane' });
      audit.resetRulesAndChecks();
      expect(audit.checks.target).toBe(undefined);
    });
    it('should reset locale', () => {
      audit = new Audit();
      expect(audit.lang).toBe('en');
      audit.applyLocale({
        lang: 'de'
      });
      expect(audit.lang).toBe('de');
      audit.resetRulesAndChecks();
      expect(audit.lang).toBe('en');
    });
    it('should reset brand', () => {
      audit = new Audit();
      expect(audit.brand).toBe('axe');
      audit.setBranding({
        brand: 'test'
      });
      expect(audit.brand).toBe('test');
      audit.resetRulesAndChecks();
      expect(audit.brand).toBe('axe');
    });
    it('should reset brand application', () => {
      audit = new Audit();
      expect(audit.application).toBe('axeAPI');
      audit.setBranding({
        application: 'test'
      });
      expect(audit.application).toBe('test');
      audit.resetRulesAndChecks();
      expect(audit.application).toBe('axeAPI');
    });
    it('should reset brand tagExlcude', () => {
      axe._load({});
      expect(axe._audit.tagExclude).toEqual(['experimental', 'deprecated']);
      axe.configure({
        tagExclude: ['ninjas']
      });
      axe._audit.resetRulesAndChecks();
      expect(axe._audit.tagExclude).toEqual(['experimental', 'deprecated']);
    });

    it('should reset noHtml', () => {
      audit = new Audit();
      audit.noHtml = true;
      audit.resetRulesAndChecks();
      expect(audit.noHtml).toBe(false);
    });

    it('should reset allowedOrigins', () => {
      audit = new Audit();
      audit.allowedOrigins = ['hello'];
      audit.resetRulesAndChecks();
      expect(audit.allowedOrigins).toEqual([window.location.origin]);
    });
  });

  describe('Audit#addCheck', () => {
    it('should create a new check', () => {
      audit = new Audit();
      expect(audit.checks.target).toBe(undefined);
      audit.addCheck({
        id: 'target',
        options: { value: 'jane' }
      });
      expect(audit.checks.target).toBeTruthy();
      expect(audit.checks.target.options).toEqual({ value: 'jane' });
    });
    it('should configure the metadata, if passed', () => {
      audit = new Audit();
      expect(audit.checks.target).toBe(undefined);
      audit.addCheck({
        id: 'target',
        metadata: { guy: 'bob' }
      });
      expect(audit.checks.target).toBeTruthy();
      expect(audit.data.checks.target.guy).toBe('bob');
    });
    it('should reconfigure existing check', () => {
      audit = new Audit();
      const myTest = () => {};
      audit.addCheck({
        id: 'target',
        evaluate: myTest,
        options: { value: 'jane' }
      });

      expect(audit.checks.target.options).toEqual({ value: 'jane' });

      audit.addCheck({
        id: 'target',
        options: { value: 'fred' }
      });

      expect(audit.checks.target.evaluate).toBe(myTest);
      expect(audit.checks.target.options).toEqual({ value: 'fred' });
    });
    it('should not turn messages into a function', () => {
      audit = new Audit();
      const spec = {
        id: 'target',
        evaluate: '() => { return "blah";}',
        metadata: {
          messages: {
            fail: 'it failed'
          }
        }
      };
      audit.addCheck(spec);

      expect(typeof audit.checks.target.evaluate).toBe('function');
      expect(typeof audit.data.checks.target.messages.fail).toBe('string');
      expect(audit.data.checks.target.messages.fail).toBe('it failed');
    });

    it('should turn function strings into a function', () => {
      audit = new Audit();
      const spec = {
        id: 'target',
        evaluate: '() => { return "blah";}',
        metadata: {
          messages: {
            fail: '() => {return "it failed";}'
          }
        }
      };
      audit.addCheck(spec);

      expect(typeof audit.checks.target.evaluate).toBe('function');
      expect(typeof audit.data.checks.target.messages.fail).toBe('function');
      expect(audit.data.checks.target.messages.fail()).toBe('it failed');
    });
  });

  describe('Audit#setAllowedOrigins', () => {
    it('should set allowedOrigins', () => {
      audit = new Audit();
      audit.setAllowedOrigins([
        'https://deque.com',
        'https://dequeuniversity.com'
      ]);
      expect(audit.allowedOrigins).toEqual([
        'https://deque.com',
        'https://dequeuniversity.com'
      ]);
    });

    it('should normalize <same_origin>', () => {
      audit = new Audit();
      audit.setAllowedOrigins(['<same_origin>', 'https://deque.com']);
      expect(audit.allowedOrigins).toEqual([
        window.location.origin,
        'https://deque.com'
      ]);
    });

    it('should normalize <unsafe_all_origins>', () => {
      audit = new Audit();
      audit.setAllowedOrigins([
        'https://deque.com',
        '<unsafe_all_origins>',
        '<same_origin>'
      ]);
      expect(audit.allowedOrigins).toEqual(['*']);
    });
  });

  describe('Audit#run', () => {
    it('should run all the rules', done => {
      fixtureSetup(
        '<input aria-label="monkeys" type="text">' +
          '<div id="monkeys">bananas</div>' +
          '<input aria-labelledby="monkeys">' +
          '<blink>FAIL ME</blink>'
      );

      audit.run(
        { include: [axe.utils.getFlattenedTree(fixture)[0]] },
        {},
        results => {
          const expected = [
            {
              id: 'positive1',
              result: 'inapplicable',
              pageLevel: false,
              impact: null,
              nodes: '...other tests cover this...'
            },
            {
              id: 'positive2',
              result: 'inapplicable',
              pageLevel: false,
              impact: null,
              nodes: '...other tests cover this...'
            },
            {
              id: 'negative1',
              result: 'inapplicable',
              pageLevel: false,
              impact: null,
              nodes: '...other tests cover this...'
            },
            {
              id: 'positive3',
              result: 'inapplicable',
              pageLevel: false,
              impact: null,
              nodes: '...other tests cover this...'
            }
          ];

          const out = results[0].nodes[0].node.source;
          results.forEach(res => {
            // attribute order is a pain in the lower back in IE, so we're not
            // comparing nodes. Check.run and Rule.run do this.
            res.nodes = '...other tests cover this...';
          });

          expect(JSON.parse(JSON.stringify(results))).toEqual(expected);
          expect(out).toMatch(
            /^<input(\s+type="text"|\s+aria-label="monkeys"){2,}>/
          );
          done();
        },
        isNotCalled
      );
    });

    it('should not run rules disabled by the options', done => {
      audit.run(
        { include: [axe.utils.getFlattenedTree()[0]] },
        {
          rules: {
            positive3: {
              enabled: false
            }
          }
        },
        results => {
          expect(results.length).toBe(3);
          done();
        },
        isNotCalled
      );
    });

    it('should ensure audit.run recieves preload options', done => {
      fixture.innerHTML = '<input aria-label="yo" type="text">';

      audit = new Audit();
      audit.addRule({
        id: 'preload1',
        selector: '*'
      });
      audit.run = (context, options, resolve, reject) => {
        const randomRule = this.rules[0];
        randomRule.run(
          context,
          options,
          ruleResult => {
            ruleResult.OPTIONS_PASSED = options;
            resolve([ruleResult]);
          },
          reject
        );
      };

      const preloadOptions = {
        preload: {
          assets: ['cssom']
        }
      };
      audit.run(
        { include: [axe.utils.getFlattenedTree(fixture)[0]] },
        {
          preload: preloadOptions
        },
        res => {
          expect(res).toBeDefined();

          expect(res).toHaveLength(1);
          expect(res[0]).toHaveProperty('OPTIONS_PASSED');

          const optionsPassed = res[0].OPTIONS_PASSED;
          expect(optionsPassed).toHaveProperty('preload');
          expect(optionsPassed.preload).toEqual(preloadOptions);

          // ensure cache is cleared
          expect(typeof axe._selectCache === 'undefined').toBe(true);

          done();
        },
        noop
      );
    });

    it.skip('should run rules (that do not need preload) and preload assets simultaneously', done => {
      /**
       * Note:
       * overriding and resolving both check and preload with a delay,
       * but the invoked timestamp should ensure that they were invoked almost immediately
       */

      fixture.innerHTML = '<div id="div1"></div><div id="div2"></div>';

      const runStartTime = new Date();
      const preloadInvokedTime = new Date();
      const noPreloadCheckedInvokedTime = new Date();
      const noPreloadRuleCheckEvaluateInvoked = false;
      const preloadOverrideInvoked = false;

      // override preload method
      axe.utils.preload = options => {
        preloadInvokedTime = new Date();
        preloadOverrideInvoked = true;

        return new Promise((res, rej) => {
          setTimeout(() => {
            res(true);
          }, 2000);
        });
      };

      audit = new Audit();
      // add a rule and check that does not need preload
      audit.addRule({
        id: 'no-preload',
        selector: 'div#div1',
        any: ['no-preload-check'],
        preload: false
      });
      audit.addCheck({
        id: 'no-preload-check',
        evaluate: (node, options, vNode, context) => {
          noPreloadCheckedInvokedTime = new Date();
          noPreloadRuleCheckEvaluateInvoked = true;
          const ready = this.async();
          setTimeout(() => {
            ready(true);
          }, 1000);
        }
      });

      // add a rule which needs preload
      audit.addRule({
        id: 'yes-preload',
        selector: 'div#div2',
        preload: true
      });

      const preloadOptions = {
        preload: {
          assets: ['cssom']
        }
      };

      const allowedDiff = 50;

      audit.run(
        { include: [axe.utils.getFlattenedTree(fixture)[0]] },
        {
          preload: preloadOptions
        },
        results => {
          expect(results).toBeDefined();
          // assert that check was invoked for rule(s)
          expect(noPreloadRuleCheckEvaluateInvoked).toBe(true);
          // assert preload was invoked
          expect(preloadOverrideInvoked).toBe(true);
          // assert that time diff(s)
          // assert that run check invoked immediately
          // choosing 5ms as an arbitary number
          expect(noPreloadCheckedInvokedTime - runStartTime).toBeLessThan(
            allowedDiff
          );
          // assert that preload  invoked immediately
          expect(preloadInvokedTime - runStartTime).toBeLessThan(allowedDiff);
          // ensure cache is clear
          expect(typeof axe._selectCache === 'undefined').toBe(true);
          // done
          done();
        },
        noop
      );
    });

    it.skip('should pass assets from preload to rule check that needs assets as context', done => {
      fixture.innerHTML = '<div id="div1"></div><div id="div2"></div>';

      const yesPreloadRuleCheckEvaluateInvoked = false;
      const preloadOverrideInvoked = false;

      const preloadData = {
        data: 'you got it!'
      };
      // override preload method
      axe.utils.preload = options => {
        preloadOverrideInvoked = true;
        return Promise.resolve({
          cssom: preloadData
        });
      };

      audit = new Audit();
      // add a rule and check that does not need preload
      audit.addRule({
        id: 'no-preload',
        selector: 'div#div1',
        preload: false
      });
      // add a rule which needs preload
      audit.addRule({
        id: 'yes-preload',
        selector: 'div#div2',
        preload: true,
        any: ['yes-preload-check']
      });
      audit.addCheck({
        id: 'yes-preload-check',
        evaluate: (node, options, vNode, context) => {
          yesPreloadRuleCheckEvaluateInvoked = true;
          this.data(context);
          return true;
        }
      });

      const preloadOptions = {
        preload: {
          assets: ['cssom']
        }
      };
      audit.run(
        { include: [axe.utils.getFlattenedTree(fixture)[0]] },
        {
          preload: preloadOptions
        },
        results => {
          expect(results).toBeDefined();
          // assert that check was invoked for rule(s)
          expect(yesPreloadRuleCheckEvaluateInvoked).toBe(true);
          // assert preload was invoked
          expect(preloadOverrideInvoked).toBe(true);

          // assert preload data that was passed to check
          const ruleResult = results.filter(r => {
            return (r.id = 'yes-preload' && r.nodes.length > 0);
          })[0];
          const checkResult = ruleResult.nodes[0].any[0];
          expect(checkResult.data).toBeDefined();
          expect(checkResult.data).toHaveProperty('cssom');
          expect(checkResult.data.cssom).toEqual(preloadData);
          // ensure cache is clear
          expect(typeof axe._selectCache === 'undefined').toBe(true);
          // done
          done();
        },
        noop
      );
    });

    it.skip('should continue to run rules and return result when preload is rejected', done => {
      fixture.innerHTML = '<div id="div1"></div><div id="div2"></div>';

      const preloadOverrideInvoked = false;
      const preloadNeededCheckInvoked = false;
      const rejectionMsg =
        'Boom! Things went terribly wrong! (But this was intended in this test)';

      // override preload method
      axe.utils.preload = options => {
        preloadOverrideInvoked = true;
        return Promise.reject(rejectionMsg);
      };

      audit = new Audit();
      // add a rule and check that does not need preload
      audit.addRule({
        id: 'no-preload',
        selector: 'div#div1',
        preload: false
      });
      // add a rule which needs preload
      audit.addRule({
        id: 'yes-preload',
        selector: 'div#div2',
        preload: true,
        any: ['yes-preload-check']
      });
      audit.addCheck({
        id: 'yes-preload-check',
        evaluate: (node, options, vNode, context) => {
          preloadNeededCheckInvoked = true;
          this.data(context);
          return true;
        }
      });

      const preloadOptions = {
        preload: {
          assets: ['cssom']
        }
      };
      audit.run(
        { include: [axe.utils.getFlattenedTree(fixture)[0]] },
        {
          preload: preloadOptions
        },
        results => {
          expect(results).toBeDefined();
          // assert preload was invoked
          expect(preloadOverrideInvoked).toBe(true);

          // assert that both rules ran, although preload failed
          expect(results).toHaveLength(2);

          // assert that because preload failed
          // cssom was not populated on context of repective check
          expect(preloadNeededCheckInvoked).toBe(true);
          const ruleResult = results.filter(r => {
            return (r.id = 'yes-preload' && r.nodes.length > 0);
          })[0];
          const checkResult = ruleResult.nodes[0].any[0];
          expect(checkResult.data).toBeDefined();
          expect(checkResult.data).not.toHaveProperty('cssom');
          // done
          done();
        },
        noop
      );
    });

    it('should continue to run rules and return result when axios time(s)out and rejects preload', done => {
      fixture.innerHTML = '<div id="div1"></div><div id="div2"></div>';

      // there is no stubbing here,
      // the actual axios call is invoked, and timedout immediately as timeout is set to 0.1

      let preloadNeededCheckInvoked = false;
      audit = new Audit();
      // add a rule and check that does not need preload
      audit.addRule({
        id: 'no-preload',
        selector: 'div#div1',
        preload: false
      });
      // add a rule which needs preload
      audit.addRule({
        id: 'yes-preload',
        selector: 'div#div2',
        preload: true,
        any: ['yes-preload-check']
      });
      audit.addCheck({
        id: 'yes-preload-check',
        evaluate: (node, options, vNode, context) => {
          preloadNeededCheckInvoked = true;
          this.data(context);
          return true;
        }
      });
      axe.setup();

      const preloadOptions = {
        preload: {
          assets: ['cssom'],
          timeout: 0.1
        }
      };
      audit.run(
        { include: [axe.utils.getFlattenedTree(fixture)[0]] },
        {
          preload: preloadOptions
        },
        results => {
          expect(results).toBeDefined();
          // assert that both rules ran, although preload failed
          expect(results).toHaveLength(2);

          // assert that because preload failed
          // cssom was not populated on context of repective check
          expect(preloadNeededCheckInvoked).toBe(true);
          const ruleResult = results.filter(r => {
            return (r.id = 'yes-preload' && r.nodes.length > 0);
          })[0];
          const checkResult = ruleResult.nodes[0].any[0];
          expect(checkResult.data).toBeDefined();
          expect(checkResult.data).not.toHaveProperty('cssom');
          // done
          done();
        },
        noop
      );
    });

    it.skip('should assign an empty array to axe._selectCache', done => {
      const saved = axe.utils.ruleShouldRun;
      axe.utils.ruleShouldRun = () => {
        expect(axe._selectCache.length).toBe(0);
        return false;
      };
      audit.run(
        { include: [axe.utils.getFlattenedTree()[0]] },
        {},
        () => {
          axe.utils.ruleShouldRun = saved;
          done();
        },
        isNotCalled
      );
    });

    it('should clear axe._selectCache', done => {
      audit.run(
        { include: [axe.utils.getFlattenedTree()[0]] },
        {
          rules: {}
        },
        () => {
          expect(typeof axe._selectCache === 'undefined').toBe(true);
          done();
        },
        isNotCalled
      );
    });

    it('should not run rules disabled by the configuration', done => {
      audit = new Audit();
      const success = true;
      audit.rules.push(
        new Rule({
          id: 'positive1',
          selector: '*',
          enabled: false,
          any: [
            {
              id: 'positive1-check1',
              evaluate: () => {
                success = false;
              }
            }
          ]
        })
      );
      audit.run(
        { include: [axe.utils.getFlattenedTree()[0]] },
        {},
        () => {
          expect(success).toBeTruthy();
          done();
        },
        isNotCalled
      );
    });

    it("should call the rule's run function", done => {
      const targetRule = mockRules[mockRules.length - 1];
      const rule = axe.utils.findBy(audit.rules, 'id', targetRule.id);
      let called = false;
      let orig;

      fixture.innerHTML = '<a href="#">link</a>';
      orig = rule.run;
      rule.run = (node, options, callback) => {
        called = true;
        callback({});
      };
      audit.run(
        { include: [axe.utils.getFlattenedTree()[0]] },
        {},
        () => {
          expect(called).toBe(true);
          rule.run = orig;
          done();
        },
        isNotCalled
      );
    });

    it('should pass the option to the run function', done => {
      const targetRule = mockRules[mockRules.length - 1];
      const rule = axe.utils.findBy(audit.rules, 'id', targetRule.id);
      let passed = false;
      let orig;
      let options;

      fixture.innerHTML = '<a href="#">link</a>';
      orig = rule.run;
      rule.run = (node, o, callback) => {
        expect(o).toEqual(options);
        passed = true;
        callback({});
      };
      options = { rules: {} };
      (options.rules[targetRule.id] = {}).data = 'monkeys';
      audit.run(
        { include: [axe.utils.getFlattenedTree()[0]] },
        options,
        () => {
          expect(passed).toBeTruthy();
          rule.run = orig;
          done();
        },
        isNotCalled
      );
    });

    it('should skip pageLevel rules if context is not set to entire page', () => {
      audit = new Audit();

      audit.rules.push(
        new Rule({
          pageLevel: true,
          enabled: true,
          evaluate: () => {
            expect(false).toBeTruthy();
          }
        })
      );

      audit.run(
        {
          include: [axe.utils.getFlattenedTree(document.body)[0]],
          page: false
        },
        {},
        results => {
          expect(results).toEqual([]);
        },
        isNotCalled
      );
    });

    it('should not halt if errors occur', done => {
      axe._audit = audit;
      audit.addRule({
        id: 'throw1',
        selector: '*',
        any: [
          {
            id: 'throw1-check1'
          }
        ]
      });
      audit.addCheck({
        id: 'throw1-check1',
        evaluate: () => {
          throw new Error('Launch the super sheep!');
        }
      });
      audit.run(
        { include: [axe.utils.getFlattenedTree(fixture)[0]] },
        {
          runOnly: {
            type: 'rule',
            values: ['throw1', 'positive1']
          }
        },
        () => {
          done();
        },
        isNotCalled
      );
    });

    it('should run axe.utils.normalizeRunOptions to ensure valid input', () => {
      fixture.innerHTML =
        '<input type="text" aria-label="monkeys">' +
        '<div id="monkeys">bananas</div>' +
        '<input aria-labelledby="monkeys" type="text">' +
        '<blink>FAIL ME</blink>';
      expect(() => {
        audit.run(
          { include: [axe.utils.getFlattenedTree(fixture)[0]] },
          { runOnly: { type: 'rule', values: ['foo'] } },
          noop,
          isNotCalled
        );
      }, 'unknown rule `foo` in options.runOnly').toThrow();
    });

    it('propagates DqElement options', async () => {
      fixtureSetup('<input id="input">');
      const results = await new Promise((resolve, reject) => {
        audit.run(
          { include: [axe.utils.getFlattenedTree(fixture)[0]] },
          { elementRef: true, absolutePaths: true },
          resolve,
          reject
        );
      });
      const { node } = results[0].nodes[0];
      expect(node.element).toBe(fixture.firstChild);
      expect(node.selector).toBe('html > body > #fixture > #input');
    });

    describe('when an error occurs', () => {
      let err;
      beforeEach(() => {
        err = new Error('Launch the super sheep!');
        audit.addRule({
          id: 'throw1',
          selector: '#fixture',
          any: [
            {
              id: 'throw1-check1'
            }
          ]
        });
        audit.addCheck({
          id: 'throw1-check1',
          evaluate: () => {
            throw err;
          }
        });
        axe.setup();
      });

      it('catches errors and resolves them as a cantTell result', done => {
        audit.run(
          { include: [axe._tree[0]] },
          { runOnly: { type: 'rule', values: ['throw1'] } },
          captureError(results => {
            expect(results).toHaveLength(1);
            assertErrorResults(results[0], err, '#fixture');
            done();
          }, done),
          isNotCalled
        );
      });

      it('should halt if an error occurs when debug is set', done => {
        const context = { include: [axe.utils.getFlattenedTree(fixture)[0]] };
        const options = {
          debug: true,
          runOnly: { type: 'rule', values: ['throw1'] }
        };
        audit.run(
          context,
          options,
          noop,
          captureError(reject => {
            expect(reject.message).toContain(err.message);
            done();
          }, done)
        );
      });
    });
  });

  describe('Audit#after', () => {
    it('should run Rule#after on any rule whose result is passed in', () => {
      /*eslint no-unused-vars:0*/
      audit = new Audit();
      let success = false;
      const options = { runOnly: 'hehe' };
      const results = [
        {
          id: 'hehe',
          monkeys: 'bananas'
        }
      ];
      audit.rules.push(
        new Rule({
          id: 'hehe',
          pageLevel: false,
          enabled: false
        })
      );

      audit.rules[0].after = (res, opts) => {
        expect(res).toBe(results[0]);
        expect(opts).toEqual(options);
        success = true;
      };

      audit.after(results, options);
      expect(success).toBe(true);
    });

    it('does not run Rule#after if the result has an error', () => {
      audit = new Audit();
      const results = [{ id: 'throw1', error: new Error('La la la!') }];
      let success = true;
      audit.rules.push(new Rule({ id: 'throw1' }));
      audit.rules[0].after = () => (success = false);
      audit.after(results, {});
      expect(results).toHaveLength(1);
      expect(results[0].error.message).toBe('La la la!');
      expect(success).toBe(true);
    });

    it('catches errors and passes them as a cantTell result', () => {
      audit = new Audit();
      const err = new SyntaxError('La la la!');
      const results = [
        {
          id: 'throw1',
          nodes: [
            {
              id: 'throw1-check1-after',
              node: new axe.utils.DqElement(fixture),
              any: [{ id: 'throw1-check1-after', result: false }],
              all: [],
              none: []
            }
          ]
        }
      ];
      audit.addRule({
        id: 'throw1',
        selector: '#fixture',
        any: [{ id: 'throw1-check1-after' }]
      });
      audit.addCheck({
        id: 'throw1-check1-after',
        after: () => {
          throw err;
        }
      });
      axe.setup();
      const result = audit.after(results, {});
      expect(result).toHaveLength(1);
      assertErrorResults(result[0], err, '#fixture');
    });

    it('throws errors when debug is set', () => {
      audit = new Audit();
      const err = new SyntaxError('La la la!');
      const options = { debug: true };
      const results = [
        {
          id: 'throw1',
          nodes: [
            {
              id: 'throw1-check1-after',
              node: new axe.utils.DqElement(fixture),
              any: [{ id: 'throw1-check1-after', result: false }],
              all: [],
              none: []
            }
          ]
        }
      ];
      audit.addRule({
        id: 'throw1',
        selector: '#fixture',
        any: [{ id: 'throw1-check1-after' }]
      });
      audit.addCheck({
        id: 'throw1-check1-after',
        after: () => {
          throw err;
        }
      });
      axe.setup();
      try {
        audit.after(results, options);
        expect(true).toBe(false) /* 'Should have thrown' */;
      } catch (actual) {
        assertEqualRuleError(actual, err);
      }
    });
  });
});
