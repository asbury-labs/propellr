import { describe, it, afterEach, expect } from 'vitest';

declare const axe: any;
describe('text.visible', function () {
  const fixture = document.getElementById('fixture');
  const shadowSupported = axe.testUtils.shadowSupport.v1;
  const visibleVirtual = axe.commons.text.visibleVirtual;

  afterEach(function () {
    document.getElementById('fixture').innerHTML = '';
  });

  describe('non-screen-reader', function () {
    it('should not return elements with visibility: hidden', function () {
      fixture.innerHTML = 'Hello<span style="visibility: hidden;">Hi</span>';
      const tree = axe.utils.getFlattenedTree(fixture);
      expect(visibleVirtual(tree[0])).toBe('Hello');
    });

    it('should handle implicitly recursive calls', function () {
      fixture.innerHTML = 'Hello<span><span>Hi</span></span>';
      const tree = axe.utils.getFlattenedTree(fixture);
      expect(visibleVirtual(tree[0])).toBe('HelloHi');
    });

    it('should handle explicitly recursive calls', function () {
      fixture.innerHTML = 'Hello<span><span>Hi</span></span>';
      const tree = axe.utils.getFlattenedTree(fixture);
      expect(visibleVirtual(tree[0], null, false)).toBe('HelloHi');
    });

    it('should handle non-recursive calls', function () {
      fixture.innerHTML = 'Hello<span><span>Hi</span></span>';
      const tree = axe.utils.getFlattenedTree(fixture);
      expect(visibleVirtual(tree[0], null, true)).toBe('Hello');
    });

    it('should know how visibility works', function () {
      fixture.innerHTML =
        'Hello <span style="visibility: hidden;">' +
        '<span style="visibility: visible;">Hi</span>' +
        '</span>';

      const tree = axe.utils.getFlattenedTree(fixture);
      expect(visibleVirtual(tree[0])).toBe('Hello Hi');
    });

    it('should not return elements with display: none', function () {
      fixture.innerHTML =
        'Hello<span style="display: none;"><span>Hi</span></span>';

      const tree = axe.utils.getFlattenedTree(fixture);
      expect(visibleVirtual(tree[0])).toBe('Hello');
    });

    it('should trim the result', function () {
      fixture.innerHTML =
        '   &nbsp;\u00A0    Hello  &nbsp;\r\n   Hi     \n \n &nbsp; \n   ';
      const tree = axe.utils.getFlattenedTree(fixture);
      expect(visibleVirtual(tree[0])).toBe('Hello Hi');
    });

    it('should ignore script and style tags', function () {
      fixture.innerHTML =
        '<script> // hello </script><style> /*hello */</style>' + 'Hello';

      const tree = axe.utils.getFlattenedTree(fixture);
      expect(visibleVirtual(tree[0])).toBe('Hello');
    });

    it('should not take into account position of parents', function () {
      fixture.innerHTML =
        '<div style="position: absolute; top: -9999px;">' +
        '<div style="position: absolute; top: 10000px;">Hello</div>' +
        '</div>';

      const tree = axe.utils.getFlattenedTree(fixture);
      expect(visibleVirtual(tree[0])).toBe('Hello');
    });

    (shadowSupported ? it : xit)(
      'should correctly handle slotted elements',
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
        expect(visibleVirtual(tree[0])).toBe('Stuffhello');
      }
    );
  });

  describe('screen reader', function () {
    it('should not return elements with visibility: hidden', function () {
      fixture.innerHTML = 'Hello<span style="visibility: hidden;">Hi</span>';

      const tree = axe.utils.getFlattenedTree(fixture);
      expect(visibleVirtual(tree[0], true)).toBe('Hello');
    });

    it('should know how visibility works', function () {
      fixture.innerHTML =
        'Hello <span style="visibility: hidden;">' +
        '<span style="visibility: visible;">Hi</span>' +
        '</span>';

      const tree = axe.utils.getFlattenedTree(fixture);
      expect(visibleVirtual(tree[0], true)).toBe('Hello Hi');
    });

    it('should not return elements with display: none', function () {
      fixture.innerHTML =
        'Hello<span style="display: none;"><span>Hi</span></span>';

      const tree = axe.utils.getFlattenedTree(fixture);
      expect(visibleVirtual(tree[0], true)).toBe('Hello');
    });

    it('should trim the result', function () {
      fixture.innerHTML =
        '   &nbsp;\u00A0    Hello  &nbsp;\r\n   Hi     \n \n &nbsp; \n   ';
      const tree = axe.utils.getFlattenedTree(fixture);
      expect(visibleVirtual(tree[0], true)).toBe('Hello Hi');
    });

    it('should ignore script and style tags', function () {
      fixture.innerHTML =
        '<script> // hello </script><style> /*hello */</style>' + 'Hello';

      const tree = axe.utils.getFlattenedTree(fixture);
      expect(visibleVirtual(tree[0], true)).toBe('Hello');
    });

    it('should not consider offscreen text as hidden (position)', function () {
      fixture.innerHTML =
        '<div style="position: absolute; top: -9999px;">' +
        '<div>Hello</div>' +
        '</div>';

      const tree = axe.utils.getFlattenedTree(fixture);
      expect(visibleVirtual(tree[0], true)).toBe('Hello');
    });

    it('should not consider offscreen text as hidden (text-indent)', function () {
      fixture.innerHTML = '<div style="text-indent: -9999px;">' + 'Hello</div>';

      const tree = axe.utils.getFlattenedTree(fixture);
      expect(visibleVirtual(tree[0], true)).toBe('Hello');
    });
  });
});
