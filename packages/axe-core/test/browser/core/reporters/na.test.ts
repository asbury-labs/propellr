import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
describe('reporters - na', () => {
  let runResults,
    _results = [
      {
        id: 'noMatch',
        helpUrl: 'somewhere',
        description: 'stuff',
        result: 'inapplicable',
        impact: null,
        tags: ['tag3'],
        violations: [],
        passes: []
      },
      {
        id: 'gimmeLabel',
        helpUrl: 'things',
        description: 'something nifty',
        result: 'passed',
        impact: null,
        tags: ['tag1'],
        violations: [],
        passes: [
          {
            result: 'passed',
            impact: null,
            any: [
              {
                result: true,
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

  it('should merge the runRules results into violations, passes and inapplicable', () => {
    axe.getReporter('na')(runResults, {}, results => {
      expect(typeof results).toBe('object');
      expect(Array.isArray(results.violations)).toBe(true);
      expect(results.violations).toHaveLength(1);
      expect(Array.isArray(results.passes)).toBe(true);
      expect(results.passes).toHaveLength(1);
      expect(Array.isArray(results.inapplicable)).toBe(true);
      expect(results.inapplicable).toHaveLength(1);
    });
  });
  it('should add the rule id to the rule result', () => {
    axe.getReporter('na')(runResults, {}, results => {
      expect(results.violations[0].id).toBe('idkStuff');
      expect(results.passes[0].id).toBe('gimmeLabel');
      expect(results.inapplicable[0].id).toBe('noMatch');
    });
  });
  it('should add tags to the rule result', () => {
    axe.getReporter('na')(runResults, {}, results => {
      expect(results.violations[0].tags).toEqual(['tag2']);
      expect(results.passes[0].tags).toEqual(['tag1']);
      expect(results.inapplicable[0].tags).toEqual(['tag3']);
    });
  });
  it('should add the rule help to the rule result', () => {
    axe.getReporter('na')(runResults, {}, results => {
      expect(!results.violations[0].helpUrl).toBeTruthy();
      expect(results.passes[0].helpUrl).toBe('things');
      expect(results.inapplicable[0].helpUrl).toBe('somewhere');
    });
  });
  it('should add the html to the node data', () => {
    axe.getReporter('na')(runResults, {}, results => {
      expect(results.violations[0].nodes).toBeTruthy();
      expect(results.violations[0].nodes.length).toBe(1);
      expect(results.violations[0].nodes[0].html).toBe(
        '<pillock>george bush</pillock>'
      );
      expect(results.passes[0].nodes[0].html).toBe('<minkey>chimp</minky>');
    });
  });
  it('should add the target selector array to the node data', () => {
    axe.getReporter('na')(runResults, {}, results => {
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
    axe.getReporter('na')(runResults, {}, results => {
      expect(results.violations[0].description).toBe('something more nifty');
      expect(results.passes[0].description).toBe('something nifty');
    });
  });
  it('should add the impact to the rule result', () => {
    axe.getReporter('na')(runResults, {}, results => {
      expect(results.violations[0].impact).toBe('cats');
      expect(results.violations[0].nodes[0].impact).toBe('cats');
      expect(!results.passes[0].impact).toBeTruthy();
      expect(!results.passes[0].nodes[0].impact).toBeTruthy();
      expect(results.passes[0].impact).toBeNull();
      expect(results.passes[0].nodes[0].impact).toBeNull();
    });
  });
  it('should map relatedNodes', () => {
    axe.getReporter('na')(runResults, {}, results => {
      expect(results.violations[0].nodes[0].all[0].relatedNodes).toHaveLength(
        1
      );
      expect(results.violations[0].nodes[0].all[0].relatedNodes[0].target).toBe(
        'joe'
      );
      expect(results.violations[0].nodes[0].all[0].relatedNodes[0].html).toBe(
        'bob'
      );

      expect(results.passes[0].nodes[0].any[0].relatedNodes).toHaveLength(1);
      expect(results.passes[0].nodes[0].any[0].relatedNodes[0].target).toBe(
        'bob'
      );
      expect(results.passes[0].nodes[0].any[0].relatedNodes[0].html).toBe(
        'fred'
      );
    });
  });
  it('should add environment data', () => {
    axe.getReporter('na')(runResults, {}, results => {
      expect(results.url).toBeDefined();
      expect(results.timestamp).toBeDefined();
      expect(results.testEnvironment).toBeDefined();
      expect(results.testRunner).toBeDefined();
    });
  });
  it('should add toolOptions property', () => {
    axe.getReporter('na')(runResults, {}, results => {
      expect(results.toolOptions).toBeDefined();
    });
  });
  it('uses the environmentData option instead of environment data if specified', () => {
    const environmentData = {
      myReporter: 'hello world'
    };
    axe.getReporter('na')(
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
