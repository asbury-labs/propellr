import { describe, it, expect } from 'vitest';
import { fixtureSetup, queryFixture } from '../../../testutils';

declare const axe: any;
describe('text.nativeTextAlternative', function () {
  const text = axe.commons.text;
  const nativeTextAlternative = text.nativeTextAlternative;

  it('runs accessible text methods specified for the native element', function () {
    const vNode = queryFixture('<button id="target">foo</button>');
    expect(nativeTextAlternative(vNode)).toBe('foo');
  });

  it('returns the accessible text of the first method that returns something', function () {
    const vNode = queryFixture(
      '<input id="target" type="image" alt="foo" value="bar" title="baz">'
    );
    expect(nativeTextAlternative(vNode)).toBe('foo');
  });

  it('returns `` when no method matches', function () {
    const vNode = queryFixture('<div id="target">baz</div>');
    expect(nativeTextAlternative(vNode)).toBe('');
  });

  it('returns `` when no accessible text method returned something', function () {
    const div = queryFixture('<div id="target">baz</div>');
    expect(nativeTextAlternative(div)).toBe('');
  });

  it('returns `` when the node is not an element', function () {
    fixtureSetup('foo bar baz');
    const fixture = axe.utils.querySelectorAll(axe._tree[0], '#fixture')[0];
    expect(fixture.children[0].actualNode.nodeType).toBe(3);
    expect(nativeTextAlternative(fixture.children[0])).toBe('');
  });

  it('returns `` when the element has role=presentation', function () {
    const vNode = queryFixture(
      '<img id="target" alt="foo" role="presentation" />'
    );
    expect(nativeTextAlternative(vNode)).toBe('');
  });

  it('returns `` when the element has role=none', function () {
    const vNode = queryFixture('<img id="target" alt="foo" role="none" />');
    expect(nativeTextAlternative(vNode)).toBe('');
  });
});
