import isCurrentPageLink from './is-current-page-link';

/**
 * Returns a reference to the element matching the attr URL fragment value
 * @method getElementByReference
 * @memberof axe.commons.dom
 * @instance
 * @param {Element} node
 * @param {String} attr Attribute name (href)
 * @return {Element}
 */
function getElementByReference(node: Element, attr: string): Element | null {
  let fragment = node.getAttribute(attr);
  if (!fragment) {
    return null;
  }

  if (attr === 'href' && !isCurrentPageLink(node as HTMLAnchorElement)) {
    return null;
  }

  if (fragment.indexOf('#') !== -1) {
    fragment = decodeURIComponent(fragment.substr(fragment.indexOf('#') + 1));
  }

  const candidate: Element | null = document.getElementById(fragment);
  if (candidate) {
    return candidate;
  }

  const candidates = document.getElementsByName(fragment);
  if (candidates.length) {
    return candidates[0] ?? null;
  }
  return null;
}

export default getElementByReference;
