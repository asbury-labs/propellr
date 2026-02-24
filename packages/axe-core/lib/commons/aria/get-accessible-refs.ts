import getRootNode from '../dom/get-root-node';
import cache from '../../core/base/cache';
import { tokenList } from '../../core/utils';
import standards from '../../standards';
import { sanitize } from '../text/';

const idRefsRegex = /^idrefs?$/;

/**
 * Cache all ID references of a node and its children
 */
function cacheIdRefs(
  node: Element,
  idRefs: Map<string, Element[]>,
  refAttrs: string[]
): void {
  if (node.hasAttribute) {
    if (node.nodeName.toUpperCase() === 'LABEL' && node.hasAttribute('for')) {
      const id = node.getAttribute('for')!;
      if (!idRefs.has(id)) {
        idRefs.set(id, [node]);
      } else {
        idRefs.get(id)!.push(node);
      }
    }

    for (let i = 0; i < refAttrs.length; ++i) {
      const attr = refAttrs[i]!;
      const attrValue = sanitize(node.getAttribute(attr) || '');
      if (!attrValue) {
        continue;
      }

      for (const token of tokenList(attrValue)) {
        if (!idRefs.has(token)) {
          idRefs.set(token, [node]);
        } else {
          idRefs.get(token)!.push(node);
        }
      }
    }
  }

  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];
    if (child && child.nodeType === 1) {
      cacheIdRefs(child as Element, idRefs, refAttrs);
    }
  }
}

/**
 * Return all DOM nodes that use the nodes ID in the accessibility tree.
 * @param {Element} node
 * @returns {Element[]}
 */
function getAccessibleRefs(node: any): Element[] {
  node = node.actualNode || node;
  let root: any = getRootNode(node);
  root = root.documentElement || root; // account for shadow roots

  const idRefsByRoot = cache.get(
    'idRefsByRoot',
    () => new Map<any, Map<string, Element[]>>()
  ) as Map<any, Map<string, Element[]>>;

  let idRefs = idRefsByRoot.get(root);
  if (!idRefs) {
    idRefs = new Map<string, Element[]>();
    idRefsByRoot.set(root, idRefs);

    const refAttrs = Object.keys(standards.ariaAttrs).filter(attr => {
      const attrInfo = standards.ariaAttrs[attr];
      if (!attrInfo) {return false;}
      return idRefsRegex.test(attrInfo.type);
    });
    cacheIdRefs(root, idRefs, refAttrs);
  }

  return idRefs.get(node.id) ?? [];
}

export default getAccessibleRefs;
