import { describe, it, beforeEach, expect } from 'vitest';
import { queryFixture } from '../../../testutils';

declare const axe: any;
describe('matches.accessibleName', function () {
  const hasAccessibleName = axe.commons.matches.hasAccessibleName;
  const fixture = document.querySelector('#fixture');

  beforeEach(function () {
    fixture.innerHTML = '';
  });

  it('should return true when text has an accessible name', function () {
    const virtualNode = queryFixture(
      '<button id="target">hello world</button>'
    );
    expect(hasAccessibleName(virtualNode, true)).toBe(true);
  });

  it('should return true when aria-label has an accessible name', function () {
    const virtualNode = queryFixture(
      '<button id="target" aria-label="hello world"></button>'
    );
    expect(hasAccessibleName(virtualNode, true)).toBe(true);
  });

  it('should return true when aria-labelledby has an accessible name', function () {
    const virtualNode = queryFixture(
      '<button id="target" aria-labelledby="foo"></button><div id="foo">hello world</div'
    );
    expect(hasAccessibleName(virtualNode, true)).toBe(true);
  });

  it('should return true when title has an accessible name', function () {
    const virtualNode = queryFixture(
      '<button id="target" title="hello world"></button>'
    );
    expect(hasAccessibleName(virtualNode, true)).toBe(true);
  });

  it('should return true when label has an accessible name', function () {
    const virtualNode = queryFixture(
      '<label>hello world<input id="target"></label>'
    );
    expect(hasAccessibleName(virtualNode, true)).toBe(true);
  });

  it('should return false when text does not have an accessible name', function () {
    const virtualNode = queryFixture('<button id="target"></button>');
    expect(hasAccessibleName(virtualNode, true)).toBe(false);
  });

  it('should return false when aria-label does not have an accessible name', function () {
    const virtualNode = queryFixture(
      '<button id="target" aria-label=""></button>'
    );
    expect(hasAccessibleName(virtualNode, true)).toBe(false);
  });

  it('should return false when aria-labelledby does not have an accessible name', function () {
    const virtualNode = queryFixture(
      '<button id="target" aria-labelledby=""></button><div id="foo">hello world</div'
    );
    expect(hasAccessibleName(virtualNode, true)).toBe(false);
  });

  it('should return false when aria-labelledby references an element that does not exist', function () {
    const virtualNode = queryFixture(
      '<button id="target" aria-labelledby="bar"></button><div id="foo">hello world</div'
    );
    expect(hasAccessibleName(virtualNode, true)).toBe(false);
  });

  it('should return false when aria-labelledby references an elm that does not exist', function () {
    const virtualNode = queryFixture(
      '<button id="target" aria-labelledby="bar"></button><div id="foo">hello world</div'
    );
    expect(hasAccessibleName(virtualNode, true)).toBe(false);
  });

  it('should return false when title does not have an accessible name', function () {
    const virtualNode = queryFixture('<button id="target" title=""></button>');
    expect(hasAccessibleName(virtualNode, true)).toBe(false);
  });

  it('should return false when label does not have an accessible name', function () {
    const virtualNode = queryFixture('<label><input id="target"></label>');
    expect(hasAccessibleName(virtualNode, true)).toBe(false);
  });

  it('works with SerialVirtualNode', function () {
    const serialNode = new axe.SerialVirtualNode({
      nodeName: 'button',
      attributes: {
        role: 'button',
        'aria-label': 'hello world'
      }
    });
    expect(hasAccessibleName(serialNode, true)).toBe(true);
  });
});
