import { describe, it, afterEach, expect } from 'vitest';
import { queryFixture } from '../../../testutils';

declare const axe: any;
describe('color.elementHasImage', function () {
  const fixture = document.getElementById('fixture');
  const elementHasImage = axe.commons.color.elementHasImage;

  afterEach(function () {
    fixture.innerHTML = '';
    axe._tree = undefined;
    axe.commons.color.incompleteData.clear();
  });

  it('returns true when `HTMLElement` is of graphical type', function () {
    ['img', 'canvas', 'object', 'iframe', 'video', 'svg'].forEach(
      function (nodeName) {
        const vNode = queryFixture(
          '<' + nodeName + ' id="target"></' + nodeName + '>'
        );
        const actual = elementHasImage(vNode.actualNode);
        expect(actual).toBe(true);
        expect(axe.commons.color.incompleteData.get('bgColor')).toBe('imgNode');
      }
    );
  });

  it('returns false when `HTMLElement` has no background-image style set', function () {
    const vNode = queryFixture(
      '<div id="target" style="height: 40px; width: 30px;">No background style</div>'
    );
    const actual = elementHasImage(vNode.actualNode);
    expect(actual).toBe(false);
  });

  it('returns false when `HTMLElement` has background-image style set to none', function () {
    const vNode = queryFixture(
      '<div id="target" style="height: 40px; width: 30px; background-image: none "> Some text... </div>'
    );
    const actual = elementHasImage(vNode.actualNode);
    expect(actual).toBe(false);
  });

  it('returns true when `HTMLElement` has background-image (url)', function () {
    const vNode = queryFixture(
      '<div id="target" style="height: 40px; width: 30px; background-image: url(london.png)"> Some text... </div>'
    );
    const actual = elementHasImage(vNode.actualNode);
    expect(actual).toBe(true);
    expect(axe.commons.color.incompleteData.get('bgColor')).toBe('bgImage');
  });

  it('returns true when `HTMLElement` has background-image (gradient)', function () {
    const vNode = queryFixture(
      '<div id="target" style="height: 40px; width: 30px; background-image: linear-gradient(red, orange);"> Some text... </div>'
    );
    const actual = elementHasImage(vNode.actualNode);
    expect(actual).toBe(true);
    expect(axe.commons.color.incompleteData.get('bgColor')).toBe('bgGradient');
  });
});
