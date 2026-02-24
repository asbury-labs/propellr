import { describe, it, expect } from 'vitest';
import { queryFixture, flatTreeSetup } from '../../../testutils';

declare const axe: any;
describe('dom.isVisibleToScreenReaders', function () {
  const fixture = document.querySelector('#fixture');
  const isVisibleToScreenReaders = axe.commons.dom.isVisibleToScreenReaders;

  function createContentHidden() {
    const group = document.createElement('div');
    group.innerHTML =
      '<label id="mylabel">Label</label><input aria-labelledby="mylabel" type="text" />';
    return group;
  }

  function makeShadowTreeHidden(node) {
    const root = node.attachShadow({ mode: 'open' });
    const div = document.createElement('div');
    div.className = 'parent';
    root.appendChild(div);
    div.appendChild(createContentHidden());
  }

  it('should return false on detached elements', function () {
    const el = document.createElement('div');
    el.innerHTML = 'I am not visible because I am detached!';
    flatTreeSetup(el);
    expect(isVisibleToScreenReaders(el)).toBe(false);
  });

  it('should return true on body', function () {
    flatTreeSetup(document.body);
    const actual = isVisibleToScreenReaders(document.body);
    expect(actual).toBe(true);
  });

  it('should return true on html', function () {
    flatTreeSetup(document.documentElement);
    const actual = isVisibleToScreenReaders(document.documentElement);
    expect(actual).toBe(true);
  });

  it('should return true for visible element', function () {
    const vNode = queryFixture('<div id="target">Visible</div>');
    expect(isVisibleToScreenReaders(vNode)).toBe(true);
  });

  it('should return true for visible area element', function () {
    const vNode = queryFixture(
      '<map name="map">' +
        '<area id="target" href="#" />' +
        '</map>' +
        '<img usemap="#map" src="img.png" />'
    );
    expect(isVisibleToScreenReaders(vNode)).toBe(true);
  });

  it('should return false if `aria-hidden` is set', function () {
    const vNode = queryFixture(
      '<div id="target" aria-hidden="true">Hidden from screen readers</div>'
    );
    expect(isVisibleToScreenReaders(vNode)).toBe(false);
  });

  it('should return false if `inert` is set', function () {
    const vNode = queryFixture(
      '<div id="target" inert>Hidden from screen readers</div>'
    );
    expect(isVisibleToScreenReaders(vNode)).toBe(false);
  });

  it('should return false if `display: none` is set', function () {
    const vNode = queryFixture(
      '<div id="target" style="display: none">Hidden from screen readers</div>'
    );
    expect(isVisibleToScreenReaders(vNode)).toBe(false);
  });

  it('should return false if `aria-hidden` is set on parent', function () {
    const vNode = queryFixture(
      '<div aria-hidden="true"><div id="target">Hidden from screen readers</div></div>'
    );
    expect(isVisibleToScreenReaders(vNode)).toBe(false);
  });

  it('should know how `visibility` works', function () {
    const vNode = queryFixture(
      '<div style="visibility: hidden;">' +
        '<div id="target" style="visibility: visible;">Hi</div>' +
        '</div>'
    );
    expect(isVisibleToScreenReaders(vNode)).toBe(true);
  });

  it('returns false for `AREA` without closest `MAP` element', function () {
    const vNode = queryFixture(
      '<area id="target" role="link" shape="circle" coords="130,136,60" aria-label="MDN"/>'
    );
    const actual = isVisibleToScreenReaders(vNode);
    expect(actual).toBe(false);
  });

  it('returns false for `AREA` with closest `MAP` with no name attribute', function () {
    const vNode = queryFixture(
      '<map>' +
        '<area id="target" role="link" shape="circle" coords="130,136,60" aria-label="MDN"/>' +
        '</map>'
    );
    const actual = isVisibleToScreenReaders(vNode);
    expect(actual).toBe(false);
  });

  it(
    'returns false for `AREA` element that is inside shadowDOM',
    function () {
      fixture.innerHTML = '<div id="container"></div>';
      const container = fixture.querySelector('#container');
      const shadow = container.attachShadow({ mode: 'open' });
      shadow.innerHTML =
        '<map name="infographic">' +
        '<area id="target" role="link" shape="circle" coords="130,136,60" aria-label="MDN"/>' +
        '</map>';
      flatTreeSetup(fixture);

      const target = shadow.querySelector('#target');
      const actual = isVisibleToScreenReaders(target);
      expect(actual).toBe(false);
    }
  );

  it('returns false for `AREA` with closest `MAP` with name but not referred by an `IMG` usemap attribute', function () {
    const vNode = queryFixture(
      '<map name="infographic">' +
        '<area id="target" role="link" shape="circle" coords="130,136,60" aria-label="MDN"/>' +
        '</map>' +
        '<img usemap="#infographic-wrong-name" alt="MDN infographic" />'
    );
    const actual = isVisibleToScreenReaders(vNode);
    expect(actual).toBe(false);
  });

  it('returns false for `AREA` with `MAP` and used in `IMG` which is not visible', function () {
    const vNode = queryFixture(
      '<map name="infographic">' +
        '<area id="target" role="link" shape="circle" coords="130,136,60" aria-label="MDN"/>' +
        '</map>' +
        '<img usemap="#infographic" alt="MDN infographic" style="display:none"/>'
    );
    const actual = isVisibleToScreenReaders(vNode);
    expect(actual).toBe(false);
  });

  it('returns true for `AREA` with `MAP` and used in `IMG` which is visible', function () {
    const vNode = queryFixture(
      '<map name="infographic">' +
        '<area id="target" role="link" shape="circle" coords="130,136,60" aria-label="MDN"/>' +
        '</map>' +
        '<img usemap="#infographic" alt="MDN infographic" />'
    );
    const actual = isVisibleToScreenReaders(vNode);
    expect(actual).toBe(true);
  });

  it(
    'not hidden: should work when the element is inside shadow DOM',
    function () {
      const tree, node;
      // shadow DOM v1 - note: v0 is compatible with this code, so no need
      // to specifically test this
      fixture.innerHTML = '<div></div>';
      makeShadowTreeHidden(fixture.firstChild);
      tree = axe.utils.getFlattenedTree(fixture.firstChild);
      node = axe.utils.querySelectorAll(tree, 'input')[0];
      expect(isVisibleToScreenReaders(node)).toBe(true);
    }
  );

  it(
    'hidden: should work when the element is inside shadow DOM',
    function () {
      const tree, node;
      // shadow DOM v1 - note: v0 is compatible with this code, so no need
      // to specifically test this
      fixture.innerHTML = '<div style="display:none"></div>';
      makeShadowTreeHidden(fixture.firstChild);
      tree = axe.utils.getFlattenedTree(fixture.firstChild);
      node = axe.utils.querySelectorAll(tree, 'input')[0];
      expect(isVisibleToScreenReaders(node)).toBe(false);
    }
  );

  it(
    'should work with hidden slotted elements',
    function () {
      function createContentSlotted() {
        const group = document.createElement('div');
        group.innerHTML =
          '<div id="target" style="display:none;">Stuff<slot></slot></div>';
        return group;
      }
      function makeShadowTree(node) {
        const root = node.attachShadow({ mode: 'open' });
        const div = document.createElement('div');
        root.appendChild(div);
        div.appendChild(createContentSlotted());
      }
      fixture.innerHTML = '<div><p><a>hello</a></p></div>';
      makeShadowTree(fixture.firstChild);
      const tree = axe.utils.getFlattenedTree(fixture.firstChild);
      const vNode = axe.utils.querySelectorAll(tree, 'a')[0];
      expect(isVisibleToScreenReaders(vNode)).toBe(false);
    }
  );

  describe('SerialVirtualNode', function () {
    it('should return false if `aria-hidden` is set', function () {
      const vNode = new axe.SerialVirtualNode({
        nodeName: 'div',
        attributes: {
          'aria-hidden': true
        }
      });
      expect(isVisibleToScreenReaders(vNode)).toBe(false);
    });

    it('should return false if `aria-hidden` is set on parent', function () {
      const vNode = new axe.SerialVirtualNode({
        nodeName: 'div'
      });
      const parentVNode = new axe.SerialVirtualNode({
        nodeName: 'div',
        attributes: {
          'aria-hidden': true
        }
      });
      parentVNode.children = [vNode];
      vNode.parent = parentVNode;
      expect(isVisibleToScreenReaders(vNode)).toBe(false);
    });

    it('should return false if `inert` is set', function () {
      const vNode = new axe.SerialVirtualNode({
        nodeName: 'div',
        attributes: {
          inert: true
        }
      });
      expect(isVisibleToScreenReaders(vNode)).toBe(false);
    });

    it('should return false if `inert` is set on parent', function () {
      const vNode = new axe.SerialVirtualNode({
        nodeName: 'div'
      });
      const parentVNode = new axe.SerialVirtualNode({
        nodeName: 'div',
        attributes: {
          inert: true
        }
      });
      parentVNode.children = [vNode];
      vNode.parent = parentVNode;
      expect(isVisibleToScreenReaders(vNode)).toBe(false);
    });
  });
});
