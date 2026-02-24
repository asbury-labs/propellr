import { describe, it, afterEach, expect, vi } from 'vitest';
import { queryFixture, flatTreeSetup } from '../../../testutils';

declare const axe: any;
describe('dom.isVisible', function () {
  const fixture = document.getElementById('fixture');
  const computedStyleStub;

  afterEach(function () {
    document.getElementById('fixture').innerHTML = '';
    axe._tree = undefined;

    if (computedStyleStub) {
      computedStyleStub.mockRestore();
      computedStyleStub = null;
    }
  });

  describe('default usage', function () {
    // Firefox returns `null` if accessed inside a hidden iframe
    it('should return false if computedStyle return null for whatever reason', function () {
      computedStyleStub = vi
        .spyOn(window, 'getComputedStyle')
        .mockReturnValue(null);
      const el = document.createElement('div');
      expect(axe.commons.dom.isVisible(el)).toBe(false);
    });

    it('should return true on statically-positioned, visible elements', function () {
      fixture.innerHTML = '<div id="target">Hello!</div>';
      const el = document.getElementById('target');

      expect(axe.commons.dom.isVisible(el)).toBe(true);
    });

    it('should return true on absolutely positioned elements that are on-screen', function () {
      fixture.innerHTML =
        '<div id="target" style="position: absolute; left: 10px; right: 10px">hi</div>';
      const el = document.getElementById('target');

      expect(axe.commons.dom.isVisible(el)).toBe(true);
    });

    it('should respect position: fixed', function () {
      fixture.innerHTML =
        '<div id="target" style="position:fixed; bottom: 0; left: 0;">StickySticky</div>';
      const el = document.getElementById('target');

      expect(axe.commons.dom.isVisible(el)).toBe(true);
    });

    it('should properly calculate offsets according the offsetParent', function () {
      fixture.innerHTML =
        '<div style="position: absolute; top: 400px; left: 400px;">' +
        '<div id="target" style="position: absolute; top: -400px; left: -400px">Hi</div>' +
        '</div>';
      const el = document.getElementById('target');
      expect(axe.commons.dom.isVisible(el)).toBe(true);
    });

    it('should return false if moved offscreen with left', function () {
      fixture.innerHTML =
        '<div id="target" style="position: absolute; left: -9999px">Hi</div>';
      const el = document.getElementById('target');
      expect(axe.commons.dom.isVisible(el)).toBe(false);
    });

    it('should return false if moved offscreen with top', function () {
      fixture.innerHTML =
        '<div id="target" style="position: absolute; top: -9999px">Hi</div>';
      const el = document.getElementById('target');
      expect(axe.commons.dom.isVisible(el)).toBe(false);
    });

    it('should return false on detached elements', function () {
      const el = document.createElement('div');
      el.innerHTML = 'I am not visible because I am detached!';

      expect(axe.commons.dom.isVisible(el)).toBe(false);
    });

    it('should return true on a document', function () {
      expect(axe.commons.dom.isVisible(document)).toBe(true);
    });

    it('should return false on STYLE tag', function () {
      const vNode = queryFixture(
        '<style id="target"> @import "https://cdnjs.cloudflare.com/ajax/libs/skeleton/2.0.4/skeleton.css"; .green { background-color: green; } </style>'
      );
      const actual = axe.commons.dom.isVisible(vNode.actualNode);
      expect(actual).toBe(false);
    });

    it('should return false on NOSCRIPT tag', function () {
      const vNode = queryFixture(
        '<noscript id="target"><p class="invisible"><img src="/piwik/piwik.php?idsite=1" alt="" /></p></noscript>'
      );
      const actual = axe.commons.dom.isVisible(vNode.actualNode);
      expect(actual).toBe(false);
    });

    it('should return false on TEMPLATE tag', function () {
      const vNode = queryFixture(
        '<template id="target"><div>Name:</div></template>'
      );
      const actual = axe.commons.dom.isVisible(vNode.actualNode);
      expect(actual).toBe(false);
    });

    it('should return true if positioned statically but top/left is set', function () {
      fixture.innerHTML =
        '<div id="target" style="top: -9999px; left: -9999px;' +
        'right: -9999px; bottom: -9999px;">Hi</div>';
      const el = document.getElementById('target');
      expect(axe.commons.dom.isVisible(el)).toBe(true);
    });

    it('should not be affected by `aria-hidden`', function () {
      fixture.innerHTML =
        '<div id="target" aria-hidden="true">Hidden from screen readers</div>';

      const el = document.getElementById('target');
      expect(axe.commons.dom.isVisible(el)).toBe(true);
    });

    it('should not calculate position on parents', function () {
      fixture.innerHTML =
        '<div style="position: absolute; top: -400px; left: -400px;">' +
        '<div id="target" style="position: absolute; top: 500px; left: 500px">Hi</div>' +
        '</div>';

      const el = document.getElementById('target');
      expect(axe.commons.dom.isVisible(el)).toBe(true);
    });

    it('should know how `visibility` works', function () {
      fixture.innerHTML =
        '<div style="visibility: hidden;">' +
        '<div id="target" style="visibility: visible;">Hi</div>' +
        '</div>';

      const el = document.getElementById('target');
      expect(axe.commons.dom.isVisible(el)).toBe(true);
    });

    it('should detect clip rect hidden text technique', function () {
      const el,
        clip =
          'clip: rect(1px 1px 1px 1px);' +
          'clip: rect(1px, 1px, 1px, 1px);' +
          'width: 1px; height: 1px;' +
          'position: absolute;' +
          'overflow: hidden;';

      fixture.innerHTML = '<div id="target" style="' + clip + '">Hi</div>';

      el = document.getElementById('target');
      expect(axe.commons.dom.isVisible(el)).toBe(false);
    });

    it('should detect clip rect hidden text technique using position: fixed', function () {
      const el,
        clip =
          'clip: rect(1px 1px 1px 1px);' +
          'clip: rect(1px, 1px, 1px, 1px);' +
          'width: 1px; height: 1px;' +
          'position: fixed;' +
          'overflow: hidden;';

      fixture.innerHTML = '<div id="target" style="' + clip + '">Hi</div>';

      el = document.getElementById('target');
      expect(axe.commons.dom.isVisible(el)).toBe(false);
    });

    it('should detect when clip is not applied because of positioning', function () {
      const el,
        clip =
          'clip: rect(1px 1px 1px 1px);' +
          'clip: rect(1px, 1px, 1px, 1px);' +
          'position: relative;' +
          'overflow: hidden;';

      fixture.innerHTML = '<div id="target" style="' + clip + '">Hi</div>';

      el = document.getElementById('target');
      expect(axe.commons.dom.isVisible(el)).toBe(true);
    });

    it('should detect clip rect hidden text technique on parent', function () {
      const el,
        clip =
          'clip: rect(1px 1px 1px 1px);' +
          'clip: rect(1px, 1px, 1px, 1px);' +
          'width: 1px; height: 1px;' +
          'position: absolute;' +
          'overflow: hidden;';

      fixture.innerHTML =
        '<div style="' + clip + '">' + '<div id="target">Hi</div>' + '</div>';

      el = document.getElementById('target');
      expect(axe.commons.dom.isVisible(el)).toBe(false);
    });

    it('should detect when clip is not applied because of positioning on parent', function () {
      const el,
        clip =
          'clip: rect(1px 1px 1px 1px);' +
          'clip: rect(1px, 1px, 1px, 1px);' +
          'position: relative;' +
          'overflow: hidden;';

      fixture.innerHTML =
        '<div style="' + clip + '">' + '<div id="target">Hi</div>' + '</div>';

      el = document.getElementById('target');
      expect(axe.commons.dom.isVisible(el)).toBe(true);
    });

    it('should detect poorly hidden clip rects', function () {
      const el,
        clip =
          'clip: rect(5px 1px 1px 5px);' +
          'clip: rect(5px, 1px, 1px, 5px);' +
          'width: 1px; height: 1px;' +
          'position: absolute;' +
          'overflow: hidden;';

      fixture.innerHTML = '<div id="target" style="' + clip + '">Hi</div>';

      el = document.getElementById('target');
      expect(axe.commons.dom.isVisible(el)).toBe(false);
    });

    it('should return false for display: none', function () {
      fixture.innerHTML = '<div id="target" style="display: none">Hello!</div>';
      const el = document.getElementById('target');

      expect(axe.commons.dom.isVisible(el)).toBe(false);
    });

    it('should return false for opacity: 0', function () {
      fixture.innerHTML = '<div id="target" style="opacity: 0">Hello!</div>';
      const el = document.getElementById('target');

      expect(axe.commons.dom.isVisible(el)).toBe(false);
    });

    it('should return false for opacity: 0', function () {
      fixture.innerHTML = '<div id="target" style="opacity: 0">Hello!</div>';
      const el = document.getElementById('target');

      expect(axe.commons.dom.isVisible(el)).toBe(false);
    });

    it('should return false for 0 height scrollable region', function () {
      fixture.innerHTML =
        '<div style="overflow: scroll; height: 0"><div id="target">Hello!</div></div>';
      const el = document.getElementById('target');

      expect(axe.commons.dom.isVisible(el)).toBe(false);
    });

    it('should return false for 0 width scrollable region', function () {
      fixture.innerHTML =
        '<div style="overflow: scroll; width: 0"><div id="target">Hello!</div></div>';
      const el = document.getElementById('target');

      expect(axe.commons.dom.isVisible(el)).toBe(false);
    });

    it('returns false for `AREA` without closest `MAP` element', function () {
      const vNode = queryFixture(
        '<area id="target" role="link" shape="circle" coords="130,136,60" aria-label="MDN"/>'
      );
      const actual = axe.commons.dom.isVisible(vNode.actualNode);
      expect(actual).toBe(false);
    });

    it('returns false for `AREA` with closest `MAP` with no name attribute', function () {
      const vNode = queryFixture(
        '<map>' +
          '<area id="target" role="link" shape="circle" coords="130,136,60" aria-label="MDN"/>' +
          '</map>'
      );
      const actual = axe.commons.dom.isVisible(vNode.actualNode);
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
        const actual = axe.commons.dom.isVisible(target);
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
      const actual = axe.commons.dom.isVisible(vNode.actualNode);
      expect(actual).toBe(false);
    });

    it('returns false for `AREA` with `MAP` and used in `IMG` which is not visible', function () {
      const vNode = queryFixture(
        '<map name="infographic">' +
          '<area id="target" role="link" shape="circle" coords="130,136,60" aria-label="MDN"/>' +
          '</map>' +
          '<img usemap="#infographic" alt="MDN infographic" style="display:none"/>'
      );
      const actual = axe.commons.dom.isVisible(vNode.actualNode);
      expect(actual).toBe(false);
    });

    it('returns true for `AREA` with `MAP` and used in `IMG` which is visible', function () {
      const vNode = queryFixture(
        '<map name="infographic">' +
          '<area id="target" role="link" shape="circle" coords="130,136,60" aria-label="MDN"/>' +
          '</map>' +
          '<img usemap="#infographic" alt="MDN infographic" />'
      );
      const actual = axe.commons.dom.isVisible(vNode.actualNode);
      expect(actual).toBe(true);
    });

    it('should detect clip-path hidden text technique', function () {
      fixture.innerHTML =
        '<div id="target" style="clip-path: inset(50%);">Hi</div>';

      const el = document.getElementById('target');
      expect(axe.commons.dom.isVisible(el)).toBe(false);
    });

    it('should detect clip-path hidden text technique on parent', function () {
      fixture.innerHTML =
        '<div style="clip-path: circle(0%);">' +
        '<div id="target">Hi</div>' +
        '</div>';

      const el = document.getElementById('target');
      expect(axe.commons.dom.isVisible(el)).toBe(false);
    });

    it(
      'should correctly handle visible slotted elements',
      function () {
        function createContentSlotted() {
          const group = document.createElement('div');
          group.innerHTML = '<div id="target">Stuff<slot></slot></div>';
          return group;
        }
        function makeShadowTree(node) {
          const root = node.attachShadow({ mode: 'open' });
          const div = document.createElement('div');
          root.appendChild(div);
          div.appendChild(createContentSlotted());
        }
        fixture.innerHTML = '<div><a>hello</a></div>';
        makeShadowTree(fixture.firstChild);
        const tree = axe.utils.getFlattenedTree(fixture.firstChild);
        const el = axe.utils.querySelectorAll(tree, 'a')[0];
        expect(axe.commons.dom.isVisible(el.actualNode)).toBe(true);
      }
    );
    it(
      'should correctly handle hidden slotted elements',
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
        const el = axe.utils.querySelectorAll(tree, 'a')[0];
        expect(axe.commons.dom.isVisible(el.actualNode)).toBe(false);
      }
    );
    it('should return false if element is visually hidden using position absolute, overflow hidden, and a very small height', function () {
      fixture.innerHTML =
        '<div id="target" style="position:absolute; height: 1px; overflow: hidden;">StickySticky</div>';
      const el = document.getElementById('target');

      expect(axe.commons.dom.isVisible(el)).toBe(false);
    });
  });

  describe('screen readers', function () {
    // Firefox returns `null` if accessed inside a hidden iframe
    it('should return false if computedStyle return null for whatever reason', function () {
      computedStyleStub = vi
        .spyOn(window, 'getComputedStyle')
        .mockReturnValue(null);
      const el = document.createElement('div');
      expect(axe.commons.dom.isVisible(el, true)).toBe(false);
    });

    it('should return true on staticly-positioned, visible elements', function () {
      fixture.innerHTML = '<div id="target">Hello!</div>';
      const el = document.getElementById('target');

      expect(axe.commons.dom.isVisible(el, true)).toBe(true);
    });

    it('should return true on absolutely positioned elements that are on-screen', function () {
      fixture.innerHTML =
        '<div id="target" style="position: absolute; left: 10px; right: 10px">hi</div>';
      const el = document.getElementById('target');

      expect(axe.commons.dom.isVisible(el, true)).toBe(true);
    });

    it('should respect position: fixed', function () {
      fixture.innerHTML =
        '<div id="target" style="position:fixed; bottom: 0; left: 0;">StickySticky</div>';
      const el = document.getElementById('target');

      expect(axe.commons.dom.isVisible(el, true)).toBe(true);
    });

    it('should properly calculate offsets according the offsetParent', function () {
      fixture.innerHTML =
        '<div style="position: absolute; top: 400px; left: 400px;">' +
        '<div id="target" style="position: absolute; top: -400px; left: -400px">Hi</div>' +
        '</div>';
      const el = document.getElementById('target');
      expect(axe.commons.dom.isVisible(el, true)).toBe(true);
    });

    it('should return true if moved offscreen with left', function () {
      fixture.innerHTML =
        '<div id="target" style="position: absolute; left: -9999px">Hi</div>';
      const el = document.getElementById('target');
      expect(axe.commons.dom.isVisible(el, true)).toBe(true);
    });

    it('should return true if moved offscreen with top', function () {
      fixture.innerHTML =
        '<div id="target" style="position: absolute; top: -9999px">Hi</div>';
      const el = document.getElementById('target');
      expect(axe.commons.dom.isVisible(el, true)).toBe(true);
    });

    it('should return true if moved offscreen with right', function () {
      fixture.innerHTML =
        '<div id="target" style="position: absolute; right: -9999px">Hi</div>';
      const el = document.getElementById('target');
      expect(axe.commons.dom.isVisible(el, true)).toBe(true);
    });

    it('should return true if moved offscreen with bottom', function () {
      fixture.innerHTML =
        '<div id="target" style="position: absolute; bottom: -9999px">Hi</div>';
      const el = document.getElementById('target');
      expect(axe.commons.dom.isVisible(el, true)).toBe(true);
    });

    it('should return true if text is moved offscreen with text-indent', function () {
      fixture.innerHTML =
        '<div id="target" style="text-indent: -9999px">Hi</div>';
      const el = document.getElementById('target');
      expect(axe.commons.dom.isVisible(el, true)).toBe(true);
    });

    it('should return false on detached elements', function () {
      const el = document.createElement('div');
      el.innerHTML = 'I am not visible because I am detached!';

      expect(axe.commons.dom.isVisible(el, true)).toBe(false);
    });

    it('should return true on a document', function () {
      expect(axe.commons.dom.isVisible(document, true)).toBe(true);
    });

    it('should return true if positioned staticly but top/left is set', function () {
      fixture.innerHTML =
        '<div id="target" style="top: -9999px; left: -9999px;' +
        'right: -9999px; bottom: -9999px;">Hi</div>';
      const el = document.getElementById('target');
      expect(axe.commons.dom.isVisible(el, true)).toBe(true);
    });

    it('should return false if `aria-hidden` is set', function () {
      fixture.innerHTML =
        '<div id="target" aria-hidden="true">Hidden from screen readers</div>';

      const el = document.getElementById('target');
      expect(axe.commons.dom.isVisible(el, true)).toBe(false);
    });

    it('should return false if `aria-hidden` is set on parent', function () {
      fixture.innerHTML =
        '<div aria-hidden="true"><div id="target">Hidden from screen readers</div></div>';

      const el = document.getElementById('target');
      expect(axe.commons.dom.isVisible(el, true)).toBe(false);
    });

    it('should not calculate position on parents', function () {
      fixture.innerHTML =
        '<div style="position: absolute; top: -400px; left: -400px;">' +
        '<div id="target" style="position: absolute; top: 500px; left: 500px">Hi</div>' +
        '</div>';

      const el = document.getElementById('target');
      expect(axe.commons.dom.isVisible(el, true)).toBe(true);
    });

    it('should know how `visibility` works', function () {
      fixture.innerHTML =
        '<div style="visibility: hidden;">' +
        '<div id="target" style="visibility: visible;">Hi</div>' +
        '</div>';

      const el = document.getElementById('target');
      expect(axe.commons.dom.isVisible(el, true)).toBe(true);
    });

    it('should detect clip rect hidden text technique', function () {
      const el,
        clip =
          'clip: rect(1px 1px 1px 1px);' +
          'clip: rect(1px, 1px, 1px, 1px);' +
          'width: 1px; height: 1px;' +
          'position: absolute;' +
          'overflow: hidden;';

      fixture.innerHTML = '<div id="target" style="' + clip + '">Hi</div>';

      el = document.getElementById('target');
      expect(axe.commons.dom.isVisible(el, true)).toBe(true);
    });

    it('should detect even when clip is not applied because of positioning', function () {
      const el,
        clip =
          'clip: rect(1px 1px 1px 1px);' +
          'clip: rect(1px, 1px, 1px, 1px);' +
          'position: relative;' +
          'overflow: hidden;';

      fixture.innerHTML = '<div id="target" style="' + clip + '">Hi</div>';

      el = document.getElementById('target');
      expect(axe.commons.dom.isVisible(el, true)).toBe(true);
    });

    it('should detect clip rect hidden text technique on parent', function () {
      const el,
        clip =
          'clip: rect(1px 1px 1px 1px);' +
          'clip: rect(1px, 1px, 1px, 1px);' +
          'width: 1px; height: 1px;' +
          'position: absolute;' +
          'overflow: hidden;';

      fixture.innerHTML =
        '<div style="' + clip + '">' + '<div id="target">Hi</div>' + '</div>';

      el = document.getElementById('target');
      expect(axe.commons.dom.isVisible(el, true)).toBe(true);
    });

    it('should detect even when clip is not applied because of positioning on parent', function () {
      const el,
        clip =
          'clip: rect(1px 1px 1px 1px);' +
          'clip: rect(1px, 1px, 1px, 1px);' +
          'position: relative;' +
          'overflow: hidden;';

      fixture.innerHTML =
        '<div style="' + clip + '">' + '<div id="target">Hi</div>' + '</div>';

      el = document.getElementById('target');
      expect(axe.commons.dom.isVisible(el, true)).toBe(true);
    });

    it('should detect poorly hidden clip rects', function () {
      const el,
        clip =
          'clip: rect(5px 1px 1px 5px);' +
          'clip: rect(5px, 1px, 1px, 5px);' +
          'width: 1px; height: 1px;' +
          'position: absolute;' +
          'overflow: hidden;';

      fixture.innerHTML = '<div id="target" style="' + clip + '">Hi</div>';

      el = document.getElementById('target');
      expect(axe.commons.dom.isVisible(el, true)).toBe(true);
    });

    it('should detect clip-path hidden text technique', function () {
      fixture.innerHTML =
        '<div id="target" style="clip-path: inset(50%);">Hi</div>';

      const el = document.getElementById('target');
      expect(axe.commons.dom.isVisible(el, true)).toBe(true);
    });

    it('should detect clip-path hidden text technique on parent', function () {
      fixture.innerHTML =
        '<div style="clip-path: circle(0%);">' +
        '<div id="target">Hi</div>' +
        '</div>';

      const el = document.getElementById('target');
      expect(axe.commons.dom.isVisible(el, true)).toBe(true);
    });
  });

  describe('SerialVirtualNode', function () {
    it('should return true on statically-positioned, visible elements', function () {
      const vNode = new axe.SerialVirtualNode({
        nodeName: 'div'
      });
      expect(axe.commons.dom.isVisible(vNode)).toBe(true);
    });

    it('should return false on STYLE tag', function () {
      const vNode = new axe.SerialVirtualNode({
        nodeName: 'style'
      });
      const actual = axe.commons.dom.isVisible(vNode);
      expect(actual).toBe(false);
    });

    it('should return false on NOSCRIPT tag', function () {
      const vNode = new axe.SerialVirtualNode({
        nodeName: 'noscript'
      });
      const actual = axe.commons.dom.isVisible(vNode);
      expect(actual).toBe(false);
    });

    it('should return false on TEMPLATE tag', function () {
      const vNode = new axe.SerialVirtualNode({
        nodeName: 'template'
      });
      const actual = axe.commons.dom.isVisible(vNode);
      expect(actual).toBe(false);
    });

    it('should not be affected by `aria-hidden`', function () {
      const vNode = new axe.SerialVirtualNode({
        nodeName: 'div',
        attributes: {
          'aria-hidden': true
        }
      });
      expect(axe.commons.dom.isVisible(vNode)).toBe(true);
    });

    describe('screen readers', function () {
      it('should return false if `aria-hidden` is set', function () {
        const vNode = new axe.SerialVirtualNode({
          nodeName: 'div',
          attributes: {
            'aria-hidden': true
          }
        });
        expect(axe.commons.dom.isVisible(vNode, true)).toBe(false);
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
        expect(axe.commons.dom.isVisible(vNode, true)).toBe(false);
      });
    });
  });
});
