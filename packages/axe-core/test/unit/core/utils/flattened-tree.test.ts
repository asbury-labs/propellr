import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
const fixture = document.getElementById('fixture');
const shadowSupport = axe.testUtils.shadowSupport;

describe('axe.utils.getFlattenedTree', () => {
  function createStyle(box) {
    const style = document.createElement('style');
    style.textContent =
      'div.breaking { color: Red;font-size: 20px; border: 1px dashed Purple; }' +
      (box ? 'slot { display: block; }' : '') +
      'div.other { padding: 2px 0 0 0; border: 1px solid Cyan; }';
    return style;
  }

  function flattenedTreeAssertions() {
    let virtualDOM = axe.utils.getFlattenedTree(fixture.firstChild);
    expect(virtualDOM.length).toBe(1); // host
    expect(virtualDOM[0].actualNode.nodeName).toBe('DIV');

    const parentDOM = virtualDOM[0];
    virtualDOM = virtualDOM[0].children;
    expect(virtualDOM.length).toBe(3);
    expect(virtualDOM[0].actualNode.nodeName).toBe('STYLE');
    expect(virtualDOM[0].parent).toBe(parentDOM);

    // breaking news stories
    expect(virtualDOM[1].actualNode.nodeName).toBe('DIV');
    expect(virtualDOM[1].actualNode.className).toBe('breaking');
    expect(virtualDOM[1].parent).toBe(parentDOM);

    // other news stories
    expect(virtualDOM[2].actualNode.nodeName).toBe('DIV');
    expect(virtualDOM[2].actualNode.className).toBe('other');
    expect(virtualDOM[2].parent).toBe(parentDOM);

    // breaking
    expect(virtualDOM[1].children.length).toBe(1);
    expect(virtualDOM[1].children[0].actualNode.nodeName).toBe('UL');
    expect(virtualDOM[1].children[0].parent).toBe(virtualDOM[1]);
    virtualDOM[1].children[0].children.forEach((child, index) => {
      expect(child.actualNode.nodeName).toBe('LI');
      expect(child.actualNode.textContent === 3 * (index + 1) + '').toBe(true);
    });
    expect(virtualDOM[1].children[0].children.length).toBe(2);

    // other
    expect(virtualDOM[2].children.length).toBe(1);
    expect(virtualDOM[2].children[0].actualNode.nodeName).toBe('UL');
    expect(virtualDOM[2].children[0].parent).toBe(virtualDOM[2]);
    expect(virtualDOM[2].children[0].children.length).toBe(4);
  }

  function shadowIdAssertions() {
    let virtualDOM = axe.utils.getFlattenedTree(fixture);
    expect(virtualDOM[0].shadowId).toBeUndefined(); //fixture
    expect(virtualDOM[0].children[0].shadowId).toBeUndefined(); //host
    expect(virtualDOM[0].children[0].children[0].shadowId).toBeDefined();
    expect(virtualDOM[0].children[0].children[1].shadowId).toBeDefined();
    expect(virtualDOM[0].children[1].children[0].shadowId).toBeDefined();
    // shadow IDs in the same shadowRoot must be the same
    expect(virtualDOM[0].children[0].children[0].shadowId).toBe(
      virtualDOM[0].children[0].children[1].shadowId
    );
    // should cascade
    expect(virtualDOM[0].children[0].children[1].shadowId).toBe(
      virtualDOM[0].children[0].children[1].children[0].shadowId
    );
    // shadow IDs in different shadowRoots must be different
    expect(virtualDOM[0].children[0].children[0].shadowId).not.toBe(
      virtualDOM[0].children[1].children[0].shadowId
    );
  }

  afterEach(() => {
    fixture.innerHTML = '';
  });

  it('should default to document', () => {
    fixture.innerHTML = '';
    let tree = axe.utils.getFlattenedTree();
    expect(tree[0].actualNode === document.documentElement).toBeTruthy();
  });

  it('should set `null` on the parent for the root node', () => {
    let tree = axe.utils.getFlattenedTree();
    expect(tree[0].parent === null).toBeTruthy();
  });

  it('creates virtual nodes in the correct order', () => {
    fixture.innerHTML = '<p><b><i></i></b></p><u><s></s></u>';

    let vNode = axe.utils.getFlattenedTree(fixture)[0];
    expect(vNode.nodeIndex).toBe(0);
    expect(vNode.props.nodeName).toBe('div');
    expect(vNode.children[0].nodeIndex).toBe(1);
    expect(vNode.children[0].props.nodeName).toBe('p');
    expect(vNode.children[0].children[0].nodeIndex).toBe(2);
    expect(vNode.children[0].children[0].props.nodeName).toBe('b');
    expect(vNode.children[0].children[0].children[0].nodeIndex).toBe(3);
    expect(vNode.children[0].children[0].children[0].props.nodeName).toBe('i');
    expect(vNode.children[1].nodeIndex).toBe(4);
    expect(vNode.children[1].props.nodeName).toBe('u');
    expect(vNode.children[1].children[0].nodeIndex).toBe(5);
    expect(vNode.children[1].children[0].props.nodeName).toBe('s');
  });

  it('should add selectorMap to root element', () => {
    let tree = axe.utils.getFlattenedTree();
    expect(tree[0]._selectorMap).toBeDefined();
  });

  if (shadowSupport.v0) {
    describe('shadow DOM v0', () => {
      beforeEach(() => {
        function createStoryGroup(className, contentSelector) {
          let group = document.createElement('div');
          group.className = className;
          group.innerHTML =
            '<ul><content select="' + contentSelector + '"></content></ul>';
          return group;
        }

        function makeShadowTree(storyList) {
          let root = storyList.createShadowRoot();
          root.appendChild(createStyle());
          root.appendChild(createStoryGroup('breaking', '.breaking'));
          root.appendChild(createStoryGroup('other', ''));
        }
        let str =
          '<div class="stories"><li>1</li>' +
          '<li>2</li><li class="breaking" slot="breaking">3</li>' +
          '<li>4</li><li>5</li><li class="breaking">6</li></div>';
        str +=
          '<div class="stories"><li>1</li>' +
          '<li>2</li><li class="breaking" slot="breaking">3</li>' +
          '<li>4</li><li>5</li><li class="breaking">6</li></div>';
        fixture.innerHTML = str;

        fixture.querySelectorAll('.stories').forEach(makeShadowTree);
      });
      it('it should support shadow DOM v0', () => {
        expect(fixture.firstChild.shadowRoot).toBeDefined();
      });
      it('getFlattenedTree should return an array of stuff', () => {
        expect(
          Array.isArray(axe.utils.getFlattenedTree(fixture.firstChild))
        ).toBe(true);
      });
      it(
        "getFlattenedTree's virtual DOM should represent the flattened tree",
        flattenedTreeAssertions
      );
      it(
        "getFlattenedTree's virtual DOM should give an ID to the shadow DOM",
        shadowIdAssertions
      );
    });
  }

  if (shadowSupport.v1) {
    describe('shadow DOM v1', () => {
      beforeEach(() => {
        function createStoryGroup(className, slotName) {
          let group = document.createElement('div');
          group.className = className;
          // Empty string in slot name attribute or absence thereof work the same, so no need for special handling.
          group.innerHTML =
            '<ul><slot name="' +
            slotName +
            '">fallback content<li>one</li></slot></ul>';
          return group;
        }

        function makeShadowTree(storyList) {
          let root = storyList.attachShadow({ mode: 'open' });
          root.appendChild(createStyle());
          root.appendChild(createStoryGroup('breaking', 'breaking'));
          root.appendChild(createStoryGroup('other', ''));
        }
        let str =
          '<div class="stories"><li>1</li>' +
          '<li>2</li><li class="breaking" slot="breaking">3</li>' +
          '<li>4</li><li>5</li><li class="breaking" slot="breaking">6</li></div>';
        str +=
          '<div class="stories"><li>1</li>' +
          '<li>2</li><li class="breaking" slot="breaking">3</li>' +
          '<li>4</li><li>5</li><li class="breaking" slot="breaking">6</li></div>';
        str += '<div class="stories"></div>';
        fixture.innerHTML = str;

        fixture.querySelectorAll('.stories').forEach(makeShadowTree);
      });
      it('should support shadow DOM v1', () => {
        expect(fixture.firstChild.shadowRoot).toBeDefined();
      });
      it('getFlattenedTree should return an array of stuff', () => {
        expect(
          Array.isArray(axe.utils.getFlattenedTree(fixture.firstChild))
        ).toBe(true);
      });
      it(
        "getFlattenedTree's virtual DOM should represent the flattened tree",
        flattenedTreeAssertions
      );
      it(
        "getFlattenedTree's virtual DOM should give an ID to the shadow DOM",
        shadowIdAssertions
      );
      it("getFlattenedTree's virtual DOM should have the fallback content", () => {
        let virtualDOM = axe.utils.getFlattenedTree(fixture);
        expect(
          virtualDOM[0].children[2].children[1].children[0].children.length ===
            2
        ).toBe(true);
        expect(
          virtualDOM[0].children[2].children[1].children[0].children[0]
            .actualNode.nodeType === 3
        ).toBe(true);
        expect(
          virtualDOM[0].children[2].children[1].children[0].children[0]
            .actualNode.textContent === 'fallback content'
        ).toBe(true);
        expect(
          virtualDOM[0].children[2].children[1].children[0].children[1]
            .actualNode.nodeName === 'LI'
        ).toBe(true);
      });
    });
    describe('shadow DOM v1: boxed slots', () => {
      afterEach(() => {
        fixture.innerHTML = '';
      });
      beforeEach(() => {
        function createStoryGroup(className, slotName) {
          let group = document.createElement('div');
          group.className = className;
          // Empty string in slot name attribute or absence thereof work the same, so no need for special handling.
          group.innerHTML =
            '<ul><slot name="' +
            slotName +
            '">fallback content<li>one</li></slot></ul>';
          return group;
        }

        function makeShadowTree(storyList) {
          let root = storyList.attachShadow({ mode: 'open' });
          root.appendChild(createStyle(true));
          root.appendChild(createStoryGroup('breaking', 'breaking'));
          root.appendChild(createStoryGroup('other', ''));
        }
        let str =
          '<div class="stories"><li>1</li>' +
          '<li>2</li><li class="breaking" slot="breaking">3</li>' +
          '<li>4</li><li>5</li><li class="breaking" slot="breaking">6</li></div>';
        str +=
          '<div class="stories"><li>1</li>' +
          '<li>2</li><li class="breaking" slot="breaking">3</li>' +
          '<li>4</li><li>5</li><li class="breaking" slot="breaking">6</li></div>';
        str += '<div class="stories"></div>';
        fixture.innerHTML = str;

        fixture.querySelectorAll('.stories').forEach(makeShadowTree);
      });
      it("getFlattenedTree's virtual DOM should have the <slot> elements", () => {
        return; // Chrome's implementation of slot is broken
        // var virtualDOM = axe.utils.getFlattenedTree(fixture);
        // expect(virtualDOM[0].children[1].children[0].children[0].actualNode.nodeName === 'SLOT').toBe(true);
      });
    });
    describe('getNodeFromTree', () => {
      afterEach(() => {
        fixture.innerHTML = '';
      });
      beforeEach(() => {
        function createStoryGroup(className, slotName) {
          let group = document.createElement('div');
          group.className = className;
          // Empty string in slot name attribute or absence thereof work the same, so no need for special handling.
          group.innerHTML =
            '<ul><slot name="' +
            slotName +
            '">fallback content<li>one</li></slot></ul>';
          return group;
        }

        function makeShadowTree(storyList) {
          let root = storyList.attachShadow({ mode: 'open' });
          root.appendChild(createStyle());
          root.appendChild(createStoryGroup('breaking', 'breaking'));
          root.appendChild(createStoryGroup('other', ''));
        }
        let str =
          '<div class="stories"><li>1</li>' +
          '<li>2</li><li class="breaking" slot="breaking">3</li>' +
          '<li>4</li><li>5</li><li class="breaking" slot="breaking">6</li></div>';
        str +=
          '<div class="stories"><li>1</li>' +
          '<li>2</li><li class="breaking" slot="breaking">3</li>' +
          '<li>4</li><li>5</li><li class="breaking" slot="breaking">6</li></div>';
        str += '<div class="stories"></div>';
        fixture.innerHTML = str;

        fixture.querySelectorAll('.stories').forEach(makeShadowTree);
      });
      it('should find the virtual node that matches the real node passed in', () => {
        axe.utils.getFlattenedTree(fixture);
        const node = document.querySelector('.stories li');
        let vNode = axe.utils.getNodeFromTree(node);
        expect(vNode).toBeDefined();
        expect(node).toBe(vNode.actualNode);
        expect(vNode.actualNode.textContent).toBe('1');
      });
      it('should find the virtual node if it is the very top of the tree', () => {
        let virtualDOM = axe.utils.getFlattenedTree(fixture);
        let vNode = axe.utils.getNodeFromTree(
          virtualDOM[0],
          virtualDOM[0].actualNode
        );
        expect(vNode).toBeDefined();
        expect(virtualDOM[0].actualNode).toBe(vNode.actualNode);
      });
      it('should not throw if getDistributedNodes is missing', () => {
        const getDistributedNodes = fixture.getDistributedNodes;
        fixture.getDistributedNodes = undefined;
        try {
          let virtualDOM = axe.utils.getFlattenedTree(fixture);
          let vNode = axe.utils.getNodeFromTree(
            virtualDOM[0],
            virtualDOM[0].actualNode
          );
          expect(vNode).toBeDefined();
          expect(virtualDOM[0].actualNode).toBe(vNode.actualNode);
        } finally {
          fixture.getDistributedNodes = getDistributedNodes;
        }
      });
    });
  } else {
    it('does not throw when slot elements are used', () => {
      fixture.innerHTML = '<button><slot></slot></button>';
      expect(() => {
        axe.utils.getFlattenedTree(fixture);
      }).not.toThrow();
    });
  }

  if (shadowSupport.undefined) {
    describe('shadow dom undefined', () => {
      it('SHADOW DOM TESTS DEFERRED, NO SUPPORT');
    });
  }
});
