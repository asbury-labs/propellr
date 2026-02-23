import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { queryFixture, shadowSupport } from '../../../testutils';

declare const axe: any;
describe('axe.utils.getScroll', () => {
  const fixture = document.getElementById('fixture');
  const shadowSupported = shadowSupport.v1;

  afterEach(() => {
    fixture.innerHTML = '';
  });

  it('returns undefined when element is not scrollable', () => {
    let target = queryFixture(
      '<section id="target">This element is not scrollable</section>'
    );
    let actual = axe.utils.getScroll(target.actualNode);
    expect(actual).toBeUndefined();
  });

  it('returns undefined when element does not overflow', () => {
    let target = queryFixture(
      '<div id="target" style="height: 200px; width: 200px;">' +
        '<div style="height: 10px; width: 10px; background-color: pink;">' +
        '<p> Content </p>' +
        '</div>' +
        '</div>'
    );
    let actual = axe.utils.getScroll(target.actualNode);
    expect(actual).toBeUndefined();
  });

  it('returns undefined when element overflow is hidden', () => {
    let target = queryFixture(
      '<div id="target" style="height: 200px; width: 200px; overflow: hidden">' +
        '<div style="height: 2000px; width: 100px; background-color: pink;">' +
        '<p> Content </p>' +
        '</div>' +
        '</div>'
    );
    let actual = axe.utils.getScroll(target.actualNode);
    expect(actual).toBeUndefined();
  });

  it('returns undefined when element overflow is clip', () => {
    let target = queryFixture(
      '<div id="target" style="height: 200px; width: 200px; overflow: clip">' +
        '<div style="height: 2000px; width: 100px; background-color: pink;">' +
        '<p> Content </p>' +
        '</div>' +
        '</div>'
    );
    let actual = axe.utils.getScroll(target.actualNode);
    expect(actual).toBeUndefined();
  });

  it('returns scroll offset when element overflow is auto', () => {
    let target = queryFixture(
      '<div id="target" style="height: 200px; width: 200px; overflow: auto">' +
        '<div style="height: 10px; width: 2000px; background-color: red;">' +
        '<p> Content </p>' +
        '</div>' +
        '</div>'
    );
    let actual = axe.utils.getScroll(target.actualNode);
    expect(actual).toBeDefined();
    expect(Object.keys(actual)).toEqual(
      expect.arrayContaining(['elm', 'top', 'left'])
    );
    expect(actual.top).toBe(0);
    expect(actual.left).toBe(0);
  });

  it('returns undefined when element overflow is visible', () => {
    let target = queryFixture(
      '<p id="target" style="width: 12em; height: 2em; border: dotted; overflow: visible;">Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.</p>'
    );
    let actual = axe.utils.getScroll(target.actualNode);
    expect(actual).toBeUndefined();
  });

  it('returns scroll offset when element overflow is scroll', () => {
    let target = queryFixture(
      '<p id="target" style="width: 12em; height: 2em; border: dotted; overflow: scroll;">Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.</p>'
    );
    let actual = axe.utils.getScroll(target.actualNode);
    expect(actual).toBeDefined();
    expect(Object.keys(actual)).toEqual(
      expect.arrayContaining(['elm', 'top', 'left'])
    );
    expect(actual.top).toBe(0);
    expect(actual.left).toBe(0);
  });

  describe('shadowDOM - axe.utils.getScroll', () => {
    beforeAll(() => {
      if (!shadowSupported) {
        this.skip();
      }
    });

    it('returns undefined when shadowDOM element does not overflow', () => {
      fixture.innerHTML = '<div></div>';

      let root = fixture.firstChild.attachShadow({ mode: 'open' });
      let slotted = document.createElement('div');
      slotted.innerHTML =
        '<p id="target" style="width: 12em; height: 2em; border: dotted;">Sed.</p>';
      root.appendChild(slotted);
      let tree = axe.utils.getFlattenedTree(fixture.firstChild);
      let target = axe.utils.querySelectorAll(tree, 'p')[0];
      let actual = axe.utils.getScroll(target.actualNode);
      expect(actual).toBeUndefined();
    });

    it('returns scroll offset when shadowDOM element has overflow', () => {
      fixture.innerHTML = '<div></div>';

      let root = fixture.firstChild.attachShadow({ mode: 'open' });
      let slotted = document.createElement('div');
      slotted.innerHTML =
        '<p id="target" style="width: 12em; height: 2em; border: dotted; overflow: auto;">This is a repeated long sentence, This is a repeated long sentence, This is a repeated long sentence, This is a repeated long sentence, This is a repeated long sentence.</p>';
      root.appendChild(slotted);
      let tree = axe.utils.getFlattenedTree(fixture.firstChild);
      let target = axe.utils.querySelectorAll(tree, 'p')[0];
      let actual = axe.utils.getScroll(target.actualNode);
      expect(actual).toBeDefined();
      expect(Object.keys(actual)).toEqual(
        expect.arrayContaining(['elm', 'top', 'left'])
      );
      expect(actual.top).toBe(0);
      expect(actual.left).toBe(0);
    });
  });
});
