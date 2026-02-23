import { describe, it, expect, afterEach } from 'vitest';
import {
  getCheckEvaluate,
  MockCheckContext,
  queryFixture
} from '../../../testutils';

describe('unique-frame-title', function () {
  const checkContext = MockCheckContext();

  afterEach(function () {
    checkContext.reset();
  });

  it('should log title to data and return true', function () {
    const vNode = queryFixture('<iframe id="target" title="bananas"></iframe>');
    expect(
      getCheckEvaluate('unique-frame-title').call(checkContext, null, {}, vNode)
    ).toBe(true);
    expect(checkContext._data).toBe('bananas');
  });

  it('should convert text to lower case', function () {
    const vNode = queryFixture(
      '<iframe id="target" title="\t  app\t \n \rle  "></iframe>'
    );
    getCheckEvaluate('unique-frame-title').call(checkContext, null, {}, vNode);
    expect(checkContext._data).toBe('app le');
  });

  it('should take out space differences', function () {
    const vNode = queryFixture('<iframe id="target" title="APPLE"></iframe>');
    getCheckEvaluate('unique-frame-title').call(checkContext, null, {}, vNode);
    expect(checkContext._data).toBe('apple');
  });
});
