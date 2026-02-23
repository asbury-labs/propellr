import { describe, it, expect } from 'vitest';
import { queryFixture } from '../../../testutils';

declare const axe: any;
describe('forms.isNativeSelect', function () {
  const isNativeSelect = axe.commons.forms.isNativeSelect;

  it('returns true for a select element', function () {
    const node = queryFixture('<select id="target"></select>');
    expect(isNativeSelect(node)).toBe(true);
  });

  it('returns false for non-select elements', function () {
    const nonSelectElements = ['a', 'h1', 'div', 'span', 'main'];
    nonSelectElements.forEach(function (nodeName) {
      const node = queryFixture(
        '<' + nodeName + ' id="target"></' + nodeName + '>'
      );
      expect(
        isNativeSelect(node),
        '<' + nodeName + '> is not a native select element'
      ).toBe(false);
    });
  });
});
