import cache from '../../base/cache';

export function setupGlobals(context: unknown): void {
  // if window or document are not defined and context was passed in
  // we can use it to configure them
  // NOTE: because our polyfills run first, the global window object
  // always exists but may not have things we expect
  const hasWindow = window && 'Node' in window && 'NodeList' in window;
  const hasDoc = typeof document !== 'undefined' && !!document;
  if (hasWindow && hasDoc) {
    return;
  }
  if (!context || !(context as Node).ownerDocument) {
    throw new Error(
      'Required "window" or "document" globals not defined and cannot be deduced from the context. ' +
        'Either set the globals before running or pass in a valid Element.'
    );
  }

  if (!hasDoc) {
    cache.set('globalDocumentSet', true);
    (globalThis as Record<string, unknown>).document = (
      context as Node
    ).ownerDocument;
  }

  if (!hasWindow) {
    cache.set('globalWindowSet', true);
    // Use globalThis.document here since the local `document` shim variable
    // may still be undefined after we set globalThis.document above
    (globalThis as Record<string, unknown>).window = (
      globalThis as Record<string, unknown>
    ).document
      ? ((globalThis as Record<string, unknown>).document as Document)
          .defaultView
      : undefined;
  }
}

export function resetGlobals(): void {
  if (cache.get('globalDocumentSet')) {
    cache.set('globalDocumentSet', false);
    (globalThis as Record<string, unknown>).document = null;
  }
  if (cache.get('globalWindowSet')) {
    cache.set('globalWindowSet', false);
    (globalThis as Record<string, unknown>).window = null;
  }
}
