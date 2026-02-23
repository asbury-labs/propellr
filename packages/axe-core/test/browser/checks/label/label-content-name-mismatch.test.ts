import { describe, it, expect, beforeAll } from 'vitest';
import { checks, queryFixture } from '../../../testutils';

describe('label-content-name-mismatch tests', function () {
  const check = checks['label-content-name-mismatch'];
  const options = undefined;

  const fontApiSupport = !!document.fonts;

  beforeAll(async function () {
    if (!fontApiSupport) {
      return;
    }

    const materialFont = new FontFace(
      'Material Icons',
      'url(https://fonts.gstatic.com/s/materialicons/v48/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2)'
    );
    await materialFont.load();
    document.fonts.add(materialFont);
  });

  it('returns true when visible text and accessible name (`aria-label`) matches (text sanitized)', function () {
    const vNode = queryFixture(
      '<div id="target" role="link" aria-label="next page &nbsp ">next page</div>'
    );
    const actual = check.evaluate(vNode.actualNode, options, vNode);
    expect(actual).toBe(true);
  });

  it('returns true when visible text and accessible name (`aria-label`) matches (character insensitive)', function () {
    const vNode = queryFixture(
      '<div id="target" role="link" aria-label="Next Page">next pAge</div>'
    );
    const actual = check.evaluate(vNode.actualNode, options, vNode);
    expect(actual).toBe(true);
  });

  it('returns true when visible text and accessible name (`aria-labelledby`) matches (character insensitive & text sanitized)', function () {
    const vNode = queryFixture(
      '<div id="target" aria-labelledby="yourLabel">UNTIL THE VeRy EnD</div>' +
        '<div id="yourLabel">uNtIl the very end  &nbsp</div>'
    );
    const actual = check.evaluate(vNode.actualNode, options, vNode);
    expect(actual).toBe(true);
  });

  it('returns true when visible text is contained in the accessible name', function () {
    const vNode = queryFixture(
      '<button id="target" name="link" aria-label="Next Page in the list">Next Page</button>'
    );
    const actual = check.evaluate(vNode.actualNode, options, vNode);
    expect(actual).toBe(true);
  });

  it('returns false when visible text doesn’t match accessible name', function () {
    const vNode = queryFixture(
      '<div id="target" role="link" aria-label="OK">Next</div>'
    );
    const actual = check.evaluate(vNode.actualNode, options, vNode);
    expect(actual).toBe(false);
  });

  it('returns false when not all of visible text is included in accessible name', function () {
    const vNode = queryFixture(
      '<button id="target" name="link" aria-label="the full">The full label</button>'
    );
    const actual = check.evaluate(vNode.actualNode, options, vNode);
    expect(actual).toBe(false);
  });

  it('returns false when element has non-matching accessible name (`aria-labelledby`) and text content', function () {
    const vNode = queryFixture(
      '<div role="button" id="target" aria-labelledby="foo">some content</div>' +
        '<div id="foo">123</div>'
    );
    const actual = check.evaluate(vNode.actualNode, options, vNode);
    expect(actual).toBe(false);
  });

  it('returns true when visible text excluding emoji is part of accessible name', function () {
    const vNode = queryFixture(
      '<button id="target" aria-label="I would like a burger">I would like a 🍔 </button>'
    );
    const actual = check.evaluate(vNode.actualNode, options, vNode);
    expect(actual).toBe(true);
  });

  it('returns true when visible text excluding punctuations/ symbols is part of accessible name', function () {
    const vNode = queryFixture(
      '<button id="target" aria-label="next page">next page &gt;&gt;</button>'
    );
    const actual = check.evaluate(vNode.actualNode, options, vNode);
    expect(actual).toBe(true);
  });

  (fontApiSupport ? it : it.skip)(
    'returns true when visible text excluding ligature icon is part of accessible name',
    function () {
      const vNode = queryFixture(
        '<button id="target" aria-label="next page">next page <span style="font-family: \'Material Icons\'">delete</span></button>'
      );
      const actual = check.evaluate(vNode.actualNode, options, vNode);
      expect(actual).toBe(true);
    }
  );

  it('returns true when visible text excluding private use unicode is part of accessible name', function () {
    const vNode = queryFixture(
      '<button id="target" aria-label="Favorites"> Favorites</button>'
    );
    const actual = check.evaluate(vNode.actualNode, options, vNode);
    expect(actual).toBe(true);
  });

  it('returns undefined (needs review) when visible text name is only an emoji', function () {
    const vNode = queryFixture(
      '<button id="target" aria-label="comet">☄️</button>'
    );
    const actual = check.evaluate(vNode.actualNode, options, vNode);
    expect(actual).toBeUndefined();
  });

  it('returns undefined (needs review) when accessible name is an emoji', function () {
    const vNode = queryFixture(
      '<button id="target" aria-label="☄️">shooting star</button>'
    );
    const actual = check.evaluate(vNode.actualNode, options, vNode);
    expect(actual).toBeUndefined();
  });

  it('returns undefined (needs review) for visible text is single characters (punctuation) used as icon', function () {
    const vNode = queryFixture(
      '<button id="target" aria-label="help">?</button>'
    );
    const actual = check.evaluate(vNode.actualNode, options, vNode);
    expect(actual).toBeUndefined();
  });

  it('returns undefined (needs review) for unicode as accessible name and text content', function () {
    const vNode = queryFixture(
      '<button id="target" aria-label="&#x1F354">&#x1F354</button>'
    );
    const actual = check.evaluate(vNode.actualNode, options, vNode);
    expect(actual).toBeUndefined();
  });

  it('returns undefined (needs review) for unicode text content', function () {
    const vNode = queryFixture(
      '<button id="target" aria-label="close">&#10060;</button>'
    );
    const actual = check.evaluate(vNode.actualNode, options, vNode);
    expect(actual).toBeUndefined();
  });

  it('returns undefined (needs review) when punctuation is used as text content', function () {
    const vNode = queryFixture(
      '<button id="target" aria-label="wink">;)</button>'
    );
    const actual = check.evaluate(vNode.actualNode, options, vNode);
    expect(actual).toBeUndefined();
  });

  it('returns true when normal text content which is punctuated', function () {
    const vNode = queryFixture(
      '<button id="target" aria-label="I like football but I prefer cycling more">I like football, but I prefer cycling more.</button>'
    );
    const actual = check.evaluate(vNode.actualNode, options, vNode);
    expect(actual).toBe(true);
  });

  it('returns false when normal puntuated text content is not contained in accessible name is punctuated', function () {
    const vNode = queryFixture(
      '<button id="target" aria-label="I like football">I like cycling more!!!</button>'
    );
    const actual = check.evaluate(vNode.actualNode, options, vNode);
    expect(actual).toBe(false);
  });

  it('returns true when text contains <br/>', function () {
    const vNode = queryFixture(
      '<button id="target" aria-label="button label">button<br>label</button>'
    );
    const actual = check.evaluate(vNode.actualNode, options, vNode);
    expect(actual).toBe(true);
  });
});
