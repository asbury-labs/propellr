import { describe, it, beforeEach, expect } from 'vitest';
import { queryFixture } from '../../../testutils';

declare const axe: any;
describe('matches.implicitRole', function () {
  const implicitRole = axe.commons.matches.implicitRole;
  const fixture = document.querySelector('#fixture');

  beforeEach(function () {
    fixture.innerHTML = '';
  });

  it('should return true if implicit role matches', function () {
    const virtualNode = queryFixture('<ul><li id="target"></li></ul>');
    expect(implicitRole(virtualNode, 'listitem')).toBe(true);
  });

  it('should return true if implicit role matches array', function () {
    const virtualNode = queryFixture('<ul><li id="target"></li></ul>');
    expect(implicitRole(virtualNode, ['textbox', 'listitem'])).toBe(true);
  });

  it('should return false if implicit role does not match', function () {
    const virtualNode = queryFixture('<ul><li id="target"></li></ul>');
    expect(implicitRole(virtualNode, 'textbox')).toBe(false);
  });

  it('should return false if matching explicit role', function () {
    const virtualNode = queryFixture(
      '<ul role="menu"><li id="target" role="menuitem"></li></ul>'
    );
    expect(implicitRole(virtualNode, 'menuitem')).toBe(false);
  });

  it('works with SerialVirtualNode', function () {
    const serialNode = new axe.SerialVirtualNode({
      nodeName: 'li'
    });
    expect(implicitRole(serialNode, 'listitem')).toBe(true);
  });
});
