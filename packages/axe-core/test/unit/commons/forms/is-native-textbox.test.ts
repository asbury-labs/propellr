import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('forms.isNativeTextbox', function () {
  const isNativeTextbox = axe.commons.forms.isNativeTextbox;
  const queryFixture = axe.testUtils.queryFixture;

  it('returns true for a text inputs', function () {
    const textInputs = [
      'date',
      'datetime',
      'datetime-local',
      'email',
      'month',
      'number',
      'range',
      'search',
      'tel',
      'text',
      'time',
      'url',
      'week'
    ];
    textInputs.forEach(function (type) {
      const node = queryFixture('<input id="target" type="' + type + '"/>');
      expect(
        isNativeTextbox(node),
        '<input type="' + type + '"> is a native text input'
      ).toBe(true);
    });
  });

  it('returns true for a textarea element', function () {
    const node = queryFixture('<textarea id="target"/>');
    expect(isNativeTextbox(node)).toBe(true);
  });

  it('returns false for non-text inputs', function () {
    const nonTextInputs = [
      'button',
      'checkbox',
      'file',
      'hidden',
      'image',
      'password',
      'radio',
      'reset',
      'submit',
      'color'
    ];
    nonTextInputs.forEach(function (type) {
      const node = queryFixture('<input id="target" type="' + type + '"/>');

      expect(
        isNativeTextbox(node),
        '<input type="' + type + '"> is not a native text input'
      ).toBe(false);
    });
  });

  it('return false for aria textbox elements', function () {
    const node = queryFixture('<div id="target" role="textbox"></div>');
    expect(isNativeTextbox(node)).toBe(false);
  });

  it('should ignore type case', function () {
    const node = queryFixture('<input id="target" type="TEXT"/>');
    expect(isNativeTextbox(node)).toBe(true);
  });
});
