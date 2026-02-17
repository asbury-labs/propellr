import { describe, it, afterEach, expect } from 'vitest';

declare const axe: any;
describe('axe.commons.color.incompleteData', function () {
  const fixture = document.getElementById('fixture');

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('should store a string with a key for the incomplete check', function () {
    const node = document.createElement('div');
    fixture.appendChild(node);
    axe.commons.color.incompleteData.set('fgColor', 'bgImage');

    expect(axe.commons.color.incompleteData.get('fgColor')).toBe('bgImage');
  });

  it('should throw an error if key is not a string', function () {
    expect(function () {
      axe.commons.color.incompleteData.set();
    }).toThrow(/key must be a string/);
  });

  it('should store a reason that matches a list of possibilities', function () {
    axe.commons.color.incompleteData.set('bgColor', 'bgImage');
    expect(axe.commons.color.incompleteData.get('bgColor')).toBe('bgImage');
  });

  it('should clear the data object on request', function () {
    axe.commons.color.incompleteData.set('fgColor', 'bgOverlap');
    axe.commons.color.incompleteData.clear();
    expect(
      axe.commons.color.incompleteData.get('fgColor'),
      'bgOverlap'
    ).toBeUndefined();
  });
});
