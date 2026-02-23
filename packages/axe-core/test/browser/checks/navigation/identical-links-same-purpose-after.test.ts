import { describe, it, expect, afterEach, afterAll } from 'vitest';
import { checks } from '../../../testutils';

describe('identical-links-same-purpose-after tests', function () {
  const fixture = document.getElementById('fixture')!;
  const check = checks['identical-links-same-purpose'];

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('returns results by clearing relatedNodes after ignoring nodes which has no data (or result is undefined)', function () {
    const nodeOneData = {
      data: null,
      relatedNodes: ['nodeOne'],
      result: undefined
    };
    const nodeTwoData = {
      data: {
        name: 'read more',
        urlProps: { hostname: 'abc.com' }
      },
      relatedNodes: ['nodeTwo'],
      result: true
    };
    const checkResults = [nodeOneData, nodeTwoData];

    const results = check.afterAll(checkResults);
    expect(results).toHaveLength(1);

    const result = results[0];
    expect(result.data).toEqual(nodeTwoData.data);
    expect(result.relatedNodes).toEqual([]);
    expect(result.result).toBe(true);
  });

  it('sets results of check result to `undefined` one of the native links do not have `urlProps` (and therefore removed as relatedNode)', function () {
    const nodeOneData = {
      data: {
        name: 'read more',
        urlProps: undefined
      },
      relatedNodes: ['nodeOne'],
      result: true
    };
    const nodeTwoData = {
      data: {
        name: 'read more',
        urlProps: { hostname: 'abc.com' }
      },
      relatedNodes: ['nodeTwo'],
      result: true
    };
    const checkResults = [nodeOneData, nodeTwoData];

    const results = check.afterAll(checkResults);
    expect(results).toHaveLength(1);

    const result = results[0];
    expect(result.data).toEqual(nodeOneData.data);
    expect(result.relatedNodes).toEqual(['nodeTwo']);
    expect(result.result).toBe(undefined);
  });

  it('sets results of check result to `undefined` if native links do not have same `urlProps` (values are different)', function () {
    const nodeOneData = {
      data: {
        name: 'follow us',
        urlProps: { hostname: 'facebook.com' }
      },
      relatedNodes: ['nodeOne'],
      result: true
    };
    const nodeTwoData = {
      data: {
        name: 'follow us',
        urlProps: { hostname: 'instagram.com' }
      },
      relatedNodes: ['nodeTwo'],
      result: true
    };
    const checkResults = [nodeOneData, nodeTwoData];

    const results = check.afterAll(checkResults);
    expect(results).toHaveLength(1);

    const result = results[0];
    expect(result.data).toEqual(nodeOneData.data);
    expect(result.relatedNodes).toEqual(['nodeTwo']);
    expect(result.result).toBe(undefined);
  });

  it('sets results of check result to `undefined` if native links do not have same `urlProps` (keys are different)', function () {
    const nodeOneData = {
      data: {
        name: 'follow us',
        urlProps: { abc: 'abc.com' }
      },
      relatedNodes: ['nodeOne'],
      result: true
    };
    const nodeTwoData = {
      data: {
        name: 'follow us',
        urlProps: { xyz: 'abc.com' }
      },
      relatedNodes: ['nodeTwo'],
      result: true
    };
    const checkResults = [nodeOneData, nodeTwoData];

    const results = check.afterAll(checkResults);
    expect(results).toHaveLength(1);

    const result = results[0];
    expect(result.data).toEqual(nodeOneData.data);
    expect(result.relatedNodes).toEqual(['nodeTwo']);
    expect(result.result).toBe(undefined);
  });

  it('sets results of check result to `true` if native links serve identical purpose', function () {
    const nodeOneData = {
      data: {
        name: 'Axe Core',
        urlProps: { hostname: 'deque.com', pathname: 'axe-core' }
      },
      relatedNodes: ['nodeOne'],
      result: true
    };
    const nodeTwoData = {
      data: {
        name: 'Axe Core',
        urlProps: { hostname: 'deque.com', pathname: 'axe-core' }
      },
      relatedNodes: ['nodeTwo'],
      result: true
    };
    const checkResults = [nodeOneData, nodeTwoData];

    const results = check.afterAll(checkResults);

    expect(results).toHaveLength(1);

    const result = results[0];
    expect(result.data).toEqual(nodeOneData.data);
    expect(result.relatedNodes).toEqual(['nodeTwo']);
    expect(result.result).toBe(true);
  });

  it('sets results of check result to `true` if ARIA links have different accessible names', function () {
    const nodeOneData = {
      data: {
        name: 'earth',
        urlProps: {}
      },
      relatedNodes: ['nodeOne'],
      result: true
    };

    const nodeTwoData = {
      data: {
        name: 'venus',
        urlProps: {}
      },
      relatedNodes: ['nodeTwo'],
      result: true
    };
    const checkResults = [nodeOneData, nodeTwoData];
    const results = check.afterAll(checkResults);
    expect(results).toHaveLength(2);

    expect(results[0].data).toEqual(nodeOneData.data);
    expect(results[0].relatedNodes).toEqual([]);
    expect(results[0].result).toBe(true);

    expect(results[1].data).toEqual(nodeTwoData.data);
    expect(results[1].relatedNodes).toEqual([]);
    expect(results[1].result).toBe(true);
  });
});
