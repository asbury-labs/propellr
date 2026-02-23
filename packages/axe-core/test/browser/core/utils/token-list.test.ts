import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('axe.utils.tokenList', () => {
  it('should split by space', () => {
    expect(axe.utils.tokenList('bananas monkeys 42')).toEqual([
      'bananas',
      'monkeys',
      '42'
    ]);
  });

  it('should trim first', () => {
    expect(axe.utils.tokenList(' \r   bananas monkeys 42	\n  ')).toEqual([
      'bananas',
      'monkeys',
      '42'
    ]);
  });

  it('should collapse whitespace', () => {
    expect(axe.utils.tokenList(' \r   bananas \r \n	monkeys		42	\n  ')).toEqual([
      'bananas',
      'monkeys',
      '42'
    ]);
  });

  it('should return empty string array for null value', () => {
    expect(axe.utils.tokenList(null)).toEqual(['']);
  });
});
