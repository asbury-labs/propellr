import objectHasOwn from './object-has-own';
import isArrayLike from './is-array-like';
import isNode from '../../commons/dom/is-node';

export function isContextSpec(contextSpec: unknown): boolean {
  return isContextObject(contextSpec) || isContextProp(contextSpec);
}

export function isContextObject(contextSpec: unknown): boolean {
  return ['include', 'exclude'].some(
    prop =>
      objectHasOwn(contextSpec, prop) &&
      isContextProp((contextSpec as Record<string, unknown>)[prop])
  );
}

export function isContextProp(contextList: unknown): boolean {
  return (
    typeof contextList === 'string' ||
    isNode(contextList) ||
    isLabelledFramesSelector(contextList) ||
    isLabelledShadowDomSelector(contextList) ||
    isArrayLike(contextList)
  );
}

export function isLabelledFramesSelector(selector: unknown): boolean {
  return objectHasOwn(selector, 'fromFrames');
}

export function isLabelledShadowDomSelector(selector: unknown): boolean {
  return objectHasOwn(selector, 'fromShadowDom');
}
