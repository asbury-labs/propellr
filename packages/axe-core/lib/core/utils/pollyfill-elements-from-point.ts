// Spelled incorrectly intentionally (backwards compatibility).
export function pollyfillElementsFromPoint(): (
  x: number,
  y: number
) => Element[] {
  if (document.elementsFromPoint)
    {return document.elementsFromPoint.bind(document) as (
      x: number,
      y: number
    ) => Element[];}
  if ((document as unknown as Record<string, unknown>).msElementsFromPoint)
    {return (
      document as unknown as Record<string, (x: number, y: number) => Element[]>
    ).msElementsFromPoint!.bind(document);}

  const usePointer = (function  usePointer() {
    const element = document.createElement('x');
    element.style.cssText = 'pointer-events:auto';
    return element.style.pointerEvents === 'auto';
  })();

  const cssProp = usePointer ? 'pointer-events' : 'visibility';
  const cssDisableVal = usePointer ? 'none' : 'hidden';

  const style = document.createElement('style');
  style.textContent = usePointer
    ? '* { pointer-events: all }'
    : '* { visibility: visible }';

  return function (x: number, y: number): Element[] {
    let current: Element | null;
    let i: number;
    let d: { value: string; priority: string };
    const elements: Element[] = [];
    const previousPointerEvents: { value: string; priority: string }[] = [];

    // startup
    document.head.appendChild(style);

    while (
      (current = document.elementFromPoint(x, y)) &&
      elements.indexOf(current) === -1
    ) {
      // push the element and its current style
      elements.push(current);

      previousPointerEvents.push({
        value: (current as HTMLElement).style.getPropertyValue(cssProp),
        priority: (current as HTMLElement).style.getPropertyPriority(cssProp)
      });

      // add "pointer-events: none", to get to the underlying element
      (current as HTMLElement).style.setProperty(
        cssProp,
        cssDisableVal,
        'important'
      );
    }

    // Due to negative index, documentElement could actually not be the last,
    // so we'll simply move it to the end
    if (elements.indexOf(document.documentElement) < elements.length - 1) {
      elements.splice(elements.indexOf(document.documentElement), 1);
      elements.push(document.documentElement);
    }

    // restore the previous pointer-events values
    for (
      i = previousPointerEvents.length;
      !!(d = previousPointerEvents[--i]!);
    ) {
      (elements[i] as HTMLElement).style.setProperty(
        cssProp,
        d.value ? d.value : '',
        d.priority
      );
    }

    // teardown;
    document.head.removeChild(style);

    return elements;
  };
}

if (
  typeof window !== 'undefined' &&
  typeof window.addEventListener === 'function'
) {
  document.elementsFromPoint = pollyfillElementsFromPoint();
}
