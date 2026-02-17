import { describe, it, beforeEach, expect } from 'vitest';

declare const axe: any;
describe('matches.semanticRole', function () {
  const semanticRole = axe.commons.matches.semanticRole;
  const fixture = document.querySelector('#fixture');
  const queryFixture = axe.testUtils.queryFixture;

  beforeEach(function () {
    fixture.innerHTML = '';
  });

  it('should return true if explicit role matches', function () {
    const virtualNode = queryFixture(
      '<span id="target" role="textbox"></span>'
    );
    expect(semanticRole(virtualNode, 'textbox')).toBe(true);
  });

  it('should return true if explicit role matches array', function () {
    const virtualNode = queryFixture(
      '<span id="target" role="textbox"></span>'
    );
    expect(semanticRole(virtualNode, ['combobox', 'textbox'])).toBe(true);
  });

  it('should return true if implicit role matches', function () {
    const virtualNode = queryFixture('<ul><li id="target"></li></ul>');
    expect(semanticRole(virtualNode, 'listitem')).toBe(true);
  });

  it('should return false if semantic role does not match', function () {
    const virtualNode = queryFixture('<span id="target" role="main"></span>');
    expect(semanticRole(virtualNode, 'textbox')).toBe(false);
  });

  it('works with SerialVirtualNode', function () {
    const serialNode = new axe.SerialVirtualNode({
      nodeName: 'span',
      attributes: {
        role: 'textbox'
      }
    });
    expect(semanticRole(serialNode, 'textbox')).toBe(true);
  });
});
