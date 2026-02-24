/**
 * Vitest integration rule runner
 *
 * Replaces the Karma preprocessor + runner.js pattern.
 * Dynamically discovers all rule test directories and, for each .json test
 * definition, injects the companion .html fixture, runs axe.run(), and
 * asserts that the expected selectors appear in passes/violations/incomplete.
 */
import { describe, it, expect, beforeAll } from 'vitest';

// ---------------------------------------------------------------------------
// 1. Discover test fixtures via import.meta.glob (resolved at build time)
// ---------------------------------------------------------------------------

// All JSON test definitions (eagerly loaded as parsed objects)
const jsonModules = import.meta.glob<Record<string, unknown>>('./**/*.json', {
  eager: true,
  import: 'default'
});

// All HTML fixtures (eagerly loaded as raw strings)
const htmlModules = import.meta.glob<string>('./**/*.html', {
  eager: true,
  query: '?raw',
  import: 'default'
});

// ---------------------------------------------------------------------------
// 2. Types
// ---------------------------------------------------------------------------

interface RuleTestDef {
  description?: string;
  rule: string;
  violations?: string[][];
  passes?: string[][];
  incomplete?: string[][];
}

// ---------------------------------------------------------------------------
// 3. Helpers (run in browser context)
// ---------------------------------------------------------------------------

declare const axe: any;

/**
 * Wait for all iframes inside `context` to finish loading.
 */
function waitForFrames(context: HTMLElement): Promise<void> {
  return new Promise(resolve => {
    const frames = context.querySelectorAll('iframe');
    if (!frames.length) {return resolve();}

    let loaded = 0;
    const total = frames.length;

    function loadListener() {
      loaded++;
      if (loaded === total) {
        resolve();
      }
    }

    for (let i = 0; i < total; i++) {
      frames[i].addEventListener('load', loadListener);
    }
  });
}

/**
 * axe.run returns results grouped by rule — for single-rule runs the first
 * entry in each collection is the one we care about.
 */
function flattenResult(results: any) {
  return {
    passes: results.passes[0],
    violations: results.violations[0],
    incomplete: results.incomplete[0]
  };
}

// ---------------------------------------------------------------------------
// 4. Build and register test suites
// ---------------------------------------------------------------------------

// Pair each JSON with its companion HTML
const testCases: Array<{
  jsonKey: string;
  testDef: RuleTestDef;
  html: string;
}> = [];

for (const [jsonKey, testDef] of Object.entries(jsonModules)) {
  const htmlKey = jsonKey.replace(/\.json$/, '.html');
  const html = htmlModules[htmlKey];
  if (html === undefined) {
    // No companion HTML — skip (shouldn't happen for well-formed tests)
    continue;
  }
  testCases.push({
    jsonKey,
    testDef: testDef as unknown as RuleTestDef,
    html
  });
}

for (const { testDef, html } of testCases) {
  const ruleId = testDef.rule;
  const testName = testDef.description || `${ruleId} test`;

  const rule = axe.utils.getRule(ruleId);
  if (!rule) {continue;}

  // Skip rules that are deprecated AND disabled
  const deprecated = rule.tags.indexOf('deprecated') !== -1;
  const describeFn = deprecated && !rule.enabled ? describe.skip : describe;

  describeFn(ruleId, () => {
    describe(testName, () => {
      let results: ReturnType<typeof flattenResult>;

      beforeAll(async () => {
        const fixture = document.getElementById('fixture')!;
        // eslint-disable-next-line no-unsanitized/property -- test fixtures are trusted local HTML files
        fixture.innerHTML = html;

        await waitForFrames(fixture);

        // Firefox workaround — see:
        // https://github.com/dequelabs/axe-core/issues/4556
        // https://bugzilla.mozilla.org/show_bug.cgi?id=1912115
        await new Promise(resolve => setTimeout(resolve, 0));

        const r = await (axe.run as Function)(fixture, {
          /**
           * The debug flag helps log errors in a fairly detailed fashion,
           * when tests fail in webdriver
           */
          debug: true,
          performanceTimer: false,
          runOnly: { type: 'rule', values: [ruleId] }
        });

        // Assert that result is defined and well-formed
        expect(r).toBeDefined();
        expect(r).toHaveProperty('incomplete');
        expect(r).toHaveProperty('violations');
        expect(r).toHaveProperty('passes');

        // Assert incomplete(s) does not have error
        r.incomplete.forEach((incomplete: any) => {
          expect(incomplete.error).toBeUndefined();
        });

        results = flattenResult(r);
      });

      // ---------------------------------------------------------------
      // Collection assertions (passes / violations / incomplete)
      // ---------------------------------------------------------------

      function runCollectionTests(
        test: RuleTestDef,
        collection: 'passes' | 'violations' | 'incomplete'
      ) {
        if (!test[collection]) {return;}

        describe(collection, () => {
          let nodes: any[] | undefined;

          beforeAll(() => {
            if (typeof results[collection] === 'object') {
              // Shallow copy so splicing doesn't affect the original
              nodes = [...results[collection].nodes];
            }
          });

          test[collection]!.forEach((selector: string[]) => {
            it(`should find ${JSON.stringify(selector)}`, () => {
              if (!nodes) {
                expect.fail(`there are no ${collection}`);
                return;
              }

              const matches = nodes.filter(node => {
                for (let i = 0; i < selector.length; i++) {
                  if (node.target[i] !== selector[i]) {
                    return false;
                  }
                }
                return node.target.length === selector.length;
              });

              // Remove matched nodes so the "no other results" check works
              matches.forEach(node => {
                nodes!.splice(nodes!.indexOf(node), 1);
              });

              if (matches.length === 0) {
                expect.fail('Element not found');
              } else if (matches.length > 1) {
                expect.fail(
                  `Found ${matches.length} elements which match the target`
                );
              }
              // Exactly 1 match — pass
              expect(matches).toHaveLength(1);
            });
          });

          it('should not return other results', () => {
            if (nodes !== undefined) {
              const targets = nodes.map((node: any) => node.target);
              expect(targets).toEqual([]);
            } else {
              expect(test[collection]).toHaveLength(0);
            }
          });
        });
      }

      runCollectionTests(testDef, 'passes');
      runCollectionTests(testDef, 'violations');
      if (testDef.incomplete) {
        runCollectionTests(testDef, 'incomplete');
      }
    });
  });
}
