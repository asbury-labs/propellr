import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
describe('reporters - v1', () => {
  let runResults,
    _results = [
      {
        id: 'gimmeLabel',
        helpUrl: 'things',
        description: 'something nifty',
        tags: ['tag1'],
        result: 'passed',
        violations: [],
        passes: [
          {
            result: 'passed',
            any: [
              {
                result: true,
                data: 'minkey'
              }
            ],
            all: [],
            none: [],
            node: {
              selector: ['minkey'],
              frames: [],
              source: '<minkey>chimp</minky>'
            }
          }
        ]
      },
      {
        id: 'idkStuff',
        description: 'something more nifty',
        pageLevel: true,
        result: 'failed',
        impact: 'cats',
        tags: ['tag2'],
        passes: [],
        violations: [
          {
            result: 'failed',
            all: [
              {
                result: false,
                data: 'pillock',
                impact: 'cats'
              }
            ],
            any: [],
            none: [],
            node: {
              selector: ['q', 'r', 'pillock'],
              source: '<pillock>george bush</pillock>'
            },
            impact: 'cats'
          }
        ]
      },
      {
        id: 'bypass',
        description: 'something even more nifty',
        tags: ['tag3'],
        impact: 'monkeys',
        result: 'failed',
        passes: [],
        violations: [
          {
            result: 'failed',
            impact: 'monkeys',
            none: [
              {
                data: 'foon',
                impact: 'monkeys',
                result: true
              }
            ],
            any: [],
            all: [],
            node: {
              selector: ['foon'],
              source: '<foon>telephone</foon>'
            }
          }
        ]
      },
      {
        id: 'incomplete',
        description: 'something yet more nifty',
        tags: ['tag4'],
        impact: 'monkeys',
        result: 'failed',
        passes: [],
        violations: [],
        incomplete: [
          {
            result: 'failed',
            impact: 'monkeys',
            none: [
              {
                data: 'foon',
                impact: 'monkeys',
                result: true
              }
            ],
            any: [],
            all: [],
            node: {
              selector: ['foon'],
              source: '<foon>telephone</foon>'
            }
          }
        ]
      },
      {
        id: 'blinky',
        description: 'something awesome',
        tags: ['tag4'],
        violations: [],
        result: 'passed',
        passes: [
          {
            result: 'passed',
            none: [
              {
                data: 'clueso',
                result: true
              }
            ],
            node: {
              selector: ['a', 'b', 'clueso'],
              source: '<clueso>nincompoop</clueso>'
            }
          }
        ]
      }
    ];
  beforeEach(() => {
    runResults = JSON.parse(JSON.stringify(_results));
    axe._load({
      messages: {},
      rules: [],
      data: {
        failureSummaries: {
          none: {
            failureMessage: function anonymous(it) {
              let out = 'Fix any of the following: \n';
              let arr1 = it;
              if (arr1) {
                let value,
                  i1 = -1,
                  l1 = arr1.length - 1;
                while (i1 < l1) {
                  value = arr1[(i1 += 1)];
                  out += ' ' + value + '\n';
                }
              }
              return out;
            }
          },
          all: {
            failureMessage: function anonymous() {
              throw new Error('shouldnt be executed');
            }
          },
          any: {
            failureMessage: function anonymous(it) {
              let out = 'Fix all of the following: \n';
              let arr1 = it;
              if (arr1) {
                let value,
                  i1 = -1,
                  l1 = arr1.length - 1;
                while (i1 < l1) {
                  value = arr1[(i1 += 1)];
                  out += ' ' + value + '\n';
                }
              }
              return out;
            }
          }
        }
      }
    });
  });

  afterEach(() => {
    axe._audit = null;
  });

  it('should merge the runRules results into violations and passes', () => {
    axe.getReporter('v1')(runResults, {}, results => {
      expect(typeof results).toBe('object');
      expect(Array.isArray(results.violations)).toBe(true);
      expect(results.violations).toHaveLength(2);
      expect(Array.isArray(results.passes)).toBe(true);
      expect(results.passes).toHaveLength(2);
    });
  });
  it('should add the rule id to the rule result', () => {
    axe.getReporter('v1')(runResults, {}, results => {
      expect(results.violations[0].id).toBe('idkStuff');
      expect(results.violations[1].id).toBe('bypass');
      expect(results.passes[0].id).toBe('gimmeLabel');
      expect(results.passes[1].id).toBe('blinky');
    });
  });
  it('should add tags to the rule result', () => {
    axe.getReporter('v1')(runResults, {}, results => {
      expect(results.violations[0].tags).toEqual(['tag2']);
      expect(results.violations[1].tags).toEqual(['tag3']);
      expect(results.passes[0].tags).toEqual(['tag1']);
      expect(results.passes[1].tags).toEqual(['tag4']);
    });
  });
  it('should add the rule help to the rule result', () => {
    axe.getReporter('v1')(runResults, {}, results => {
      expect(results.violations[0].helpUrl).toBeFalsy();
      expect(results.violations[1].helpUrl).toBeFalsy();
      expect(results.passes[0].helpUrl).toBe('things');
      expect(results.passes[1].helpUrl).toBeFalsy();
    });
  });
  it('should add the html to the node data', () => {
    axe.getReporter('v1')(runResults, {}, results => {
      expect(results.violations[0].nodes).toBeTruthy();
      expect(results.violations[0].nodes.length).toBe(1);
      expect(results.violations[0].nodes[0].html).toBe(
        '<pillock>george bush</pillock>'
      );
      expect(results.violations[1].nodes[0].html).toBe(
        '<foon>telephone</foon>'
      );
      expect(results.passes[0].nodes[0].html).toBe('<minkey>chimp</minky>');
      expect(results.passes[1].nodes[0].html).toBe(
        '<clueso>nincompoop</clueso>'
      );
    });
  });
  it('should add the failure summary to the node data', () => {
    axe.getReporter('v1')(runResults, {}, results => {
      expect(results.violations[0].nodes).toBeTruthy();
      expect(results.violations[0].nodes.length).toBe(1);
      expect(typeof results.violations[0].nodes[0].failureSummary).toBe(
        'string'
      );
      expect(typeof results.incomplete[0].nodes[0].failureSummary).toBe(
        'string'
      );
    });
  });
  it('should add the target selector array to the node data', () => {
    axe.getReporter('v1')(runResults, {}, results => {
      expect(results.violations[0].nodes).toBeTruthy();
      expect(results.violations[0].nodes.length).toBe(1);
      expect(results.violations[0].nodes[0].target).toEqual([
        'q',
        'r',
        'pillock'
      ]);
    });
  });
  it('should add the description to the rule result', () => {
    axe.getReporter('v1')(runResults, {}, results => {
      expect(results.violations[0].description).toBe('something more nifty');
      expect(results.violations[1].description).toBe(
        'something even more nifty'
      );
      expect(results.passes[0].description).toBe('something nifty');
      expect(results.passes[1].description).toBe('something awesome');
    });
  });
  it('should add the impact to the rule result', () => {
    axe.getReporter('v1')(runResults, {}, results => {
      expect(results.violations[0].impact).toBe('cats');
      expect(results.violations[0].nodes[0].impact).toBe('cats');
      expect(results.violations[1].impact).toBe('monkeys');
      expect(results.violations[1].nodes[0].impact).toBe('monkeys');
    });
  });
  it('should add environment data', () => {
    axe.getReporter('v1')(runResults, {}, results => {
      expect(results.url).toBeDefined();
      expect(results.timestamp).toBeDefined();
      expect(results.testEnvironment).toBeDefined();
      expect(results.testRunner).toBeDefined();
    });
  });
  it('should add toolOptions property', () => {
    axe.getReporter('v1')(runResults, {}, results => {
      expect(results.toolOptions).toBeDefined();
    });
  });
  it('uses the environmentData option instead of environment data if specified', () => {
    const environmentData = {
      myReporter: 'hello world'
    };
    axe.getReporter('v1')(
      runResults,
      { environmentData: environmentData },
      results => {
        expect(results.myReporter).toBe('hello world');
        expect(results.url).toBeUndefined();
        expect(results.timestamp).toBeUndefined();
        expect(results.testEnvironment).toBeUndefined();
        expect(results.testRunner).toBeUndefined();
      }
    );
  });
});
