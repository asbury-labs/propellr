import { describe, it, afterEach, expect } from 'vitest';
import { fixtureSetup } from '../../../testutils';

declare const axe: any;
describe('dom.isInTextBlock', function () {
  const fixture = document.getElementById('fixture');

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('returns true if the element is a node in a block of text', function () {
    fixtureSetup(
      '<p>Some paragraph with text ' +
        '  <a href="" id="link">link</a>' +
        '</p>'
    );
    const link = document.getElementById('link');
    expect(axe.commons.dom.isInTextBlock(link)).toBe(true);
  });

  it('returns false if the element is a block', function () {
    fixtureSetup(
      '<p>Some paragraph with text ' +
        '  <a href="" id="link" style="display:block">link</a>' +
        '</p>'
    );
    const link = document.getElementById('link');
    expect(axe.commons.dom.isInTextBlock(link)).toBe(false);
  });

  it('returns false if the element has the only text in the block', function () {
    fixtureSetup('<p><a href="" id="link">link</a></p>');
    const link = document.getElementById('link');
    expect(axe.commons.dom.isInTextBlock(link)).toBe(false);
  });

  it('returns false if there is more text in link(s) than in the rest of the block', function () {
    fixtureSetup(
      '<p> short text:' +
        '  <a href="" id="link">on a link with a very long text</a>' +
        '</p>'
    );
    const link = document.getElementById('link');
    expect(axe.commons.dom.isInTextBlock(link)).toBe(false);
  });

  it('return false if there are links along side other links', function () {
    fixtureSetup(
      '<p>' +
        '  <a href="" id="link">link</a>' +
        '  <a href="">other link</a>' +
        '</p>'
    );
    const link = document.getElementById('link');
    expect(axe.commons.dom.isInTextBlock(link)).toBe(false);
  });

  it('ignores hidden content', function () {
    fixtureSetup(
      '<p>' +
        '  <a href="" id="link">link</a>' +
        '  <span style="display:none">some hidden text</span>' +
        '</p>'
    );
    const link = document.getElementById('link');
    expect(axe.commons.dom.isInTextBlock(link)).toBe(false);
  });

  it('ignores floated content', function () {
    fixtureSetup(
      '<p>' +
        '  <span style="float: left">A floating text in the area</span>' +
        '  <a href="" id="link">link</a>' +
        '</p>'
    );
    const link = document.getElementById('link');
    expect(axe.commons.dom.isInTextBlock(link)).toBe(false);
  });

  it('ignores positioned content', function () {
    fixtureSetup(
      '<p>' +
        '  <span style="position:absolute;">Some absolute potitioned text</span>' +
        '  <a href="" id="link">link</a>' +
        '</p>'
    );
    const link = document.getElementById('link');
    expect(axe.commons.dom.isInTextBlock(link)).toBe(false);
  });

  it('ignores none-text content', function () {
    fixtureSetup(
      '<p>' +
        '  <img alt="Some graphical component" src="img.png" />' +
        '  <a href="" id="link">link</a>' +
        '</p>'
    );
    const link = document.getElementById('link');
    expect(axe.commons.dom.isInTextBlock(link)).toBe(false);
  });

  it('ignore text in the block coming before a br', function () {
    fixtureSetup(
      '<p>Some paragraph with text <br>' +
        '  <a href="" id="link">link</a>' +
        '</p>'
    );
    const link = document.getElementById('link');
    expect(axe.commons.dom.isInTextBlock(link)).toBe(false);
  });

  it('ignore text in the block coming after a br', function () {
    fixtureSetup(
      '<p>' +
        '  <a href="" id="link">link</a> <br>' +
        '  Some paragraph with text ' +
        '</p>'
    );
    const link = document.getElementById('link');
    expect(axe.commons.dom.isInTextBlock(link)).toBe(false);
  });

  it('ignore text in the block coming before and after a br', function () {
    fixtureSetup(
      '<p>Some paragraph with text <br>' +
        '  <a href="" id="link">link</a> <br>' +
        '  Some paragraph with text ' +
        '</p>'
    );
    const link = document.getElementById('link');
    expect(axe.commons.dom.isInTextBlock(link)).toBe(false);
  });

  it('ignores text inside inline widgets and components', function () {
    fixtureSetup(
      '<p>' +
        '  <a href="" id="link">link</a>' +
        '  <button> My button </button>' +
        '  <button disabled> My disabled button </button>' +
        '  <span role="searchbox">My query</span>' +
        '  <textarea>My text content</textarea>' +
        '  <select><option>My first choice</option></select>' +
        '</p>'
    );
    const link = document.getElementById('link');
    expect(axe.commons.dom.isInTextBlock(link)).toBe(false);
  });

  it('treats hr elements the same as br elements', function () {
    fixtureSetup(
      '<div>Some paragraph with text <hr>' +
        '  <a href="" id="link">link</a> <hr>' +
        '  Some paragraph with text ' +
        '</div>'
    );
    const link = document.getElementById('link');
    expect(axe.commons.dom.isInTextBlock(link)).toBe(false);
  });

  it('ignore comments', function () {
    fixtureSetup(
      '<p><!-- Some paragraph with text -->' +
        '  <a href="" id="link">link</a>' +
        '</p>'
    );
    const link = document.getElementById('link');
    expect(axe.commons.dom.isInTextBlock(link)).toBe(false);
  });

  it('can reach outside a shadow tree', function () {
    const div = document.createElement('div');
    div.innerHTML = 'Some paragraph with text <span></span> ';
    const shadow = div.querySelector('span').attachShadow({ mode: 'open' });
    shadow.innerHTML = '<a href="" id="link">link</a>';
    fixtureSetup(div);

    const link = shadow.querySelector('#link');
    expect(axe.commons.dom.isInTextBlock(link)).toBe(true);
  });

  it('can reach into a shadow tree', function () {
    const div = document.createElement('div');
    div.innerHTML = '<a href="" id="link">link</a>';
    const shadow = div.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<p>Some paragraph with text <slot></slot> </p>';
    fixtureSetup(div);

    const link = fixture.querySelector('#link');
    expect(axe.commons.dom.isInTextBlock(link)).toBe(true);
  });

  it(
    'treats shadow DOM slots as siblings',
    function () {
      const div = document.createElement('div');
      div.innerHTML = '<br>';
      const shadow = div.attachShadow({ mode: 'open' });
      shadow.innerHTML =
        '<p>Some paragraph with text ' +
        '<slot></slot> <a href="" id="link">link</a></p>';
      fixtureSetup(div);

      const link = shadow.querySelector('#link');
      expect(axe.commons.dom.isInTextBlock(link)).toBe(false);
    }
  );

  describe('options.noLengthCompare', function () {
    it('returns true if there is any text outside the link', function () {
      fixtureSetup('<p>amy <a href="" id="link">link text is longer</a></p>');
      const link = document.getElementById('link');
      expect(
        axe.commons.dom.isInTextBlock(link, {
          noLengthCompare: true
        })
      ).toBe(true);
    });

    it('returns false if the non-widget text is only whitespace', function () {
      fixtureSetup(
        '<p>' +
          ' <a href="" id="link">link 1</a>\t\n\r' +
          ' <a href="">link 2</a>' +
          ' <a href="">link 3</a>' +
          ' <a href="">link 4</a>' +
          '</p>'
      );
      const link = document.getElementById('link');
      expect(
        axe.commons.dom.isInTextBlock(link, {
          noLengthCompare: true
        })
      ).toBe(false);
    });
  });
});
