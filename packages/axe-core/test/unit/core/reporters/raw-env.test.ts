import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

declare const axe: any;
describe('reporters - raw-env', () => {
  const fixture = document.getElementById('fixture');

  function createDqElement() {
    const node = document.createElement('div');
    fixture.appendChild(node);
    return new axe.utils.DqElement(node);
  }

  let runResults;

  beforeEach(() => {
    runResults = [
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
                data: 'minkey',
                relatedNodes: []
              }
            ],
            all: [],
            none: [],
            node: createDqElement()
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
                impact: 'cats',
                relatedNodes: []
              }
            ],
            any: [],
            none: [],
            node: createDqElement(),
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
                result: true,
                relatedNodes: []
              }
            ],
            any: [],
            all: [],
            node: createDqElement()
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
            any: [],
            all: [],
            none: [
              {
                data: 'clueso',
                result: true,
                relatedNodes: []
              }
            ],
            node: createDqElement()
          }
        ]
      }
    ];

    axe.testUtils.fixtureSetup();

    axe._load({});
    axe._cache.set('selectorData', {});
  });

  afterEach(() => {
    fixture.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('should serialize DqElements (#1195)', () => {
    axe.getReporter('rawEnv')(runResults, {}, results => {
      for (var i = 0; i < results.length; i++) {
        const result = results[i];
        for (var j = 0; j < result.passes.length; j++) {
          const p = result.passes[j];
          expect(p.node).not.toBeInstanceOf(axe.utils.DqElement);
        }
      }
    });
  });

  it('should pass env object', () => {
    axe.getReporter('rawEnv')(runResults, {}, results => {
      expect(results.env).toBeDefined();
      expect(results.env.url).toBeDefined();
      expect(results.env.timestamp).toBeDefined();
      expect(results.env.testEnvironment).toBeDefined();
      expect(results.env.testRunner).toBeDefined();
    });
  });

  it('uses the environmentData option instead of environment data if specified', () => {
    const environmentData = {
      myReporter: 'hello world'
    };
    axe.getReporter('rawEnv')(
      runResults,
      { environmentData: environmentData },
      results => {
        expect(results.env).toEqual(environmentData);
      }
    );
  });

  it('uses nodeSerializer', done => {
    const rawReporter = axe.getReporter('rawEnv');
    const spy = vi.spyOn(axe.utils.nodeSerializer, 'mapRawNodeResults');
    rawReporter(
      runResults,
      {},
      () => {
        expect(spy).toHaveBeenCalled();
        done();
      },
      done
    );
  });
});
