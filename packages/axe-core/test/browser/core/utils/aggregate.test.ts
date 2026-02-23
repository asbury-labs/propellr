import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('aggregate', () => {
  const map = ['youngling', 'padawan', 'knight', 'master', 'grand master'];

  const values = ['knight', 'master', 'padawan'];

  it('takes a map, values array and initial value', () => {
    expect(typeof axe.utils.aggregate).toBe('function');
    expect(axe.utils.aggregate).toHaveLength(3);

    expect(() => {
      axe.utils.aggregate(map, values, 'youngling');
    }).not.toThrow();
  });

  it('does not change the values array', () => {
    const copy = [].concat(values);
    axe.utils.aggregate(map, values, 'youngling');
    expect(values).toEqual(copy);
  });

  it('picks the value with the highest index in the map, from the list of values', () => {
    let result = axe.utils.aggregate(map, ['knight', 'master', 'youngling']);
    expect(result).toBe('master');
  });

  it('considers the initial value in addition to the other values', () => {
    let result = axe.utils.aggregate(
      map,
      ['knight', 'master', 'youngling'],
      'grand master'
    );
    expect(result).toBe('grand master');
  });

  it('ignores values not on the map', () => {
    let result = axe.utils.aggregate(
      map,
      ['bounty hunter', 'sith lord'],
      'youngling'
    );
    expect(result).toBe('youngling');
  });

  it('returns undefined if no value was found', () => {
    expect(axe.utils.aggregate(map, ['smugler', 'droid'])).toBeUndefined();
  });
});
