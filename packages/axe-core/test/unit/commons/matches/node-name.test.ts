import { describe, it, beforeEach, expect } from 'vitest';

declare const axe: any;
describe('matches.nodeName', function () {
  const matchNodeName = axe.commons.matches.nodeName;
  const fixture = document.querySelector('#fixture');
  const queryFixture = axe.testUtils.queryFixture;

  beforeEach(function () {
    fixture.innerHTML = '';
  });

  it('returns true if the nodeName is the same as the matcher', function () {
    const virtualNode = queryFixture('<h1 id="target">foo</h1>');
    expect(matchNodeName(virtualNode, 'h1')).toBe(true);
  });

  it('returns true if the nodename is included in an array', function () {
    const virtualNode = queryFixture('<h1 id="target">foo</h1>');
    expect(matchNodeName(virtualNode, ['h3', 'h2', 'h1'])).toBe(true);
  });

  it('returns true if the nodeName matches a regexp', function () {
    const virtualNode = queryFixture('<h1 id="target">foo</h1>');
    expect(matchNodeName(virtualNode, /^h[0-6]$/)).toBe(true);
  });

  it('returns true if the nodeName matches with a function', function () {
    const virtualNode = queryFixture('<h1 id="target">foo</h1>');
    expect(
      matchNodeName(virtualNode, function (nodeName) {
        return nodeName === 'h1';
      })
    ).toBe(true);
  });

  it('returns false if the nodeName does not match', function () {
    const virtualNode = queryFixture('<div id="target">foo</div>');
    expect(matchNodeName(virtualNode, 'h1')).toBe(false);
    expect(matchNodeName(virtualNode, ['h3', 'h2', 'h1'])).toBe(false);
    expect(matchNodeName(virtualNode, /^h[0-6]$/)).toBe(false);
    expect(
      matchNodeName(virtualNode, function (nodeName) {
        return nodeName === 'h1';
      })
    ).toBe(false);
  });

  it('is case sensitive for XHTML', function () {
    const virtualNode = queryFixture('<H1 id="target">foo</H1>');
    virtualNode._isXHTML = true;
    delete virtualNode._cache.props;
    expect(matchNodeName(virtualNode, 'h1')).toBe(false);
  });

  it('is case insensitive for HTML, but not for XHTML', function () {
    const virtualNode = queryFixture('<H1 id="target">foo</H1>');
    virtualNode._isXHTML = false;
    expect(matchNodeName(virtualNode, 'h1')).toBe(true);
  });

  it('works with actual nodes', function () {
    const virtualNode = queryFixture('<h1 id="target">foo</h1>');
    expect(matchNodeName(virtualNode.actualNode, 'h1')).toBe(true);
  });

  it('works with SerialVirtualNode', function () {
    const serialNode = new axe.SerialVirtualNode({
      nodeName: 'h1',
      attributes: {
        id: 'target'
      }
    });
    expect(matchNodeName(serialNode, 'h1')).toBe(true);
  });
});
