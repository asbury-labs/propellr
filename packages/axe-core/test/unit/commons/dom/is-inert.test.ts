import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('dom.isInert', () => {
  const fixture = document.querySelector('#fixture');
  const isInert = axe.commons.dom.isInert;
  const { queryFixture, flatTreeSetup } = axe.testUtils;

  it('returns true for element with "inert=false`', () => {
    const vNode = queryFixture('<div id="target" inert="false"></div>');

    expect(isInert(vNode)).toBe(true);
  });

  it('returns true for element with "inert`', () => {
    const vNode = queryFixture('<div id="target" inert></div>');

    expect(isInert(vNode)).toBe(true);
  });

  it('returns false for element without inert', () => {
    const vNode = queryFixture('<div id="target"></div>');

    expect(isInert(vNode)).toBe(false);
  });

  it('returns true for ancestor with inert', () => {
    const vNode = queryFixture(
      '<div inert><div><div id="target"></div></div></div>'
    );

    expect(isInert(vNode)).toBe(true);
  });

  it('returns false for closed dialog', () => {
    const vNode = queryFixture(`
      <dialog><span>Hello</span></dialog>
      <div id="target">World</div>
    `);

    expect(isInert(vNode)).toBe(false);
  });

  it('returns false for non-modal dialog', () => {
    const vNode = queryFixture(`
      <dialog open><span>Hello</span></dialog>
      <div id="target">World</div>
    `);

    expect(isInert(vNode)).toBe(false);
  });

  it('returns true for modal dialog', () => {
    fixture.innerHTML = `
      <dialog id="modal"><span>Hello</span></dialog>
      <div id="target">World</div>
    `;
    document.querySelector('#modal').showModal();
    const tree = flatTreeSetup(fixture);
    const vNode = axe.utils.querySelectorAll(tree, '#target')[0];

    expect(isInert(vNode)).toBe(true);
  });

  it('returns false for the modal dialog element', () => {
    fixture.innerHTML = `
      <dialog id="target"><span>Hello</span></dialog>
    `;
    document.querySelector('#target').showModal();
    const tree = flatTreeSetup(fixture);
    const vNode = axe.utils.querySelectorAll(tree, '#target')[0];

    expect(isInert(vNode)).toBe(false);
  });

  it('returns false for a descendant of the modal dialog', () => {
    fixture.innerHTML = `
      <dialog id="modal"><span id="target">Hello</span></dialog>
    `;
    document.querySelector('#modal').showModal();
    const tree = flatTreeSetup(fixture);
    const vNode = axe.utils.querySelectorAll(tree, '#target')[0];

    expect(isInert(vNode)).toBe(false);
  });

  describe('options.skipAncestors', () => {
    it('returns false for ancestor with inert', () => {
      const vNode = queryFixture(
        '<div inert><div><div id="target"></div></div></div>'
      );

      expect(isInert(vNode, { skipAncestors: true })).toBe(false);
    });
  });

  describe('options.isAncestor', () => {
    it('return false for modal dialog', () => {
      fixture.innerHTML = `
        <dialog id="modal"><span>Hello</span></dialog>
        <div id="target">World</div>
      `;
      document.querySelector('#modal').showModal();
      const tree = flatTreeSetup(fixture);
      const vNode = axe.utils.querySelectorAll(tree, '#target')[0];

      expect(isInert(vNode, { isAncestor: true })).toBe(false);
    });
  });
});
