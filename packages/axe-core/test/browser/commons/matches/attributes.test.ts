import { describe, it, beforeEach, expect } from 'vitest';
import { queryFixture } from '../../../testutils';

declare const axe: any;
describe('matches.attributes', function () {
  const attributes = axe.commons.matches.attributes;
  const fixture = document.querySelector('#fixture');

  beforeEach(function () {
    fixture.innerHTML = '';
  });

  it('returns true if all attributes match', function () {
    const virtualNode = queryFixture(
      '<span id="target" foo="baz" bar="foo" baz="bar"></span>'
    );
    expect(
      attributes(virtualNode, {
        foo: 'baz',
        bar: 'foo',
        baz: 'bar'
      })
    ).toBe(true);
  });

  it('returns false if some attributes do not match', function () {
    const virtualNode = queryFixture(
      '<span id="target" foo="baz" bar="foo" baz="bar"></span>'
    );
    expect(
      attributes(virtualNode, {
        foo: 'baz',
        bar: 'foo',
        baz: 'baz'
      })
    ).toBe(false);
  });

  it('returns false if any attributes are missing', function () {
    const virtualNode = queryFixture(
      '<span id="target" foo="baz" baz="bar"></span>'
    );
    expect(
      attributes(virtualNode, {
        foo: 'baz',
        bar: 'foo',
        baz: 'bar'
      })
    ).toBe(false);
  });

  it('works with actual nodes', function () {
    const virtualNode = queryFixture(
      '<span id="target" foo="baz" bar="foo" baz="bar"></span>'
    );
    expect(
      attributes(virtualNode.actualNode, {
        foo: 'baz',
        bar: 'foo',
        baz: 'bar'
      })
    ).toBe(true);
  });

  it('works with SerialVirtualNode', function () {
    const serialNode = new axe.SerialVirtualNode({
      nodeName: 'span',
      attributes: {
        id: 'target',
        foo: 'baz',
        bar: 'foo',
        baz: 'bar'
      }
    });
    expect(
      attributes(serialNode, {
        foo: 'baz',
        bar: 'foo',
        baz: 'bar'
      })
    ).toBe(true);
  });
});
