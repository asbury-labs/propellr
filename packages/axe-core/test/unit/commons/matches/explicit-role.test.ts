import { describe, it, beforeEach, expect } from 'vitest';

declare const axe: any;
describe('matches.explicitRole', function () {
  const explicitRole = axe.commons.matches.explicitRole;
  const fixture = document.querySelector('#fixture');
  const queryFixture = axe.testUtils.queryFixture;

  beforeEach(function () {
    fixture.innerHTML = '';
  });

  it('should return true if explicit role matches', function () {
    const virtualNode = queryFixture(
      '<span id="target" role="textbox"></span>'
    );
    expect(explicitRole(virtualNode, 'textbox')).toBe(true);
  });

  it('should return true if explicit role matches array', function () {
    const virtualNode = queryFixture(
      '<span id="target" role="textbox"></span>'
    );
    expect(explicitRole(virtualNode, ['combobox', 'textbox'])).toBe(true);
  });

  it('should return false if explicit role does not match', function () {
    const virtualNode = queryFixture('<span id="target" role="main"></span>');
    expect(explicitRole(virtualNode, 'textbox')).toBe(false);
  });

  it('should return false if matching implicit role', function () {
    const virtualNode = queryFixture('<ul><li id="target"></li></ul>');
    expect(explicitRole(virtualNode, 'listitem')).toBe(false);
  });

  it('works with SerialVirtualNode', function () {
    const serialNode = new axe.SerialVirtualNode({
      nodeName: 'span',
      attributes: {
        role: 'textbox'
      }
    });
    expect(explicitRole(serialNode, 'textbox')).toBe(true);
  });
});
