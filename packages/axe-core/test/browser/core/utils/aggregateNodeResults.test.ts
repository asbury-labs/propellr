import { describe, it, expect, beforeEach } from 'vitest';

declare const axe: any;
describe('axe.utils.aggregateNodeResults', () => {
  const FAIL = 'failed';
  const PASS = 'passed';
  const CANTTELL = 'cantTell';
  const INAPPLICABLE = 'inapplicable';

  // create an array of check results, padding input with defaults and
  // wrapping arrays where required
  function createTestResults() {
    const args = [].slice.call(arguments);
    return args.map(node => {
      ['any', 'all', 'none'].forEach(type => {
        if (typeof node[type] === 'undefined') {
          node[type] = [];
        } else if (Array.isArray(node[type])) {
          node[type] = node[type].map(val => {
            if (typeof val !== 'object') {
              return { result: val };
            } else {
              return val;
            }
          });
        } else {
          if (typeof node[type] !== 'object') {
            node[type] = { result: node[type] };
          }
          node[type] = [node[type]];
        }
      });
      return node;
    });
  }

  beforeEach(() => {
    axe._load({});
  });

  it('Should be `inapplicable` when no results are given', () => {
    let ruleResult = axe.utils.aggregateNodeResults([]);
    expect(ruleResult.result).toBe(INAPPLICABLE);
  });

  it('should assign FAIL to ruleResult over PASS', () => {
    let ruleResult = axe.utils.aggregateNodeResults(
      createTestResults({ all: false }, { all: true }, { all: true })
    );
    expect(ruleResult.result).toBe(FAIL);
    expect(ruleResult.violations).toHaveLength(1);
    expect(ruleResult.passes).toHaveLength(2);
  });

  it('should assign FAIL to ruleResult over CANTTELL', () => {
    let ruleResult = axe.utils.aggregateNodeResults(
      createTestResults({ all: false }, { all: 0 }, { all: true })
    );
    expect(ruleResult.result).toBe(FAIL);
    expect(ruleResult.violations).toHaveLength(1);
    expect(ruleResult.incomplete).toHaveLength(1);
    expect(ruleResult.passes).toHaveLength(1);
  });

  it('should assign PASS to ruleResult if there are only passing checks', () => {
    let ruleResult = axe.utils.aggregateNodeResults(
      createTestResults({ all: true }, { all: true }, { all: true })
    );
    expect(ruleResult.result).toBe(PASS);
    expect(ruleResult.passes).toHaveLength(3);
    expect(ruleResult.violations).toHaveLength(0);
  });

  it('should assign FAIL if there are no passing anys checks', () => {
    let ruleResult = axe.utils.aggregateNodeResults(
      createTestResults({ any: false }, { any: false }, { any: false })
    );
    expect(ruleResult.result).toBe(FAIL);
    expect(ruleResult.violations).toHaveLength(3);
    expect(ruleResult.passes).toHaveLength(0);
  });

  it('should assign CANTTELL over PASS', () => {
    let ruleResult = axe.utils.aggregateNodeResults(
      createTestResults({ all: true }, { all: 0 }, { all: 0 })
    );
    expect(ruleResult.result).toBe(CANTTELL);
    expect(ruleResult.incomplete).toHaveLength(2);
    expect(ruleResult.passes).toHaveLength(1);
  });

  it('should provide impact on incomplete', () => {
    let ruleResult = axe.utils.aggregateNodeResults(
      createTestResults({
        none: { result: undefined, impact: 'serious' }
      })
    );
    expect(ruleResult.impact).toBe('serious');
  });

  it('should raise the highest "raisedMetadata" on failing checks', () => {
    /*eslint indent:0 */
    let ruleResult = axe.utils.aggregateNodeResults(
      createTestResults(
        {
          none: { result: true, impact: 'moderate' },
          any: { result: true, impact: 'minor' },
          all: [
            { result: true, impact: 'critical' },
            { result: false, impact: 'serious' }
          ]
        },
        { none: { result: undefined, impact: 'critical' } },
        { none: { result: false, impact: 'critical' } }
      )
    );
    expect(ruleResult.impact).toBe('serious');
    expect(ruleResult.violations[0].impact).toBe('serious');
    expect(ruleResult.incomplete[0].impact).toBe('critical');
    expect(ruleResult.passes[0].impact).toBeNull();
  });
});
