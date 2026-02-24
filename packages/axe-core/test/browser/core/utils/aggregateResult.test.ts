import { describe, it, expect, beforeEach } from 'vitest';

declare const axe: any;
describe('axe.utils.aggregateResult', () => {
  let results,
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
        id: 'idkStuff',
        description: 'something more nifty',
        pageLevel: true,
        result: 'failed',
        impact: 'cats',
        tags: ['tag2'],
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
        ],
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
        ],
        incomplete: [
          {
            result: 'cantTell',
            any: [
              {
                result: 0,
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
        id: 'blinky',
        description: 'something awesome',
        tags: ['tag4'],
        result: 'inapplicable',
        passes: [
          {
            result: 'passed',
            any: [
              {
                shouldIBeHere: 'no, this should be inapplicable!',
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
        ],
        violations: [],
        incomplete: []
      }
    ];

  beforeEach(() => {
    results = JSON.parse(JSON.stringify(_results));
  });

  it('creates an object with arrays as properties for each result', () => {
    const resultObject = axe.utils.aggregateResult(results);

    expect(Array.isArray(resultObject.passes)).toBe(true);
    expect(Array.isArray(resultObject.violations)).toBe(true);
    expect(Array.isArray(resultObject.incomplete)).toBe(true);
    expect(Array.isArray(resultObject.inapplicable)).toBe(true);
  });

  it('copies failures and passes to their respective arrays on the result object', () => {
    // insert 1 pass and 1 fail
    const input = [results[0], results[1]];
    const resultObject = axe.utils.aggregateResult(input);

    expect(resultObject.passes).toHaveLength(1);
    expect(resultObject.violations).toHaveLength(1);
    expect(resultObject.incomplete).toHaveLength(0);
    expect(resultObject.inapplicable).toHaveLength(0);

    // Objects are the same
    expect(resultObject.passes[0].nodes).toEqual(input[0].passes);
    expect(resultObject.violations[0].nodes).toEqual(input[1].violations);

    // Object is a copy
    expect(resultObject.passes[0].nodes).not.toBe(input[0].passes);
    expect(resultObject.violations[0].nodes).not.toBe(input[1].violations);
  });

  it('creates a duplicate of the result for each outcome it has', () => {
    // insert 1 fail, containing a pass, a fail and a cantTell result
    const input = [results[2]];
    const resultObject = axe.utils.aggregateResult(input);

    expect(resultObject.passes).toHaveLength(1);
    expect(resultObject.violations).toHaveLength(1);
    expect(resultObject.incomplete).toHaveLength(1);
    expect(resultObject.inapplicable).toHaveLength(0);

    // Objects are the same
    expect(resultObject.passes[0].nodes).toEqual(input[0].passes);
    expect(resultObject.violations[0].nodes).toEqual(input[0].violations);
    expect(resultObject.incomplete[0].nodes).toEqual(input[0].incomplete);
  });

  it('moves inapplicable results only to the inapplicable array', () => {
    // insert 1 fail, containing a pass, a fail and a cantTell result
    const input = [results[3]];
    const resultObject = axe.utils.aggregateResult(input);

    expect(resultObject.passes).toHaveLength(0);
    expect(resultObject.violations).toHaveLength(0);
    expect(resultObject.incomplete).toHaveLength(0);
    expect(resultObject.inapplicable).toHaveLength(1);

    expect(resultObject.inapplicable[0].id).toBe(input[0].id);
    expect(resultObject.inapplicable[0].description).toBe(input[0].description);
  });
});
