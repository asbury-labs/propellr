import { describe, it, expect } from 'vitest';
import { fixtureSetup } from '../../../testutils';

declare const axe: any;
describe('text.nativeTextMethods', () => {
  const text = axe.commons.text;
  const nativeTextMethods = text.nativeTextMethods;

  describe('valueText', () => {
    const valueText = nativeTextMethods.valueText;
    it('returns the value of actualNode', () => {
      fixtureSetup('<input value="foo" />');
      const input = axe.utils.querySelectorAll(axe._tree[0], 'input')[0];
      expect(valueText(input)).toBe('foo');
    });

    it('returns `` when there is no value', () => {
      fixtureSetup('<input />');
      const input = axe.utils.querySelectorAll(axe._tree[0], 'input')[0];
      expect(valueText(input)).toBe('');
    });
  });

  describe('buttonDefaultText', () => {
    const buttonDefaultText = nativeTextMethods.buttonDefaultText;
    it('returns the default button text', () => {
      fixtureSetup(
        '<input type="submit" />' +
          '<input type="image" />' +
          '<input type="reset" />' +
          '<input type="button" />'
      );
      const inputs = axe.utils.querySelectorAll(axe._tree[0], 'input');
      expect(buttonDefaultText(inputs[0])).toBe('Submit');
      expect(buttonDefaultText(inputs[1])).toBe('Submit');
      expect(buttonDefaultText(inputs[2])).toBe('Reset');
      expect(buttonDefaultText(inputs[3])).toBe('');
    });

    it('returns `` when the element is not a button', () => {
      fixtureSetup('<input type="text">');
      const input = axe.utils.querySelectorAll(axe._tree[0], 'input')[0];
      expect(buttonDefaultText(input)).toBe('');
    });

    it('returns the default button text with mixed-case types', () => {
      fixtureSetup(
        '<input type="SUBMIT" />' +
          '<input type="ImAGE" />' +
          '<input type="ResET" />' +
          '<input type="buTTON" />'
      );
      const inputs = axe.utils.querySelectorAll(axe._tree[0], 'input');
      expect(buttonDefaultText(inputs[0])).toBe('Submit');
      expect(buttonDefaultText(inputs[1])).toBe('Submit');
      expect(buttonDefaultText(inputs[2])).toBe('Reset');
      expect(buttonDefaultText(inputs[3])).toBe('');
    });
  });

  describe('altText', () => {
    const altText = nativeTextMethods.altText;
    it('returns the alt attribute of actualNode', () => {
      fixtureSetup('<img alt="foo" />');
      const img = axe.utils.querySelectorAll(axe._tree[0], 'img')[0];
      expect(altText(img)).toBe('foo');
    });

    it('returns `` when there is no alt', () => {
      fixtureSetup('<img />');
      const img = axe.utils.querySelectorAll(axe._tree[0], 'img')[0];
      expect(altText(img)).toBe('');
    });
  });

  describe('figureText', () => {
    it('returns the figcaption text', () => {
      const figureText = nativeTextMethods.figureText;
      fixtureSetup(
        '<figure>' +
          '  <figcaption>My caption</figcaption>' +
          '  some content' +
          '</figure>'
      );
      const figure = axe.utils.querySelectorAll(axe._tree[0], 'figure')[0];
      expect(figureText(figure)).toBe('My caption');
    });

    it('returns `` when there is no figcaption', () => {
      const figureText = nativeTextMethods.figureText;
      fixtureSetup('<figure>' + '  some content' + '</figure>');
      const figure = axe.utils.querySelectorAll(axe._tree[0], 'figure')[0];
      expect(figureText(figure)).toBe('');
    });

    it('returns `` when if the figcaption is nested in another figure', () => {
      const figureText = nativeTextMethods.figureText;
      fixtureSetup(
        '<figure id="fig1">' +
          '  <figure>' +
          '    <figcaption>No caption</figcaption>' +
          '    some content' +
          '  </figure>' +
          '  some other content' +
          '</figure>'
      );
      const figure = axe.utils.querySelectorAll(axe._tree[0], '#fig1')[0];
      expect(figureText(figure)).toBe('');
    });
  });

  describe('tableCaptionText', () => {
    const tableCaptionText = nativeTextMethods.tableCaptionText;
    it('returns the table caption text', () => {
      fixtureSetup(
        '<table>' +
          '  <caption>My caption</caption>' +
          '  <tr><th>heading</th></tr>' +
          '  <tr><td>data</td></tr>' +
          '</table>'
      );
      const table = axe.utils.querySelectorAll(axe._tree[0], 'table')[0];
      expect(tableCaptionText(table)).toBe('My caption');
    });

    it('returns `` when there is no caption', () => {
      fixtureSetup(
        '<table>' +
          '  <tr><th>heading</th></tr>' +
          '  <tr><td>data</td></tr>' +
          '</table>'
      );
      const table = axe.utils.querySelectorAll(axe._tree[0], 'table')[0];
      expect(tableCaptionText(table)).toBe('');
    });

    it('returns `` when if the caption is nested in another table', () => {
      fixtureSetup(
        '<table id="tbl1">' +
          '  <tr><td>' +
          '    <table>' +
          '      <caption>My caption</caption>' +
          '      <tr><th>heading</th></tr>' +
          '      <tr><td>data</td></tr>' +
          '    </table>' +
          '  </th></tr>' +
          '</table>'
      );
      const table = axe.utils.querySelectorAll(axe._tree[0], '#tbl1')[0];
      expect(tableCaptionText(table)).toBe('');
    });
  });

  describe('fieldsetLegendText', () => {
    it('returns the legend text', () => {
      const fieldsetLegendText = nativeTextMethods.fieldsetLegendText;
      fixtureSetup(
        '<fieldset>' +
          '  <legend>My legend</legend>' +
          '  some content' +
          '</fieldset>'
      );
      const fieldset = axe.utils.querySelectorAll(axe._tree[0], 'fieldset')[0];
      expect(fieldsetLegendText(fieldset)).toBe('My legend');
    });

    it('returns `` when there is no legend', () => {
      const fieldsetLegendText = nativeTextMethods.fieldsetLegendText;
      fixtureSetup('<fieldset>' + '  some content' + '</fieldset>');
      const fieldset = axe.utils.querySelectorAll(axe._tree[0], 'fieldset')[0];
      expect(fieldsetLegendText(fieldset)).toBe('');
    });

    it('returns `` when if the legend is nested in another fieldset', () => {
      const fieldsetLegendText = nativeTextMethods.fieldsetLegendText;
      fixtureSetup(
        '<fieldset id="fig1">' +
          '  <fieldset>' +
          '    <legend>No legend</legend>' +
          '    some content' +
          '  </fieldset>' +
          '  some other content' +
          '</fieldset>'
      );
      const fieldset = axe.utils.querySelectorAll(axe._tree[0], '#fig1')[0];
      expect(fieldsetLegendText(fieldset)).toBe('');
    });
  });

  describe('svgTitleText', () => {
    const svgTitleText = nativeTextMethods.svgTitleText;
    it('returns the title text', () => {
      fixtureSetup(
        '<svg>' + '  <title>My title</title>' + '  some content' + '</svg>'
      );
      const svg = axe.utils.querySelectorAll(axe._tree[0], 'svg')[0];
      expect(svgTitleText(svg)).toBe('My title');
    });

    it('returns `` when there is no title', () => {
      it('returns the title text', () => {
        fixtureSetup('<svg>' + '  some content' + '</svg>');
        const svg = axe.utils.querySelectorAll(axe._tree[0], 'svg')[0];
        expect(svgTitleText(svg)).toBe('');
      });
    });

    it('returns `` when if the title is nested in another svg', () => {
      it('returns the title text', () => {
        fixtureSetup(
          '<svg id="fig1">' +
            '  <svg>' +
            '    <title>No title</title>' +
            '    some content' +
            '  </svg>' +
            '  some other content' +
            '</svg>'
        );
        const svg = axe.utils.querySelectorAll(axe._tree[0], '#fig1')[0];
        expect(svgTitleText(svg)).toBe('');
      });
    });
  });

  describe('singleSpace', () => {
    const singleSpace = nativeTextMethods.singleSpace;
    it('returns a single space', () => {
      expect(singleSpace()).toBe(' ');
    });
  });

  describe('placeholderText', () => {
    const placeholderText = nativeTextMethods.placeholderText;
    it('returns the placeholder attribute of actualNode', () => {
      fixtureSetup('<input placeholder="foo" />');
      const input = axe.utils.querySelectorAll(axe._tree[0], 'input')[0];
      expect(placeholderText(input)).toBe('foo');
    });

    it('returns `` when there is no placeholder', () => {
      fixtureSetup('<input />');
      const input = axe.utils.querySelectorAll(axe._tree[0], 'input')[0];
      expect(placeholderText(input)).toBe('');
    });
  });
});
