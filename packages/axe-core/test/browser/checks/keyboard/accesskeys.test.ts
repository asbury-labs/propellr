import { describe, it, expect, afterEach, afterAll } from 'vitest';
import {
  checkSetup,
  checks,
  getCheckEvaluate,
  MockCheckContext
} from '../../../testutils';

describe('accesskeys', () => {
  const checkContext = MockCheckContext();
  const checkEvaluate = getCheckEvaluate('accesskeys');

  afterEach(() => {
    checkContext.reset();
  });

  it('should return true and record accesskey', () => {
    const params = checkSetup('<div id="target" accesskey="A"></div>');
    expect(checkEvaluate.apply(checkContext, params)).toBe(true);

    expect(checkContext._data).toBe('A');
    expect(checkContext._relatedNodes).toHaveLength(1);
    expect(checkContext._relatedNodes[0]).toBe(params[0]);
  });

  it('ignores hidden nodes', () => {
    const params = checkSetup(
      '<div id="target" accesskey="A" style="display: none"></div>'
    );
    expect(checkEvaluate.apply(checkContext, params)).toBe(true);

    expect(checkContext._data).toBeNull();
  });

  it('does not ignore visibly hidden nodes', () => {
    const params = checkSetup(
      '<div id="target" accesskey="A" style="opacity: 0"></div>'
    );
    expect(checkEvaluate.apply(checkContext, params)).toBe(true);

    expect(checkContext._data).toBe('A');
    expect(checkContext._relatedNodes).toHaveLength(1);
    expect(checkContext._relatedNodes[0]).toBe(params[0]);
  });

  it('does not ignore screen reader hidden nodes', () => {
    const params = checkSetup(
      '<div id="target" accesskey="A" aria-hidden="true"></div>'
    );
    expect(checkEvaluate.apply(checkContext, params)).toBe(true);

    expect(checkContext._data).toBe('A');
    expect(checkContext._relatedNodes).toHaveLength(1);
    expect(checkContext._relatedNodes[0]).toBe(params[0]);
  });

  describe('after', () => {
    it('should push duplicates onto relatedNodes', () => {
      const results = [
        { data: 'A', relatedNodes: ['bob'] },
        { data: 'A', relatedNodes: ['fred'] }
      ];

      const result = checks.accesskeys.afterAll(results);

      expect(result).toHaveLength(1);
      expect(result[0].data).toBe('A');
      expect(result[0].relatedNodes).toHaveLength(1);
      expect(result[0].relatedNodes[0]).toBe('fred');
    });

    it('should remove non-unique accesskeys and toggle result', () => {
      const results = [
        { data: 'A', relatedNodes: ['bob'] },
        { data: 'A', relatedNodes: ['joe'] },
        { data: 'B', relatedNodes: ['fred'] }
      ];

      const result = checks.accesskeys.afterAll(results);

      expect(result).toHaveLength(2);
      expect(result[0].result).toBe(true);
      expect(result[1].result).toBe(false);
    });

    it('should consider accesskeys with different cases as the same result', () => {
      const result = checks.accesskeys.afterAll([
        { data: 'A', relatedNodes: ['bob'] },
        { data: 'a', relatedNodes: ['fred'] }
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].data).toBe('A');
      expect(result[0].relatedNodes).toHaveLength(1);
      expect(result[0].relatedNodes[0]).toBe('fred');
    });
  });
});
