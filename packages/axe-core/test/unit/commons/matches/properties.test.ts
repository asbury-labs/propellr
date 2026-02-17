import { describe, it, beforeEach, expect } from 'vitest';

declare const axe: any;
describe('matches.properties', function () {
  const properties = axe.commons.matches.properties;
  const fixture = document.querySelector('#fixture');
  const queryFixture = axe.testUtils.queryFixture;

  beforeEach(function () {
    fixture.innerHTML = '';
  });

  it('returns true if all properties match', function () {
    const virtualNode = queryFixture('<input type="text" id="target"></input>');

    expect(
      properties(virtualNode, {
        nodeName: 'input',
        id: 'target',
        type: 'text'
      })
    ).toBe(true);
  });

  it('returns false if some properties do not match', function () {
    const virtualNode = queryFixture('<input type="text" id="target"></input>');

    expect(
      properties(virtualNode, {
        nodeName: 'input',
        id: 'target',
        type: 'num'
      })
    ).toBe(false);
  });

  it('returns false if any properties are missing', function () {
    const virtualNode = queryFixture('<h1 id="target">foo</h1>');

    expect(
      properties(virtualNode, {
        nodeName: 'h1',
        id: 'target',
        type: 'text'
      })
    ).toBe(false);
  });

  it('works with actual nodes', function () {
    const virtualNode = queryFixture('<input type="text" id="target"></input>');

    expect(
      properties(virtualNode.actualNode, {
        nodeName: 'input',
        id: 'target',
        type: 'text'
      })
    ).toBe(true);
  });

  it('works with SerialVirtualNode', function () {
    const serialNode = new axe.SerialVirtualNode({
      nodeName: 'input',
      type: 'text',
      id: 'target'
    });

    expect(
      properties(serialNode, {
        nodeName: 'input',
        id: 'target',
        type: 'text'
      })
    ).toBe(true);
  });
});
