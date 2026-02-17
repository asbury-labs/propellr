import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('text.labelText', function () {
  const labelText = axe.commons.text.labelText;
  const queryFixture = axe.testUtils.queryFixture;

  it('returns the text of an implicit label', function () {
    const target = queryFixture(
      '<label>' + 'My implicit label<input id="target" />' + '</label>'
    );
    expect(labelText(target)).toBe('My implicit label');
  });

  it('returns the text of an explicit label', function () {
    const target = queryFixture(
      '<label for="target">My explicit label</label>' + '<input id="target" />'
    );
    expect(labelText(target)).toBe('My explicit label');
  });

  it('ignores the text of nested implicit labels', function () {
    const target = queryFixture(
      '<label>My outer label' +
        '<label>My inner label' +
        '<input id="target" />' +
        '</label>' +
        '</label>'
    );
    expect(labelText(target)).toBe('My inner label');
  });

  it('concatinates multiple explicit labels', function () {
    const target = queryFixture(
      '<label for="target">My label 1</label>' +
        '<label for="target">My label 2</label>' +
        '<input id="target" />'
    );
    expect(labelText(target)).toBe('My label 1 My label 2');
  });

  it('concatinates explicit and implicit labels', function () {
    const target = queryFixture(
      '<label for="target">My explicit label</label>' +
        '<label for="target">My implicit label' +
        '<input id="target" />' +
        '</label>'
    );
    expect(labelText(target)).toBe('My explicit label My implicit label');
  });

  it('returns label text in the DOM order', function () {
    const target = queryFixture(
      '<label for="target">Label 1</label>' +
        '<label for="target">My implicit ' +
        '<label for="target">Label 2</label>' +
        '<input id="target" />' +
        '</label>' +
        '<label for="target">Label 3</label>'
    );
    expect(labelText(target)).toBe('Label 1 My implicit Label 2 Label 3');
  });

  it('does not return the same label twice', function () {
    const target = queryFixture(
      '<label for="target">' +
        'My implicit and explicit label' +
        '<input id="target" />' +
        '</label>'
    );
    expect(labelText(target)).toBe('My implicit and explicit label');
  });

  it('ignores the value of a textbox', function () {
    const target = queryFixture(
      '<label>My label' +
        '<input value="without text" id="target" />' +
        '</label>'
    );
    expect(labelText(target)).toBe('My label');
  });

  it('ignores the content of a textarea', function () {
    const target = queryFixture(
      '<label>My label' +
        '<textarea id="target">Without text</textarea' +
        '</label>'
    );
    expect(labelText(target)).toBe('My label');
  });

  it('ignores the options of a select element', function () {
    const target = queryFixture(
      '<label>My label' +
        '<select id="target">' +
        '<option selected>Without</option>' +
        '<option>text</option>' +
        '</select>' +
        '</label>'
    );
    expect(labelText(target)).toBe('My label');
  });

  describe('with context = { inControlContext: true }', function () {
    it('returns `` ', function () {
      const target = queryFixture(
        '<label for="target">My explicit label</label>' +
          '<input id="target" />'
      );
      expect(labelText(target, { inControlContext: true })).toBe('');
    });
  });

  describe('with context = { inLabelledByContext: true }', function () {
    it('returns `` ', function () {
      const target = queryFixture(
        '<label for="target">My explicit label</label>' +
          '<input id="target" />'
      );
      expect(labelText(target, { inLabelledByContext: true })).toBe('');
    });
  });
});
