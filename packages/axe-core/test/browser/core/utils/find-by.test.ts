import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('axe.utils.findBy', () => {
  it('should find the first matching object', () => {
    const array = [
      {
        id: 'monkeys',
        foo: 'bar'
      },
      {
        id: 'bananas'
      },
      {
        id: 'monkeys',
        bar: 'baz'
      }
    ];

    expect(axe.utils.findBy(array, 'id', 'monkeys')).toBe(array[0]);
  });

  it('should return undefined with no match', () => {
    const array = [
      {
        id: 'monkeys',
        foo: 'bar'
      },
      {
        id: 'bananas'
      },
      {
        id: 'monkeys',
        bar: 'baz'
      }
    ];

    expect(axe.utils.findBy(array, 'id', 'macaque')).toBeUndefined();
  });

  it('should not throw if passed falsey first parameter', () => {
    expect(axe.utils.findBy(null, 'id', 'macaque')).toBeUndefined();
  });

  it('ignores any non-object elements in the array', () => {
    const obj = {
      id: 'monkeys',
      foo: 'bar'
    };
    const array = ['bananas', true, null, 123, obj];

    expect(axe.utils.findBy(array, 'id', 'monkeys')).toBe(obj);
  });

  it('only looks at owned properties', () => {
    const obj1 = { id: 'monkeys', eat: 'bananas' };
    const obj2 = Object.create(obj1);
    obj2.id = 'gorillas';
    expect(axe.utils.findBy([obj2, obj1], 'eat', 'bananas')).toBe(obj1);
  });
});
