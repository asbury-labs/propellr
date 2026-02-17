import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
// describes the API used by axe Pro
describe('external API', () => {
  afterEach(() => {
    // setup _tree as needed, always reset
    axe._tree = null;
  });

  describe('axe.commons.text.sanitize', () => {
    it('must have the signature String -> String {role.type}', () => {
      const keys = getKeys(axe.commons.aria.lookupTable.role);
      const types = getValues(axe.commons.aria.lookupTable.role).map(
        function (role) {
          return role.type;
        }
      );
      keys.forEach(k => expect(typeof k).toBe('string'));
      types.forEach(t => expect(typeof t).toBe('string'));
    });
  });

  describe('axe.utils.getFlattenedTree', () => {
    it('must be a function with the signature Element -> [vnode]', () => {
      expect(Array.isArray(axe.utils.getFlattenedTree(document.body))).toBe(
        true
      );
      expect(
        axe.utils.getFlattenedTree(randomNodeInTree(isElement))
      ).toHaveLength(1);
    });
  });

  describe('axe.utils.getNodeFromTree', () => {
    it('must be a function with the signature Node -> vnode', () => {
      axe._tree = axe.utils.getFlattenedTree(document.body);
      expect(flat(axe._tree[0])).toContain(
        axe.utils.getNodeFromTree(randomNodeInTree())
      );
    });
    it('must return null for nodes not in the axe._tree', () => {
      expect(axe.utils.getNodeFromTree(randomElement())).toBeNull();
    });
  });

  describe('axe.commons.dom.isOpaque', () => {
    it('must be a function with the signature Element -> Boolean', () => {
      expect(typeof axe.commons.dom.isOpaque(randomNodeInTree(isElement))).toBe(
        'boolean'
      );
    });
  });

  describe('axe.commons.text.accessibleTextVirtual', () => {
    it('must be a function with the signature Element vnode -> String', () => {
      axe._tree = axe.utils.getFlattenedTree(document.body);
      const vnode = axe.utils.getNodeFromTree(randomNodeInTree(isElement));
      expect(typeof axe.commons.text.accessibleTextVirtual(vnode)).toBe(
        'string'
      );
    });
  });
});

const elements = [
  document.createElement('div'),
  document.createElement('button'),
  document.createElement('article')
];

const inTree = [];
const treeWalker = collectNodes();
let next = treeWalker.iterate().next();
while (!next.done) {
  if (next.value.nodeType === 1) {
    inTree.push(next.value);
  }
  next = treeWalker.iterate().next();
}

function isElement(el) {
  return el.nodeType === Node.ELEMENT_NODE;
}

function random(fromArr) {
  return function (filter) {
    filter = filter || isTrue;
    const arr = fromArr.filter(filter);
    const seed = Math.random();
    return arr[Math.floor(seed * arr.length)];
  };
}

function randomNodeInTree(filter) {
  return random(inTree)(filter);
}

function randomElement(filter) {
  return random(elements)(filter);
}

// mimic tree: body and all element and text children
function collectNodes() {
  const walker = document.createTreeWalker(
    document,
    NodeFilter.SHOW_ALL,
    function (node) {
      if (!document.body.contains(node)) {
        return NodeFilter.FILTER_SKIP;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
    false
  );
  const nextNode = () => {
    const value = walker.nextNode();
    return {
      value: value,
      done: !value
    };
  };
  walker.iterate = () => {
    return { next: nextNode };
  };
  return walker;
}

function flat(tree) {
  const result = [];
  const insert = function (node) {
    result.push(node);
    (node.children || []).forEach(insert);
  };
  if (tree) {
    insert(tree);
  }
  return result;
}

function isTrue() {
  return true;
}

function getEntries(obj) {
  const results = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      results.push([key, obj[key]]);
    }
  }
  return results;
}

function getValues(obj) {
  return getEntries(obj).map(function (entry) {
    return entry[1];
  });
}

function getKeys(obj) {
  return getEntries(obj).map(function (entry) {
    return entry[0];
  });
}
