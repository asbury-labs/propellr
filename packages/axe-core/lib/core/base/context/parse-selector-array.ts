import { createFrameContext } from './create-frame-context';
import { getNodeFromTree, shadowSelectAll } from '../../utils';
import isNode from '../../../commons/dom/is-node';

interface ContextLike {
  include: unknown[];
  exclude: unknown[];
  flatTree: unknown[];
  frames?: FrameContextLike[] | undefined;
  [key: string]: unknown;
}

interface FrameContextLike {
  node: unknown;
  include: unknown[];
  exclude: unknown[];
  [key: string]: unknown;
}

/**
 * Finds frames in context, converts selectors to Element references and pushes unique frames
 * @private
 * @param  {Context} context The instance of Context to operate on
 * @param  {String} type     The "type" of thing to parse, "include" or "exclude"
 * @return {Array}           Parsed array of matching elements
 */
export function parseSelectorArray(
  context: ContextLike,
  type: 'include' | 'exclude'
): unknown[] {
  const result: unknown[] = [];
  for (let i = 0, l = context[type].length; i < l; i++) {
    const item = context[type][i];
    // Handle nodes
    if (isNode(item)) {
      if (isNode((item as Document).documentElement)) {
        result.push(context.flatTree[0]);
      } else if (isNode((item as ShadowRoot).host)) {
        // Item is a shadow root. We only cache instances of `Element`,
        // not `DocumentFragment`, so instead of the shadow root itself,
        // we'll push all of its children to context.
        const children = Array.from((item as Element).children).map(
          (child: Element) => getNodeFromTree(child)
        );
        result.push(...children);
      } else {
        result.push(getNodeFromTree(item as Node));
      }

      // Handle Iframe selection
    } else if (item && (item as unknown[]).length) {
      if ((item as unknown[]).length > 1) {
        pushUniqueFrameSelector(context, type, item as unknown[]);
      } else {
        const nodeList = shadowSelectAll((item as string[])[0]!);
        result.push(
          ...nodeList.map((node: unknown) => getNodeFromTree(node as Node))
        );
      }
    }
  }

  // filter nulls
  return result.filter((r: unknown) => r);
}

/**
 * Unshift selectors of matching iframes
 * @private
 * @param  {Context} context 	  The context object to operate on and assign to
 * @param  {String} type          The "type" of context, 'include' or 'exclude'
 * @param  {Array} selectorArray  Array of CSS selectors, each element represents a frame;
 * where the last element is the actual node
 */
function pushUniqueFrameSelector(
  context: ContextLike,
  type: 'include' | 'exclude',
  selectorArray: unknown[]
): void {
  context.frames = context.frames || [];

  const frameSelector = selectorArray.shift() as string;
  const frames = shadowSelectAll(frameSelector);
  frames.forEach((frame: unknown) => {
    let frameContext = (context.frames as FrameContextLike[]).find(
      (result: FrameContextLike) => result.node === frame
    );
    if (!frameContext) {
      frameContext = createFrameContext(
        frame as Element,
        context as unknown as { focusable: boolean; page: boolean | undefined }
      ) as unknown as FrameContextLike;
      (context.frames as FrameContextLike[]).push(frameContext);
    }
    (frameContext[type] as unknown[]).push(selectorArray);
  });
}
