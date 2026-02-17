import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
describe('reporters - no-passes', () => {
  let runResults,
    _results = [
      {
        id: 'gimmeLabel',
        helpUrl: 'things',
        description: 'something nifty',
        tags: ['tag1'],
        result: 'passed',
        impact: null,
        violations: [],
        passes: [
          {
            result: 'passed',
            any: [
              {
                result: true,
                impact: null,
                relatedNodes: [
                  {
                    selector: 'bob',
                    source: 'fred'
                  }
                ],
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
                relatedNodes: [
                  {
                    selector: 'joe',
                    source: 'bob'
                  }
                ],
                result: false,
                data: 'pillock',
                impact: 'cats'
              },
              {
                relatedNodes: [],
                result: true
              }
            ],
            any: [
              {
                relatedNodes: [],
                result: true
              }
            ],
            none: [
              {
                relatedNodes: [],
                result: false
              }
            ],
            node: {
              selector: ['q', 'r', 'pillock'],
              source: '<pillock>george bush</pillock>'
            },
            impact: 'cats'
          }
        ]
      }
    ];
  beforeEach(() => {
    runResults = JSON.parse(JSON.stringify(_results));
    axe._load({
      messages: {},
      rules: [],
      data: {}
    });
  });

  afterEach(() => {
    axe._audit = null;
  });

  it('should merge the runRules results into violations and  exclude passes', () => {
    axe.getReporter('no-passes')(runResults, {}, results => {
      expect(typeof results).toBe('object');
      expect(Array.isArray(results.violations)).toBe(true);
      expect(results.violations).toHaveLength(1);
      expect(results.passes).toBeUndefined();
    });
  });
  it('should add the rule id to the rule result', () => {
    axe.getReporter('no-passes')(runResults, {}, results => {
      expect(results.violations[0].id).toBe('idkStuff');
    });
  });
  it('should add tags to the rule result', () => {
    axe.getReporter('no-passes')(runResults, {}, results => {
      expect(results.violations[0].tags).toEqual(['tag2']);
    });
  });
  it('should add the rule help to the rule result', () => {
    axe.getReporter('no-passes')(runResults, {}, results => {
      expect(results.violations[0].helpUrl).toBeFalsy();
    });
  });
  it('should add the html to the node data', () => {
    axe.getReporter('no-passes')(runResults, {}, results => {
      expect(results.violations[0].nodes).toBeTruthy();
      expect(results.violations[0].nodes.length).toBe(1);
      expect(results.violations[0].nodes[0].html).toBe(
        '<pillock>george bush</pillock>'
      );
    });
  });
  it('should add the target selector array to the node data', () => {
    axe.getReporter('no-passes')(runResults, {}, results => {
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
    axe.getReporter('no-passes')(runResults, {}, results => {
      expect(results.violations[0].description).toBe('something more nifty');
    });
  });
  it('should add the impact to the rule result', () => {
    axe.getReporter('no-passes')(runResults, {}, results => {
      expect(results.violations[0].impact).toBe('cats');
      expect(results.violations[0].nodes[0].impact).toBe('cats');
    });
  });
  it('should map relatedNodes', () => {
    axe.getReporter('no-passes')(runResults, {}, results => {
      expect(results.violations[0].nodes[0].all[0].relatedNodes).toHaveLength(
        1
      );
      expect(results.violations[0].nodes[0].all[0].relatedNodes[0].target).toBe(
        'joe'
      );
      expect(results.violations[0].nodes[0].all[0].relatedNodes[0].html).toBe(
        'bob'
      );
    });
  });
  it('should add environment data', () => {
    axe.getReporter('no-passes')(runResults, {}, results => {
      expect(results.url).toBeDefined();
      expect(results.timestamp).toBeDefined();
      expect(results.testEnvironment).toBeDefined();
      expect(results.testRunner).toBeDefined();
    });
  });
  it('should add toolOptions property', () => {
    axe.getReporter('no-passes')(runResults, {}, results => {
      expect(results.toolOptions).toBeDefined();
    });
  });
  it('uses the environmentData option instead of environment data if specified', () => {
    const environmentData = {
      myReporter: 'hello world'
    };
    axe.getReporter('no-passes')(
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
