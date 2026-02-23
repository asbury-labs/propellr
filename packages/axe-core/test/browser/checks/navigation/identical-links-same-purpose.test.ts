import { describe, it, expect, afterEach } from 'vitest';
import { checks, MockCheckContext, queryFixture } from '../../../testutils';

declare const axe: any;
describe('identical-links-same-purpose tests', function () {
  const fixture = document.getElementById('fixture')!;
  const check = checks['identical-links-same-purpose'];
  const checkContext = MockCheckContext();
  const options = {};

  afterEach(function () {
    fixture.innerHTML = '';
    checkContext.reset();
    axe._tree = undefined;
  });

  it('returns undefined for native link with `href` but no accessible name', function () {
    const vNode = queryFixture('<a id="target" href="/home/#/foo"></a>');
    const actual = check.evaluate.call(
      checkContext,
      vNode.actualNode,
      options,
      vNode
    );
    expect(actual).toBeUndefined();
    expect(checkContext._data).toBeNull();
  });

  it('returns undefined when ARIA link that has no accessible name', function () {
    const vNode = queryFixture('<span role="link" id="target"></span>');
    const actual = check.evaluate.call(
      checkContext,
      vNode.actualNode,
      options,
      vNode
    );
    expect(actual).toBeUndefined();
    expect(checkContext._data).toBeNull();
  });

  it('returns undefined when ARIA link has only any combination of unicode (emoji, punctuations, nonBmp) characters as accessible name', function () {
    const vNode = queryFixture(
      '<button id="target" role="link">☀️!!!₨   </button>'
    );
    const actual = check.evaluate.call(
      checkContext,
      vNode.actualNode,
      options,
      vNode
    );
    expect(actual).toBeUndefined();
    expect(checkContext._data).toBeNull();
  });

  it('returns true for native links with `href` and accessible name', function () {
    const vNode = queryFixture('<a id="target" href="/home/#/foo">Pass 1</a>');
    const actual = check.evaluate.call(
      checkContext,
      vNode.actualNode,
      options,
      vNode
    );
    expect(actual).toBe(true);
    expect(Object.keys(checkContext._data).sort()).toEqual(
      ['name', 'urlProps'].sort()
    );
    expect(checkContext._data.name).toBe('Pass 1'.toLowerCase());
    expect(checkContext._data.urlProps.hash).toBe('#/foo');
    expect(checkContext._data.urlProps.pathname).toBe('/home/');
  });

  it('returns true for ARIA links has accessible name (AREA with `MAP` which is used in `IMG`)', function () {
    const vNode = queryFixture(
      '<map name="infographic">' +
        '<area id="target" role="link" shape="circle" coords="130,136,60" aria-label="MDN"/>' +
        '</map>' +
        '<img usemap="#infographic" alt="MDN infographic" />'
    );
    const actual = check.evaluate.call(
      checkContext,
      vNode.actualNode,
      options,
      vNode
    );
    expect(actual).toBe(true);
    expect(Object.keys(checkContext._data).sort()).toEqual(
      ['name', 'urlProps'].sort()
    );
    expect(checkContext._data.name).toBe('MDN'.toLowerCase());
    expect(!!checkContext._data.resource).toBe(false);
  });

  it('returns true for native links with `href` and accessible name (that also has emoji, nonBmp and punctuation characters)', function () {
    const vNode = queryFixture(
      '<a id="target" href="/contact/foo.html">The ☀️ is orange, the ◓ is white.</a>'
    );
    const actual = check.evaluate.call(
      checkContext,
      vNode.actualNode,
      options,
      vNode
    );
    expect(actual).toBe(true);
    expect(Object.keys(checkContext._data).sort()).toEqual(
      ['name', 'urlProps'].sort()
    );
    expect(checkContext._data.name).toBe(
      'The is orange the is white'.toLowerCase()
    );
    expect(checkContext._data.urlProps.filename).toBe('foo.html');
  });
});
