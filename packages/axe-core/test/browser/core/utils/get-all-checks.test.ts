import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('axe.utils.getAllChecks', () => {
  it('should concatenate all 3 check collections', () => {
    const r = {
      any: ['any:foo', 'any:bar'],
      all: ['all:foo', 'all:bar'],
      none: ['none:foo', 'none:bar']
    };
    expect(axe.utils.getAllChecks(r)).toEqual([
      'any:foo',
      'any:bar',
      'all:foo',
      'all:bar',
      'none:foo',
      'none:bar'
    ]);
  });

  it('should safely ignore missing collections - all', () => {
    const r = {
      any: ['any:foo', 'any:bar'],
      none: ['none:foo', 'none:bar']
    };
    expect(axe.utils.getAllChecks(r)).toEqual([
      'any:foo',
      'any:bar',
      'none:foo',
      'none:bar'
    ]);
  });

  it('should safely ignore missing collections - any', () => {
    const r = {
      all: ['all:foo', 'all:bar'],
      none: ['none:foo', 'none:bar']
    };
    expect(axe.utils.getAllChecks(r)).toEqual([
      'all:foo',
      'all:bar',
      'none:foo',
      'none:bar'
    ]);
  });

  it('should safely ignore missing collections - none', () => {
    const r = {
      any: ['any:foo', 'any:bar'],
      all: ['all:foo', 'all:bar']
    };
    expect(axe.utils.getAllChecks(r)).toEqual([
      'any:foo',
      'any:bar',
      'all:foo',
      'all:bar'
    ]);
  });
});
