import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('axe.utils.nodeSorter', () => {
  function $id(id) {
    return document.getElementById(id);
  }

  const fixture = document.getElementById('fixture');

  it('should exist', () => {
    expect(typeof axe.utils.nodeSorter).toBe('function');
  });

  it('should return -1 if a comes before b', () => {
    fixture.innerHTML = '<div id="a"></div><div id="b"></div>';

    expect(
      axe.utils.nodeSorter({ actualNode: $id('a') }, { actualNode: $id('b') })
    ).toBe(-1);
  });

  it('should return -1 if a comes before b - nested', () => {
    fixture.innerHTML = '<div id="a"><div id="b"></div></div>';

    expect(
      axe.utils.nodeSorter({ actualNode: $id('a') }, { actualNode: $id('b') })
    ).toBe(-1);
  });

  it('should return 1 if b comes before a', () => {
    fixture.innerHTML = '<div id="b"></div><div id="a"></div>';

    expect(
      axe.utils.nodeSorter({ actualNode: $id('a') }, { actualNode: $id('b') })
    ).toBe(1);
  });

  it('should return 1 if b comes before a - nested', () => {
    fixture.innerHTML = '<div id="b"><div id="a"></div></div>';

    expect(
      axe.utils.nodeSorter({ actualNode: $id('a') }, { actualNode: $id('b') })
    ).toBe(1);
  });

  it('should return 0 if a === b', () => {
    fixture.innerHTML = '<div id="a"></div>';

    expect(
      axe.utils.nodeSorter({ actualNode: $id('a') }, { actualNode: $id('a') })
    ).toBe(0);
  });
});
