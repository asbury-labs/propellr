import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('aria.getOwnedVirtual', function () {
  const aria = axe.commons.aria;
  const fixtureSetup = axe.testUtils.fixtureSetup;

  it('returns a list of children in order', function () {
    fixtureSetup(
      '<div id="target">' +
        '<h1>heading 1</h1>' +
        '<h2>heading 2</h2>' +
        '<h3>heading 3</h3>' +
        '</div>'
    );
    const target = axe.utils.querySelectorAll(axe._tree[0], '#target')[0];
    const owned = aria.getOwnedVirtual(target);
    expect(owned).toHaveLength(3);
    expect(owned[0].actualNode.nodeName.toUpperCase()).toBe('H1');
    expect(owned[1].actualNode.nodeName.toUpperCase()).toBe('H2');
    expect(owned[2].actualNode.nodeName.toUpperCase()).toBe('H3');
  });

  it('adds aria-owned reffed elements to the children', function () {
    fixtureSetup(
      '<div id="target" aria-owns="hdr3 hdr4">' +
        '<h1>heading 1</h1>' +
        '<h2>heading 2</h2>' +
        '</div>' +
        '<h4 id="hdr4">heading 4</h4>' +
        '<h3 id="hdr3">heading 3</h3>'
    );
    const target = axe.utils.querySelectorAll(axe._tree[0], '#target')[0];
    const owned = aria.getOwnedVirtual(target);
    expect(owned).toHaveLength(4);
    expect(owned[0].actualNode.nodeName.toUpperCase()).toBe('H1');
    expect(owned[1].actualNode.nodeName.toUpperCase()).toBe('H2');
    expect(owned[2].actualNode.nodeName.toUpperCase()).toBe('H3');
    expect(owned[3].actualNode.nodeName.toUpperCase()).toBe('H4');
  });

  it('ignores whitespace-only aria-owned', function () {
    fixtureSetup(
      '<div id="target" aria-owns="  ">' +
        '<h1>heading 1</h1>' +
        '<h2>heading 2</h2>' +
        '<h3>heading 3</h3>' +
        '</div>'
    );
    const target = axe.utils.querySelectorAll(axe._tree[0], '#target')[0];
    const owned = aria.getOwnedVirtual(target);
    expect(owned).toHaveLength(3);
    expect(owned[0].actualNode.nodeName.toUpperCase()).toBe('H1');
    expect(owned[1].actualNode.nodeName.toUpperCase()).toBe('H2');
    expect(owned[2].actualNode.nodeName.toUpperCase()).toBe('H3');
  });

  it('ignores broken aria-owned refs', function () {
    fixtureSetup(
      '<div id="target" aria-owns="nonexisting reference">' +
        '<h1>heading 1</h1>' +
        '<h2>heading 2</h2>' +
        '<h3>heading 3</h3>' +
        '</div>'
    );
    const target = axe.utils.querySelectorAll(axe._tree[0], '#target')[0];
    const owned = aria.getOwnedVirtual(target);
    expect(owned).toHaveLength(3);
    expect(owned[0].actualNode.nodeName.toUpperCase()).toBe('H1');
    expect(owned[1].actualNode.nodeName.toUpperCase()).toBe('H2');
    expect(owned[2].actualNode.nodeName.toUpperCase()).toBe('H3');
  });

  it('includes text nodes', function () {
    fixtureSetup(
      '<div id="target" aria-owns="nonexisting reference">' +
        'text 1' +
        '<h1>heading 1</h1>' +
        'text 2' +
        '<h2>heading 2</h2>' +
        ' \t\n' +
        '</div>'
    );
    const target = axe.utils.querySelectorAll(axe._tree[0], '#target')[0];
    const owned = aria.getOwnedVirtual(target);

    expect(owned).toHaveLength(5);
    expect(owned[0].actualNode.textContent).toBe('text 1');
    expect(owned[1].actualNode.textContent).toBe('heading 1');
    expect(owned[2].actualNode.textContent).toBe('text 2');
    expect(owned[3].actualNode.textContent).toBe('heading 2');
    expect(owned[4].actualNode.textContent).toBe(' \t\n');
  });

  it('returns an empty array if there are no owned elements', function () {
    fixtureSetup('<div id="target" aria-owns="nonexisting reference"></div>');
    const target = axe.utils.querySelectorAll(axe._tree[0], '#target')[0];
    const owned = aria.getOwnedVirtual(target);
    expect(owned).toHaveLength(0);
  });
});
