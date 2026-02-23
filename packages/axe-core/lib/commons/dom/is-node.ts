/**
 * Determines if a value is a DOM Node.
 *
 * Uses `instanceof` when `window.Node` is available (browser).
 * Falls back to duck-typing for Node.js / jsdom environments
 * where the global `window.Node` constructor may not exist.
 *
 * @method isNode
 * @memberof axe.commons.dom
 * @instance
 * @param  {unknown} element
 * @return {boolean}
 */
function isNode(element: unknown): element is Node {
  if (typeof window !== 'undefined' && typeof window.Node === 'function') {
    return element instanceof window.Node;
  }
  // Duck-type: all DOM Nodes have numeric nodeType and string nodeName
  return (
    element !== null &&
    typeof element === 'object' &&
    typeof (element as Node).nodeType === 'number' &&
    typeof (element as Node).nodeName === 'string'
  );
}

export default isNode;
