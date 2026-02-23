import {
  assert as utilsAssert,
  objectHasOwn,
  isArrayLike,
  isContextObject,
  isContextProp,
  isLabelledFramesSelector,
  isLabelledShadowDomSelector
} from '../../utils';
import isNode from '../../../commons/dom/is-node';

interface NormalizedContext {
  include: unknown[];
  exclude: unknown[];
}

interface ContextObject {
  include?: unknown;
  exclude?: unknown;
  fromFrames?: unknown;
  fromShadowDom?: unknown;
  [key: string]: unknown;
}

interface LabelledFramesSelector {
  fromFrames: unknown[];
  fromShadowDom?: unknown;
  [key: string]: unknown;
}

interface LabelledShadowDomSelector {
  fromShadowDom: unknown[];
  [key: string]: unknown;
}

/**
 * Normalize the input of "context" so that many different methods of input are accepted
 * @private
 * @param  {Mixed} contextSpec The configuration object passed to `Context`
 * @return {Object}            Normalized context spec to include both `include` and `exclude` arrays
 */
export function normalizeContext(contextSpec: unknown): NormalizedContext {
  if (isContextObject(contextSpec)) {
    // Assert include / exclude isn't mixed with fromFrames / fromShadowDom
    const msg =
      ' must be used inside include or exclude. It should not be on the same object.';
    assert(
      !objectHasOwn(contextSpec as ContextObject, 'fromFrames'),
      'fromFrames' + msg
    );
    assert(
      !objectHasOwn(contextSpec as ContextObject, 'fromShadowDom'),
      'fromShadowDom' + msg
    );
  } else if (isContextProp(contextSpec)) {
    // Wrap in include
    contextSpec = { include: contextSpec, exclude: [] };
  } else {
    // Spec is unknown
    return { include: [document], exclude: [] };
  }

  const include = normalizeContextList((contextSpec as ContextObject).include);
  if (include.length === 0) {
    include.push(document); // Include defaults to [document] if empty
  }
  const exclude = normalizeContextList((contextSpec as ContextObject).exclude);
  return { include, exclude };
}

function normalizeContextList(selectorList: unknown = []): unknown[] {
  const normalizedList: unknown[] = [];
  if (!isArrayLike(selectorList)) {
    selectorList = [selectorList];
  }
  // Use .length to handle jQuery-like objects
  for (let i = 0; i < (selectorList as unknown[]).length; i++) {
    const normalizedSelector = normalizeContextSelector(
      (selectorList as unknown[])[i]
    );
    if (normalizedSelector) {
      normalizedList.push(normalizedSelector);
    }
  }
  return normalizedList;
}

function normalizeContextSelector(selector: unknown): unknown {
  if (isNode(selector)) {
    return selector; // Nodes must not be wrapped in an array
  }
  if (typeof selector === 'string') {
    return [selector]; // Convert to frame selector
  }

  if (isLabelledFramesSelector(selector)) {
    assertLabelledFrameSelector(selector as LabelledFramesSelector);
    selector = (selector as LabelledFramesSelector).fromFrames;
  } else if (isLabelledShadowDomSelector(selector)) {
    selector = [selector];
  }
  return normalizeFrameSelectors(selector as unknown[]);
}

function normalizeFrameSelectors(
  frameSelectors: unknown
): unknown[] | undefined {
  if (!Array.isArray(frameSelectors)) {
    return; // Invalid. Skip this selector
  }
  const normalizedSelectors: unknown[] = [];
  for (let selector of frameSelectors) {
    if (isLabelledShadowDomSelector(selector)) {
      assertLabelledShadowDomSelector(selector as LabelledShadowDomSelector);
      selector = (selector as LabelledShadowDomSelector).fromShadowDom;
    }
    if (typeof selector !== 'string' && !isShadowSelector(selector)) {
      return; // Invalid. Skip this selector
    }
    normalizedSelectors.push(selector);
  }
  return normalizedSelectors;
}

function assertLabelledFrameSelector(selector: LabelledFramesSelector): void {
  assert(
    Array.isArray(selector.fromFrames),
    'fromFrames property must be an array'
  );
  assert(
    selector.fromFrames.every(
      (fromFrameSelector: unknown) =>
        !objectHasOwn(
          fromFrameSelector as Record<string, unknown>,
          'fromFrames'
        )
    ),
    'Invalid context; fromFrames selector must be appended, rather than nested'
  );
  assert(
    !objectHasOwn(selector, 'fromShadowDom'),
    'fromFrames and fromShadowDom cannot be used on the same object'
  );
}

function assertLabelledShadowDomSelector(
  selector: LabelledShadowDomSelector
): void {
  assert(
    Array.isArray(selector.fromShadowDom),
    'fromShadowDom property must be an array'
  );
  assert(
    selector.fromShadowDom.every(
      (fromShadowDomSelector: unknown) =>
        !objectHasOwn(
          fromShadowDomSelector as Record<string, unknown>,
          'fromFrames'
        )
    ),
    'shadow selector must be inside fromFrame instead'
  );
  assert(
    selector.fromShadowDom.every(
      (fromShadowDomSelector: unknown) =>
        !objectHasOwn(
          fromShadowDomSelector as Record<string, unknown>,
          'fromShadowDom'
        )
    ),
    'fromShadowDom selector must be appended, rather than nested'
  );
}

function isShadowSelector(selector: unknown): boolean {
  return (
    Array.isArray(selector) &&
    selector.every((str: unknown) => typeof str === 'string')
  );
}

// Wrapper to ensure the correct message
function assert(bool: unknown, str: string): void {
  utilsAssert(
    bool,
    `Invalid context; ${str}\nSee: https://github.com/dequelabs/axe-core/blob/master/doc/context.md`
  );
}
