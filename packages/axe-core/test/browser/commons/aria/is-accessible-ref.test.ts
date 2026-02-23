import { describe, it, beforeAll, afterEach, expect } from 'vitest';
import { shadowSupport } from '../../../testutils';

declare const axe: any;
describe('aria.isAccessibleRef', function () {
  const fixture = document.getElementById('fixture');
  const isAccessibleRef = axe.commons.aria.isAccessibleRef;
  const shadowSupportV1 = shadowSupport.v1;

  function setLookup(attrs) {
    axe.configure({
      standards: {
        ariaAttrs: attrs
      }
    });
  }

  beforeAll(function () {
    axe._load({});
  });

  afterEach(function () {
    fixture.innerHTML = '';
    axe.reset();
  });

  it('returns false by default', function () {
    fixture.innerHTML = '<div id="foo"><div>';
    const node = document.getElementById('foo');
    expect(isAccessibleRef(node)).toBe(false);
  });

  it('returns true for IDs used in aria IDREF attributes', function () {
    setLookup({ 'aria-foo': { type: 'idref' } });
    fixture.innerHTML = '<div aria-foo="foo"></div><i id="foo"></i>';
    const node = document.getElementById('foo');
    expect(isAccessibleRef(node)).toBe(true);
  });

  it('returns true for IDs used in aria IDREFS attributes', function () {
    setLookup({ 'aria-bar': { type: 'idrefs' } });
    fixture.innerHTML =
      '<div aria-bar="foo bar"></div><i id="foo"></i><b id="bar"></b>';

    const node1 = document.getElementById('foo');
    const node2 = document.getElementById('bar');
    expect(isAccessibleRef(node1)).toBe(true);
    expect(isAccessibleRef(node2)).toBe(true);
  });

  it('returns true for IDs used in label[for] attributes', function () {
    setLookup({ 'aria-foo': { type: 'idref' } });
    fixture.innerHTML = '<label for="baz">baz</label><input id="baz">';
    const node = document.getElementById('baz');
    expect(isAccessibleRef(node)).toBe(true);
  });

  (shadowSupportV1 ? it : xit)('works inside shadow DOM', function () {
    setLookup({ 'aria-bar': { type: 'idref' } });
    fixture.innerHTML = '<div id="foo"></div>';

    const shadow = document
      .getElementById('foo')
      .attachShadow({ mode: 'open' });
    shadow.innerHTML = '<div aria-bar="bar"></div><b id="bar"></b>';

    const node = shadow.getElementById('bar');
    expect(isAccessibleRef(node)).toBe(true);
  });

  (shadowSupportV1 ? it : xit)(
    'returns false for IDREFs inside shadow DOM',
    function () {
      setLookup({ 'aria-foo': { type: 'idrefs' } });
      fixture.innerHTML = '<div id="foo"><div id="bar"></div></div>';
      const node1 = document.getElementById('foo');
      const node2 = document.getElementById('bar');

      const shadow = node1.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<div aria-foo="foo bar"><slot></slot></div>';

      expect(isAccessibleRef(node1)).toBe(false);
      expect(isAccessibleRef(node2)).toBe(false);
    }
  );

  (shadowSupportV1 ? it : xit)(
    'returns false for IDREFs outside shadow DOM',
    function () {
      setLookup({ 'aria-bar': { type: 'idref' } });
      fixture.innerHTML =
        '<div id="foo" aria-bar="bar"><div aria-bar="bar"></div></div>';

      const shadow = document
        .getElementById('foo')
        .attachShadow({ mode: 'open' });
      shadow.innerHTML = '<div id="bar"><slot></slot></div>';

      const node = shadow.getElementById('bar');
      expect(isAccessibleRef(node)).toBe(false);
    }
  );
});
