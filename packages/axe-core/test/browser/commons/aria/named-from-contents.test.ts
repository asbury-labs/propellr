import { describe, it, afterEach, expect } from 'vitest';
import { flatTreeSetup, queryFixture } from '../../../testutils';

declare const axe: any;
describe('aria.namedFromContents', function () {
  const aria = axe.commons.aria;
  const namedFromContents = aria.namedFromContents;
  const fixture = document.querySelector('#fixture');

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('returns true when the element has an explicit role named from content', function () {
    fixture.innerHTML = '<div role="foo"></div>';
    flatTreeSetup(fixture);
    expect(namedFromContents(fixture.firstChild)).toBe(true);
  });

  it('works on virtual nodes', function () {
    const vNode = queryFixture('<div id="target" role="foo"></div>');
    expect(namedFromContents(vNode)).toBe(true);
  });

  it('returns true when the element has an implicit role named from content', function () {
    fixture.innerHTML = '<h1>foo</h1>';
    flatTreeSetup(fixture);
    expect(namedFromContents(fixture.firstChild)).toBe(true);
  });

  it('returns false when the element has a role not named from content', function () {
    fixture.innerHTML = '<main role="main"></main>';
    flatTreeSetup(fixture);
    expect(namedFromContents(fixture.firstChild)).toBe(false);
  });

  it('returns false node is not a DOM element', function () {
    fixture.innerHTML = 'text node';
    flatTreeSetup(fixture);
    expect(namedFromContents(fixture.firstChild)).toBe(false);
  });

  describe('{ strict: false }', function () {
    it('returns true when the element has no role named from content', function () {
      fixture.innerHTML = '<div>foo</div>';
      flatTreeSetup(fixture);
      expect(aria.getRole(fixture.firstChild)).toBeNull();
      expect(namedFromContents(fixture.firstChild, { strict: false })).toBe(
        true
      );
    });

    it('is default for aria.namedFromContents', function () {
      fixture.innerHTML = '<div>foo</div>';
      flatTreeSetup(fixture);
      expect(aria.getRole(fixture.firstChild)).toBeNull();
      expect(namedFromContents(fixture.firstChild)).toBe(true);
    });

    it('returns true when the element has role=presentation', function () {
      fixture.innerHTML = '<div role="presentation">foo</div>';
      flatTreeSetup(fixture);
      expect(namedFromContents(fixture.firstChild, { strict: false })).toBe(
        true
      );
    });

    it('returns true when the element has role=none', function () {
      fixture.innerHTML = '<div role="none">foo</div>';
      flatTreeSetup(fixture);
      expect(namedFromContents(fixture.firstChild, { strict: false })).toBe(
        true
      );
    });

    it('returns true when the implicit role is null', function () {
      fixture.innerHTML = '<div role="bar">foo</div>';
      flatTreeSetup(fixture);
      expect(namedFromContents(fixture.firstChild, { strict: false })).toBe(
        true
      );
    });
  });

  describe('{ strict: true }', function () {
    it('returns false when the element has no role named from content', function () {
      fixture.innerHTML = '<div>foo</div>';
      flatTreeSetup(fixture);
      expect(aria.getRole(fixture.firstChild)).toBeNull();
      expect(namedFromContents(fixture.firstChild, { strict: true })).toBe(
        false
      );
    });

    it('returns false when the element has role=presentation', function () {
      fixture.innerHTML = '<div role="presentation">foo</div>';
      flatTreeSetup(fixture);
      expect(namedFromContents(fixture.firstChild, { strict: true })).toBe(
        false
      );
    });

    it('returns false when the element has role=none', function () {
      fixture.innerHTML = '<div role="none">foo</div>';
      flatTreeSetup(fixture);
      expect(namedFromContents(fixture.firstChild, { strict: true })).toBe(
        false
      );
    });
  });
});
