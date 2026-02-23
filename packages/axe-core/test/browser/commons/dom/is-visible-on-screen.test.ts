import { describe, it, expect } from 'vitest';
import { queryFixture, shadowSupport, flatTreeSetup } from '../../../testutils';

declare const axe: any;
describe('dom.isVisibleOnScreen', function () {
  const fixture = document.querySelector('#fixture');
  const isIE11 = false;
  const shadowSupported = shadowSupport.v1;
  const isVisibleOnScreen = axe.commons.dom.isVisibleOnScreen;

  it('should return true on statically-positioned, visible elements', function () {
    const vNode = queryFixture('<div id="target">Hello!</div>');

    expect(isVisibleOnScreen(vNode)).toBe(true);
  });

  it('should return true on absolutely positioned elements that are on-screen', function () {
    const vNode = queryFixture(
      '<div id="target" style="position: absolute; left: 10px; right: 10px">hi</div>'
    );

    expect(isVisibleOnScreen(vNode)).toBe(true);
  });

  it('should respect position: fixed', function () {
    const vNode = queryFixture(
      '<div id="target" style="position:fixed; bottom: 0; left: 0;">StickySticky</div>'
    );

    expect(isVisibleOnScreen(vNode)).toBe(true);
  });

  it('should properly calculate offsets according the offsetParent', function () {
    const vNode = queryFixture(
      '<div style="position: absolute; top: 400px; left: 400px;">' +
        '<div id="target" style="position: absolute; top: -400px; left: -400px">Hi</div>' +
        '</div>'
    );
    expect(isVisibleOnScreen(vNode)).toBe(true);
  });

  it('should return false if moved offscreen with left', function () {
    const vNode = queryFixture(
      '<div id="target" style="position: absolute; left: -9999px">Hi</div>'
    );
    expect(isVisibleOnScreen(vNode)).toBe(false);
  });

  it('should return false if moved offscreen with top', function () {
    const vNode = queryFixture(
      '<div id="target" style="position: absolute; top: -9999px">Hi</div>'
    );
    expect(isVisibleOnScreen(vNode)).toBe(false);
  });

  it('should return false on detached elements', function () {
    const el = document.createElement('div');
    el.innerHTML = 'I am not visible because I am detached!';
    flatTreeSetup(el);
    expect(isVisibleOnScreen(el)).toBe(false);
  });

  it('should return true on body', function () {
    flatTreeSetup(document.body);
    const actual = isVisibleOnScreen(document.body);
    expect(actual).toBe(true);
  });

  it('should return true on html', function () {
    flatTreeSetup(document.documentElement);
    const actual = isVisibleOnScreen(document.documentElement);
    expect(actual).toBe(true);
  });

  it('should return false on STYLE tag', function () {
    const vNode = queryFixture(
      '<style id="target"> @import "https://cdnjs.cloudflare.com/ajax/libs/skeleton/2.0.4/skeleton.css"; .green { background-color: green; } </style>'
    );
    const actual = isVisibleOnScreen(vNode);
    expect(actual).toBe(false);
  });

  it('should return false on NOSCRIPT tag', function () {
    const vNode = queryFixture(
      '<noscript id="target"><p class="invisible"><img src="/piwik/piwik.php?idsite=1" alt="" /></p></noscript>'
    );
    const actual = isVisibleOnScreen(vNode);
    expect(actual).toBe(false);
  });

  it('should return false on TEMPLATE tag', function () {
    const vNode = queryFixture(
      '<template id="target"><div>Name:</div></template>'
    );
    const actual = isVisibleOnScreen(vNode);
    expect(actual).toBe(false);
  });

  it('should return true if positioned statically but top/left is set', function () {
    const vNode = queryFixture(
      '<div id="target" style="top: -9999px; left: -9999px;' +
        'right: -9999px; bottom: -9999px;">Hi</div>'
    );
    expect(isVisibleOnScreen(vNode)).toBe(true);
  });

  it('should not be affected by `aria-hidden`', function () {
    const vNode = queryFixture(
      '<div id="target" aria-hidden="true">Hidden from screen readers</div>'
    );

    expect(isVisibleOnScreen(vNode)).toBe(true);
  });

  it('should not calculate position on parents', function () {
    const vNode = queryFixture(
      '<div style="position: absolute; top: -400px; left: -400px;">' +
        '<div id="target" style="position: absolute; top: 500px; left: 500px">Hi</div>' +
        '</div>'
    );

    expect(isVisibleOnScreen(vNode)).toBe(true);
  });

  it('should know how `visibility` works', function () {
    const vNode = queryFixture(
      '<div style="visibility: hidden;">' +
        '<div id="target" style="visibility: visible;">Hi</div>' +
        '</div>'
    );

    expect(isVisibleOnScreen(vNode)).toBe(true);
  });

  it('should detect clip rect hidden text technique', function () {
    const clip =
      'clip: rect(1px 1px 1px 1px);' +
      'clip: rect(1px, 1px, 1px, 1px);' +
      'width: 1px; height: 1px;' +
      'position: absolute;' +
      'overflow: hidden;';

    const vNode = queryFixture(
      '<div id="target" style="' + clip + '">Hi</div>'
    );

    expect(isVisibleOnScreen(vNode)).toBe(false);
  });

  it('should detect clip rect hidden text technique using position: fixed', function () {
    const clip =
      'clip: rect(1px 1px 1px 1px);' +
      'clip: rect(1px, 1px, 1px, 1px);' +
      'width: 1px; height: 1px;' +
      'position: fixed;' +
      'overflow: hidden;';

    const vNode = queryFixture(
      '<div id="target" style="' + clip + '">Hi</div>'
    );

    expect(isVisibleOnScreen(vNode)).toBe(false);
  });

  it('should detect when clip is not applied because of positioning', function () {
    const clip =
      'clip: rect(1px 1px 1px 1px);' +
      'clip: rect(1px, 1px, 1px, 1px);' +
      'position: relative;' +
      'overflow: hidden;';

    const vNode = queryFixture(
      '<div id="target" style="' + clip + '">Hi</div>'
    );

    expect(isVisibleOnScreen(vNode)).toBe(true);
  });

  it('should detect clip rect hidden text technique on parent', function () {
    const clip =
      'clip: rect(1px 1px 1px 1px);' +
      'clip: rect(1px, 1px, 1px, 1px);' +
      'width: 1px; height: 1px;' +
      'position: absolute;' +
      'overflow: hidden;';

    const vNode = queryFixture(
      '<div style="' + clip + '">' + '<div id="target">Hi</div>' + '</div>'
    );

    expect(isVisibleOnScreen(vNode)).toBe(false);
  });

  it('should detect when clip is not applied because of positioning on parent', function () {
    const clip =
      'clip: rect(1px 1px 1px 1px);' +
      'clip: rect(1px, 1px, 1px, 1px);' +
      'position: relative;' +
      'overflow: hidden;';

    const vNode = queryFixture(
      '<div style="' + clip + '">' + '<div id="target">Hi</div>' + '</div>'
    );

    expect(isVisibleOnScreen(vNode)).toBe(true);
  });

  it('should detect poorly hidden clip rects', function () {
    const clip =
      'clip: rect(5px 1px 1px 5px);' +
      'clip: rect(5px, 1px, 1px, 5px);' +
      'width: 1px; height: 1px;' +
      'position: absolute;' +
      'overflow: hidden;';

    const vNode = queryFixture(
      '<div id="target" style="' + clip + '">Hi</div>'
    );

    expect(isVisibleOnScreen(vNode)).toBe(false);
  });

  it('should return false for display: none', function () {
    const vNode = queryFixture(
      '<div id="target" style="display: none">Hello!</div>'
    );

    expect(isVisibleOnScreen(vNode)).toBe(false);
  });

  it('should return false for opacity: 0', function () {
    const vNode = queryFixture(
      '<div id="target" style="opacity: 0">Hello!</div>'
    );

    expect(isVisibleOnScreen(vNode)).toBe(false);
  });

  it('should return false for 0 height scrollable region', function () {
    const vNode = queryFixture(
      '<div style="overflow: scroll; height: 0"><div id="target">Hello!</div></div>'
    );

    expect(isVisibleOnScreen(vNode)).toBe(false);
  });

  it('should return false for 0 width scrollable region', function () {
    const vNode = queryFixture(
      '<div style="overflow: scroll; width: 0"><div id="target">Hello!</div></div>'
    );

    expect(isVisibleOnScreen(vNode)).toBe(false);
  });

  it('returns false for `AREA` without closest `MAP` element', function () {
    const vNode = queryFixture(
      '<area id="target" role="link" shape="circle" coords="130,136,60" aria-label="MDN"/>'
    );
    const actual = isVisibleOnScreen(vNode);
    expect(actual).toBe(false);
  });

  it('returns false for `AREA` with closest `MAP` with no name attribute', function () {
    const vNode = queryFixture(
      '<map>' +
        '<area id="target" role="link" shape="circle" coords="130,136,60" aria-label="MDN"/>' +
        '</map>'
    );
    const actual = isVisibleOnScreen(vNode);
    expect(actual).toBe(false);
  });

  (shadowSupported ? it : xit)(
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
      const actual = isVisibleOnScreen(target);
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
    const actual = isVisibleOnScreen(vNode);
    expect(actual).toBe(false);
  });

  it('returns false for `AREA` with `MAP` and used in `IMG` which is not visible', function () {
    const vNode = queryFixture(
      '<map name="infographic">' +
        '<area id="target" role="link" shape="circle" coords="130,136,60" aria-label="MDN"/>' +
        '</map>' +
        '<img usemap="#infographic" alt="MDN infographic" style="display:none"/>'
    );
    const actual = isVisibleOnScreen(vNode);
    expect(actual).toBe(false);
  });

  it('returns true for `AREA` with `MAP` and used in `IMG` which is visible', function () {
    const vNode = queryFixture(
      '<map name="infographic">' +
        '<area id="target" role="link" shape="circle" coords="130,136,60" aria-label="MDN"/>' +
        '</map>' +
        '<img usemap="#infographic" alt="MDN infographic" />'
    );
    const actual = isVisibleOnScreen(vNode);
    expect(actual).toBe(true);
  });

  // IE11 either only supports clip paths defined by url() or not at all,
  // MDN and caniuse.com give different results...
  (isIE11 ? it.skip : it)(
    'should detect clip-path hidden text technique',
    function () {
      const vNode = queryFixture(
        '<div id="target" style="clip-path: inset(50%);">Hi</div>'
      );

      expect(isVisibleOnScreen(vNode)).toBe(false);
    }
  );

  (isIE11 ? it.skip : it)(
    'should detect clip-path hidden text technique on parent',
    function () {
      const vNode = queryFixture(
        '<div style="clip-path: circle(0%);">' +
          '<div id="target">Hi</div>' +
          '</div>'
      );

      expect(isVisibleOnScreen(vNode)).toBe(false);
    }
  );

  (shadowSupported ? it : xit)(
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
      expect(isVisibleOnScreen(el.actualNode)).toBe(true);
    }
  );
  (shadowSupported ? it : xit)(
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
      expect(isVisibleOnScreen(el.actualNode)).toBe(false);
    }
  );

  it('should return false for screen reader only technique', function () {
    const vNode = queryFixture(
      '<div id="target" style="position: absolute; width: 1px; height: 1x; margin: -1px; padding: 0; border: 0; overflow: hidden;">Visually Hidden</div>'
    );

    expect(isVisibleOnScreen(vNode)).toBe(false);
  });

  it('should return false for element outside "overflow:hidden"', function () {
    const vNode = queryFixture(
      '<div style="overflow: hidden; height: 100px;"><div id="target" style="margin-top: 200px;">Visually Hidden</div></div>'
    );

    expect(isVisibleOnScreen(vNode)).toBe(false);
  });

  describe('SerialVirtualNode', function () {
    it('should return true on statically-positioned, visible elements', function () {
      const vNode = new axe.SerialVirtualNode({
        nodeName: 'div'
      });
      expect(isVisibleOnScreen(vNode)).toBe(true);
    });

    it('should return false on STYLE tag', function () {
      const vNode = new axe.SerialVirtualNode({
        nodeName: 'style'
      });
      const actual = isVisibleOnScreen(vNode);
      expect(actual).toBe(false);
    });

    it('should return false on NOSCRIPT tag', function () {
      const vNode = new axe.SerialVirtualNode({
        nodeName: 'noscript'
      });
      const actual = isVisibleOnScreen(vNode);
      expect(actual).toBe(false);
    });

    it('should return false on TEMPLATE tag', function () {
      const vNode = new axe.SerialVirtualNode({
        nodeName: 'template'
      });
      const actual = isVisibleOnScreen(vNode);
      expect(actual).toBe(false);
    });

    it('should not be affected by `aria-hidden`', function () {
      const vNode = new axe.SerialVirtualNode({
        nodeName: 'div',
        attributes: {
          'aria-hidden': true
        }
      });
      expect(isVisibleOnScreen(vNode)).toBe(true);
    });
  });
});
