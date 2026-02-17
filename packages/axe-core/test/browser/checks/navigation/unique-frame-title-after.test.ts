import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
/*eslint indent: 0*/
describe('unique-frame-title-after', function () {
  const checkContext = axe.testUtils.MockCheckContext();

  afterEach(function () {
    checkContext.reset();
  });

  it('should remove any check whose data only appears once', function () {
    const result = checks['unique-frame-title'].afterAll([
      {
        data: 'bananas'
      },
      {
        data: 'monkeys'
      },
      {
        data: 'bananas'
      },
      {
        data: 'apples'
      },
      {
        data: 'monkeys'
      }
    ]);

    expect(result).toEqual([
      {
        data: 'bananas',
        result: true
      },
      {
        data: 'monkeys',
        result: true
      },
      {
        data: 'bananas',
        result: true
      },
      {
        data: 'apples',
        result: false
      },
      {
        data: 'monkeys',
        result: true
      }
    ]);
  });
});
