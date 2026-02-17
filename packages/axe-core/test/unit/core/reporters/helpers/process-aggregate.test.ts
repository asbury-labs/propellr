import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';

declare const axe: any;
describe('helpers.processAggregate', () => {
  let results, options;
  const helpers = axe._thisWillBeDeletedDoNotUse.helpers;
  const fixture = document.getElementById('fixture');

  beforeEach(() => {
    results = [
      {
        id: 'passed-rule',
        passes: [
          {
            result: 'passed',
            node: {
              element: document.createElement('div'),
              selector: ['header > .thing'],
              source: '<div class="thing">Thing</div>',
              xpath: ['/header/div[@class="thing"]'],
              ancestry: ['html > body > header > div']
            },
            any: [
              {
                id: 'passed-rule',
                relatedNodes: [
                  {
                    element: document.createElement('div'),
                    selector: ['footer > .thing'],
                    source: '<div class="thing">Thing</div>',
                    xpath: ['/footer/div[@class="thing"]'],
                    ancestry: ['html > body > footer > div']
                  }
                ]
              }
            ],
            all: [],
            none: []
          },
          {
            result: 'passed',
            node: {
              element: document.createElement('div'),
              selector: ['main > .thing'],
              source: '<div class="thing">Thing</div>',
              xpath: ['/main/div[@class="thing"]'],
              ancestry: ['html > body > main > div']
            },
            any: [
              {
                id: 'passed-rule',
                relatedNodes: [
                  {
                    element: document.createElement('div'),
                    selector: ['footer > .thing'],
                    source: '<div class="thing">Thing</div>',
                    xpath: ['/footer/div[@class="thing"]'],
                    ancestry: ['html > body > footer > div']
                  }
                ]
              }
            ],
            all: [],
            none: []
          }
        ],
        inapplicable: [],
        incomplete: [],
        violations: []
      },
      {
        id: 'failed-rule',
        violations: [
          {
            result: 'failed',
            node: {
              selector: ['#dopel'],
              source: ['<input id="dopel"/>'],
              xpath: '/main/input[@id="dopel"]',
              ancestry: ['html > body > main > input:nth-child(1)'],
              fromFrame: true
            },
            any: [
              {
                id: 'failed-rule',
                relatedNodes: [
                  {
                    element: document.createElement('input'),
                    selector: ['#dopel'],
                    source: ['<input id="dopel"/>'],
                    xpath: ['/main/input[@id="dopel"]'],
                    ancestry: ['html > body > main > input:nth-child(2)'],
                    fromFrame: true
                  }
                ]
              }
            ],
            all: [],
            none: []
          },
          {
            result: 'failed',
            node: {
              selector: ['#dopell'],
              source: '<input id="dopell"/>',
              xpath: ['/header/input[@id="dopell"]'],
              ancestry: ['html > body > main > input:nth-child(1)'],
              fromFrame: true
            },
            any: [
              {
                id: 'failed-rule',
                relatedNodes: [
                  {
                    element: document.createElement('input'),
                    selector: ['#dopell'],
                    source: '<input id="dopell"/>',
                    xpath: ['/header/input[@id="dopell"]'],
                    ancestry: ['html > body > main > input:nth-child(2)'],
                    fromFrame: true
                  }
                ]
              }
            ],
            all: [],
            none: []
          }
        ],
        inapplicable: [],
        passes: [],
        incomplete: []
      }
    ];
  });

  it('should remove the `result` property from each node in each ruleResult', () => {
    expect(
      results.find(r => {
        return r.id === 'passed-rule';
      }).passes[0].result
    ).toBeDefined();

    let resultObject = helpers.processAggregate(results, {});
    let ruleResult = resultObject.passes.find(r => {
      return r.id === 'passed-rule';
    });
    expect(ruleResult.nodes[0].result).toBeUndefined();
  });

  it('should remove the `node` property from each node in each ruleResult', () => {
    expect(
      results.find(r => {
        return r.id === 'passed-rule';
      }).passes[0].node
    ).toBeDefined();

    let resultObject = helpers.processAggregate(results, {});
    let ruleResult = resultObject.passes.find(r => {
      return r.id === 'passed-rule';
    });
    expect(ruleResult.nodes[0].node).toBeUndefined();
  });

  it('handles when a relatedNode is undefined', () => {
    // Add undefined to failed-rule
    results[1].violations[0].any[0].relatedNodes.unshift(undefined);
    const resultObject = helpers.processAggregate(results, {
      xpath: true,
      elementRef: true,
      ancestry: true
    });
    const { relatedNodes } = resultObject.violations[0].nodes[0].any[0];
    expect(relatedNodes[0]).toEqual({
      html: 'Undefined',
      target: [':root'],
      ancestry: [':root'],
      xpath: ['/'],
      element: null
    });
  });

  describe('axe.configure({ noHtml: true })', () => {
    afterEach(() => {
      axe.reset();
    });

    it('sets html to null on nodes', () => {
      axe.configure({ noHtml: true });
      const { passes, violations } = helpers.processAggregate(results, {});
      expect(passes[0].nodes[0].html).toBeNull();
      expect(violations[0].nodes[0].html).toBeNull();
    });

    it('sets html to null on relatedNodes', () => {
      axe.configure({ noHtml: true });
      const { passes, violations } = helpers.processAggregate(results, {});
      expect(passes[0].nodes[0].any[0].relatedNodes[0].html).toBeNull();
      expect(violations[0].nodes[0].any[0].relatedNodes[0].html).toBeNull();
    });
  });

  describe('`options` argument', () => {
    describe('`resultTypes` option', () => {
      it('should reduce the unwanted result types to 1 in the `resultObject`', () => {
        let resultObject = helpers.processAggregate(results, {
          resultTypes: ['violations']
        });
        expect(resultObject.passes).toBeDefined();
        expect(resultObject.passes[0].nodes.length).toBe(1);
        expect(resultObject.violations).toBeDefined();
        expect(resultObject.violations[0].nodes.length).toBe(2);
        resultObject = helpers.processAggregate(results, {
          resultTypes: ['passes']
        });
        expect(resultObject.passes[0].nodes.length).toBe(2);
        expect(resultObject.violations[0].nodes.length).toBe(1);
        expect(resultObject.incomplete).toBeDefined();
        expect(resultObject.inapplicable).toBeDefined();
      });

      it('should not compute selectors of filtered nodes', () => {
        const dqElm = new axe.utils.DqElement(fixture);
        Object.defineProperty(dqElm, 'ancestry', {
          get() {
            throw new Error('Should not be called');
          }
        });
        results[0].passes[1].node = dqElm;
        expect(() => {
          helpers.processAggregate(results, {
            resultTypes: ['violations']
          });
        }).not.toThrow();
      });
    });

    describe('`elementRef` option', () => {
      describe('when set to true', () => {
        beforeAll(() => {
          options = { elementRef: true };
        });

        describe("when node's, or relatedNode's, `fromFrame` equals false", () => {
          it('should add an `element` property to the subResult nodes or relatedNodes', () => {
            let resultObject = helpers.processAggregate(results, options);
            expect(resultObject.passes[0].nodes[0].element).toBeDefined();
            expect(
              resultObject.passes[0].nodes[0].any[0].relatedNodes[0].element
            ).toBeDefined();
          });
        });

        describe("when node's, or relatedNode's, `fromFrame` equals true", () => {
          it('should NOT add an `element` property to the subResult nodes or relatedNodes', () => {
            let resultObject = helpers.processAggregate(results, options);
            expect(resultObject.violations[0].nodes[0].element).toBeUndefined();
            expect(
              resultObject.violations[0].nodes[0].any[0].relatedNodes[0].element
            ).toBeUndefined();
          });
        });
      });

      describe('when set to false', () => {
        beforeAll(() => {
          options = { elementRef: false };
        });

        it('should NOT add an `element` property to the subResult nodes or relatedNodes', () => {
          let resultObject = helpers.processAggregate(results, options);
          expect(resultObject.passes[0].nodes[0].element).toBeUndefined();
          expect(resultObject.violations[0].nodes[0].element).toBeUndefined();
          expect(
            resultObject.passes[0].nodes[0].any[0].relatedNodes[0].element
          ).toBeUndefined();
          expect(
            resultObject.violations[0].nodes[0].any[0].relatedNodes[0].element
          ).toBeUndefined();
        });
      });

      describe('when not set at all', () => {
        it('should NOT add an `element` property to the subResult nodes or relatedNodes', () => {
          let resultObject = helpers.processAggregate(results, {});
          expect(resultObject.passes[0].nodes[0].element).toBeUndefined();
          expect(resultObject.violations[0].nodes[0].element).toBeUndefined();
          expect(
            resultObject.passes[0].nodes[0].any[0].relatedNodes[0].element
          ).toBeUndefined();
          expect(
            resultObject.violations[0].nodes[0].any[0].relatedNodes[0].element
          ).toBeUndefined();
        });
      });
    });

    describe('`selectors` option', () => {
      describe('when set to false', () => {
        beforeAll(() => {
          options = { selectors: false };
        });

        describe("when node's, or relatedNode's, `fromFrame` equals true", () => {
          it('should add a `target` property to the subResult nodes or relatedNodes', () => {
            let resultObject = helpers.processAggregate(results, options);
            expect(resultObject.violations[0].nodes[0].target).toBeDefined();
            expect(
              resultObject.violations[0].nodes[0].any[0].relatedNodes[0].target
            ).toBeDefined();
          });
        });

        describe("when node's, or relatedNode's, `fromFrame` equals false", () => {
          it('should NOT add a `target` property to the subResult nodes or relatedNodes', () => {
            let resultObject = helpers.processAggregate(results, options);
            expect(resultObject.passes[0].nodes[0].target).toBeUndefined();
            expect(
              resultObject.passes[0].nodes[0].any[0].relatedNodes[0].target
            ).toBeUndefined();
          });

          it('should not call the nodes selector property', () => {
            const dqElm = new axe.utils.DqElement(fixture);
            Object.defineProperty(dqElm, 'selector', {
              get() {
                throw new Error('Should not be called');
              }
            });
            results[0].passes[0].node = dqElm;
            expect(() => {
              helpers.processAggregate(results, options);
            }).not.toThrow();
          });
        });
      });

      describe('when set to true', () => {
        beforeAll(() => {
          options = { selectors: true };
        });

        it('should add a `target` property to the subResult nodes or relatedNodes', () => {
          let resultObject = helpers.processAggregate(results, options);
          expect(resultObject.passes[0].nodes[0].target).toBeDefined();
          expect(
            resultObject.passes[0].nodes[0].any[0].relatedNodes[0].target
          ).toBeDefined();
        });
      });

      describe('when not set at all', () => {
        it('should add a `target` property to the subResult nodes or relatedNodes', () => {
          let resultObject = helpers.processAggregate(results, {});
          expect(resultObject.passes[0].nodes[0].target).toBeDefined();
          expect(
            resultObject.passes[0].nodes[0].any[0].relatedNodes[0].target
          ).toBeDefined();
        });
      });
    });

    describe('`ancestry` option', () => {
      describe('when set to true', () => {
        it('should add an `ancestry` property to the subResult nodes or relatedNodes', () => {
          let resultObject = helpers.processAggregate(results, {
            ancestry: true
          });
          expect(resultObject.passes[0].nodes[0].ancestry).toBeDefined();
          expect(
            resultObject.passes[0].nodes[0].any[0].relatedNodes[0].ancestry
          ).toBeDefined();
        });
      });

      describe('when set to false', () => {
        it('should NOT add an `ancestry` property to the subResult nodes or relatedNodes', () => {
          let resultObject = helpers.processAggregate(results, {
            ancestry: false
          });
          expect(resultObject.passes[0].nodes[0].ancestry).toBeUndefined();
          expect(
            resultObject.passes[0].nodes[0].any[0].relatedNodes[0].ancestry
          ).toBeUndefined();
        });

        it('should not call the nodes ancestry property', () => {
          const dqElm = new axe.utils.DqElement(fixture, options, {
            selector: ['div'] // prevent axe._selectorData error
          });
          Object.defineProperty(dqElm, 'ancestry', {
            get() {
              throw new Error('Should not be called');
            }
          });
          results[0].passes[0].node = dqElm;
          expect(() => {
            helpers.processAggregate(results, options);
          }).not.toThrow();
        });
      });

      describe('when not set at all', () => {
        it('should NOT add an `ancestry` property to the subResult nodes or relatedNodes', () => {
          let resultObject = helpers.processAggregate(results, {});
          expect(resultObject.passes[0].nodes[0].ancestry).toBeUndefined();
          expect(
            resultObject.passes[0].nodes[0].any[0].relatedNodes[0].ancestry
          ).toBeUndefined();
        });
      });
    });

    describe('`xpath` option', () => {
      describe('when set to true', () => {
        beforeAll(() => {
          options = { xpath: true };
        });

        it('should add an `xpath` property to the subResult nodes or relatedNodes', () => {
          let resultObject = helpers.processAggregate(results, options);
          expect(resultObject.passes[0].nodes[0].xpath).toBeDefined();
          expect(
            resultObject.passes[0].nodes[0].any[0].relatedNodes[0].xpath
          ).toBeDefined();
        });
      });

      describe('when set to false', () => {
        beforeAll(() => {
          options = { xpath: false };
        });

        it('should NOT add an `xpath` property to the subResult nodes or relatedNodes', () => {
          let resultObject = helpers.processAggregate(results, options);
          expect(resultObject.passes[0].nodes[0].xpath).toBeUndefined();
          expect(
            resultObject.passes[0].nodes[0].any[0].relatedNodes[0].xpath
          ).toBeUndefined();
        });
      });

      describe('when not set at all', () => {
        it('should NOT add an `xpath` property to the subResult nodes or relatedNodes', () => {
          let resultObject = helpers.processAggregate(results, {});
          expect(resultObject.passes[0].nodes[0].xpath).toBeUndefined();
          expect(
            resultObject.passes[0].nodes[0].any[0].relatedNodes[0].xpath
          ).toBeUndefined();
        });

        it('should not call the nodes xpath property', () => {
          const dqElm = new axe.utils.DqElement(fixture, options, {
            selector: ['div'] // prevent axe._selectorData error
          });
          Object.defineProperty(dqElm, 'xpath', {
            get() {
              throw new Error('Should not be called');
            }
          });
          results[0].passes[0].node = dqElm;
          expect(() => {
            helpers.processAggregate(results, options);
          }).not.toThrow();
        });
      });
    });
  });
});
