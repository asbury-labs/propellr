import toArray from './to-array';
import DqElement from './dq-element';
import AbstractVirtualNode from '../base/virtual-node/abstract-virtual-node';
import isNode from '../../commons/dom/is-node';

/**
 * Helper to denote which checks are asyncronous and provide callbacks and pass data back to the CheckResult
 * @param  {CheckResult}   checkResult The target object
 * @param  {Function} callback    The callback to expose when `this.async()` is called
 * @return {Object}               Bound to `this` for a check's fn
 */
function checkHelper(
  checkResult: Record<string, unknown>,
  _options: unknown,
  resolve: (result: Record<string, unknown>) => void,
  reject: (error: Error) => void
): Record<string, unknown> {
  return {
    isAsync: false,
    async() {
      (this as Record<string, unknown>).isAsync = true;
      return (result: unknown) => {
        if (result instanceof Error === false) {
          checkResult.result = result;
          resolve(checkResult);
        } else {
          reject(result as Error);
        }
      };
    },
    data(data: unknown) {
      checkResult.data = data;
    },
    relatedNodes(nodes: unknown) {
      if (isNode(nodes) || nodes instanceof AbstractVirtualNode) {
        nodes = [nodes];
      } else {
        nodes = toArray(nodes as ArrayLike<unknown>);
      }
      checkResult.relatedNodes = [];
      (nodes as unknown[]).forEach((node: unknown) => {
        if (node instanceof AbstractVirtualNode) {
          node = (node as AbstractVirtualNode & { actualNode?: Node })
            .actualNode;
        }
        if (isNode(node)) {
          const dqElm = new DqElement(node as Node);
          (checkResult.relatedNodes as unknown[]).push(dqElm);
        }
      });
    }
  };
}

export default checkHelper;
