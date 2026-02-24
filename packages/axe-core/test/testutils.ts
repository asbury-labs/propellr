import { expect, beforeEach, afterEach } from 'vitest';

// The global axe object is loaded by the test setup file
declare const axe: any;

// These were global vars in the old testutils.js — export them as module-level vars
export let checks: any;
export let commons: any;

const originalChecks = () => axe._audit.checks;
const originalAudit = () => axe._audit;
const originalRules = () => axe._audit.rules;
const originalCommons = () => axe.commons;

/**
 * Determine which checks are used only in the `none` array of rules
 */
function computeNoneChecks(): string[] {
  const noneChecks: string[] = [];

  function verifyIsNoneCheck(check: any): void {
    const id = check.id || check;
    const index = noneChecks.indexOf(id);
    if (index !== -1) {
      noneChecks.splice(index, 1);
    }
  }

  axe._audit.rules.forEach(function (rule: any) {
    rule.none.forEach(function (check: any) {
      const id = check.id || check;
      if (noneChecks.indexOf(id) === -1) {
        noneChecks.push(id);
      }
    });
  });

  axe._audit.rules.forEach(function (rule: any) {
    rule.any.forEach(verifyIsNoneCheck);
    rule.all.forEach(verifyIsNoneCheck);
  });

  return noneChecks;
}

/**
 * Create a check context for mocking/resetting data and relatedNodes in tests
 */
export function MockCheckContext(): any {
  return {
    _relatedNodes: [] as any[],
    _data: null as any,
    // When using this.async() in a check, assign a function to _onAsync
    // to catch the response.
    _onAsync: null as ((result: any, self: any) => void) | null,
    async: function () {
      const self = this;
      return function (result: any) {
        // throws if _onAsync isn't set
        self._onAsync!(result, self);
      };
    },
    data: function (d: any) {
      this._data = d;
    },
    relatedNodes: function (nodes: any) {
      this._relatedNodes = Array.isArray(nodes) ? nodes : [nodes];
    },
    reset: function () {
      this._data = null;
      this._relatedNodes = [];
      this._onAsync = null;
    }
  };
}

/**
 * Return the fixture element
 */
export function getFixture(): HTMLElement {
  let fixture = document.getElementById('fixture');
  if (!fixture) {
    fixture = document.createElement('div');
    fixture.setAttribute('id', 'fixture');
    document.body.insertBefore(fixture, document.body.firstChild);
  }
  return fixture;
}

/**
 * Method for injecting content into a fixture.
 *
 * NOTE: This function sets element content using innerHTML which is safe here
 * because test utilities only receive trusted test fixture markup, never
 * user-supplied input.
 *
 * @param content Stuff to go into the fixture (html or DOM node)
 */
export function injectIntoFixture(
  content?: string | Node | Node[]
): HTMLElement {
  const fixture = getFixture();
  if (typeof content !== 'undefined') {
    fixture.textContent = '';
  }

  if (typeof content === 'string') {
    // Safe: content is always trusted test fixture markup, not user input
    fixture.innerHTML = content; // eslint-disable-line no-unsanitized/property
  } else if (content instanceof Node) {
    fixture.appendChild(content);
  } else if (Array.isArray(content)) {
    content.forEach(function (node: Node) {
      fixture.appendChild(node);
    });
  }

  return fixture;
}

/**
 * Method for injecting content into a fixture and caching
 * the flattened DOM tree (light and Shadow DOM together)
 *
 * @param content Stuff to go into the fixture (html or DOM node)
 */
export function fixtureSetup(content?: string | Node | Node[]): any {
  const fixture = injectIntoFixture(content);
  axe.teardown();
  return axe.setup(fixture);
}

/**
 * Create check arguments
 *
 * @param content Stuff to go into the fixture (html or node)
 * @param options Options argument for the check (optional, default: {})
 * @param target Target for the check, CSS selector (default: '#target')
 */
export function checkSetup(
  content: string | Node,
  options?: any,
  target?: string | Node | any
): [HTMLElement, any, any] {
  // Normalize the params
  if (typeof options !== 'object') {
    target = options;
    options = {};
  }
  // Normalize target, allow it to be the inserted node or '#target'
  target = target || (content instanceof Node ? content : '#target');
  const rootNode = fixtureSetup(content);

  let node: any;
  if (typeof target === 'string') {
    node = axe.utils.querySelectorAll(rootNode, target)[0];
  } else if (target instanceof Node) {
    node = axe.utils.getNodeFromTree(target);
  } else {
    node = target;
  }
  return [node.actualNode, options, node];
}

/**
 * Create a shadow DOM tree on #shadow and setup axe for it, returning #target
 *
 * @param content Stuff to go into the fixture (html string or DOM Node)
 * @param shadowContent Stuff to go into the shadow boundary (html or node)
 * @param targetSelector Target selector for the check (optional, default: '#target')
 */
export function queryShadowFixture(
  content: string | Node,
  shadowContent: string | Node,
  targetSelector?: string
): any {
  // Normalize target, allow it to be the provided string or use '#target' to query composed tree
  if (typeof targetSelector !== 'string') {
    targetSelector = '#target';
  }

  const fixtureNode = injectIntoFixture(content as string);
  let targetCandidate: Element | null =
    fixtureNode.querySelector(targetSelector);
  let container: any = targetCandidate;
  if (!targetCandidate) {
    // check if content specifies a shadow container
    container = fixtureNode.querySelector('#shadow');
    if (!container) {
      container = fixtureNode.firstChild;
    }
  }
  // attach a shadowRoot with the content provided
  const shadowRoot = container.attachShadow({ mode: 'open' });
  if (typeof shadowContent === 'string') {
    // Safe: shadowContent is trusted test fixture markup
    shadowRoot.innerHTML = shadowContent; // eslint-disable-line no-unsanitized/property
  } else if (shadowContent instanceof Node) {
    shadowRoot.appendChild(shadowContent);
  }

  if (!targetCandidate) {
    targetCandidate = shadowRoot.querySelector(targetSelector);
  }
  if (!targetSelector && !targetCandidate) {
    throw new Error(
      'shadowCheckSetup requires at least one fragment to have #target, or a provided targetSelector'
    );
  }

  // query the composed tree AFTER shadowDOM has been attached
  const vFixture = axe.setup(fixtureNode);
  return axe.utils.getNodeFromTree(targetCandidate) || vFixture;
}

/**
 * Create check arguments with Shadow DOM. Target can be inside or outside of Shadow DOM, queried by
 * adding `id="target"` to a fragment. Or specify a custom selector as the `targetSelector` argument.
 *
 * @param content Stuff to go into the fixture (html string or DOM Node)
 * @param shadowContent Stuff to go into the shadow boundary (html or node)
 * @param options Options argument for the check (optional, default: {})
 * @param targetSelector Target selector for the check (optional, default: '#target')
 */
export function shadowCheckSetup(
  content: string | Node,
  shadowContent: string | Node,
  options?: any,
  targetSelector?: string
): [HTMLElement, any, any] {
  // Normalize the object params
  if (typeof options !== 'object') {
    options = {};
  }
  const node = queryShadowFixture(content, shadowContent, targetSelector);
  return [node.actualNode, options, node];
}

/**
 * Setup axe._tree flat tree
 * @param content Stuff to go in the flat tree
 */
export function flatTreeSetup(content: Node): any[] {
  axe._tree = axe.utils.getFlattenedTree(content);
  return axe._tree;
}

/**
 * Wait for all nested frames to be loaded
 *
 * @param win Window to wait for (optional)
 * @param cb Callback, called once resolved
 * @param errCb Callback, called once rejected
 */
export function awaitNestedLoad(
  win: Window | ((...args: any[]) => void),
  cb?: (...args: any[]) => void,
  errCb?: (...args: any[]) => void
): void {
  if (typeof win === 'function') {
    errCb = cb;
    cb = win;
    win = window;
  }
  const doc = (win as Window).document;
  const q = axe.utils.queue();

  // Wait for page load
  q.defer(function (resolve: () => void) {
    if (doc.readyState === 'complete') {
      resolve();
    } else {
      (win as Window).addEventListener('load', resolve);
    }
  });

  // Wait for all frames to be loaded
  Array.from(doc.querySelectorAll('iframe')).forEach(function (frame: any) {
    q.defer(function (resolve: () => void) {
      return awaitNestedLoad(frame.contentWindow, resolve);
    });
  });

  // Complete (don't pass the args on to the callback)
  q.then(function () {
    cb!();
  });

  if (errCb) {
    q.catch(errCb);
  }
}

/**
 * Add a given stylesheet dynamically to the document
 *
 * @param data composite object containing properties to create stylesheet
 * @param rootNode document/fragment to which to append style
 * @returns axe.utils.queue
 */
export function addStyleSheet(
  data: {
    href?: string;
    mediaPrint?: boolean;
    text?: string;
    id?: string;
  },
  rootNode?: Document
): any {
  const doc = rootNode ? rootNode : document;
  const q = axe.utils.queue();
  if (data.href) {
    q.defer(function (resolve: () => void, reject: () => void) {
      const link = doc.createElement('link');
      link.rel = 'stylesheet';
      link.href = data.href!;
      if (data.id) {
        link.id = data.id;
      }
      if (data.mediaPrint) {
        link.media = 'print';
      }
      link.onload = function onload() {
        setTimeout(function onload() {
          resolve();
        });
      };
      link.onerror = function onerror() {
        reject();
      };
      doc.head.appendChild(link);
    });
  } else {
    q.defer(function (resolve: () => void, reject: (err: Error) => void) {
      const style = doc.createElement('style');
      if (data.id) {
        style.id = data.id;
      }
      style.type = 'text/css';
      style.appendChild(doc.createTextNode(data.text || ''));
      doc.head.appendChild(style);
      // In Firefox, there is a delay between adding the element and it appearing in
      // document.styleSheets, so we poll until we see it there.
      const timeoutAt = Date.now() + 500;
      const interval = setInterval(function () {
        const isLoaded = Array.from(doc.styleSheets).some(
          (sheet: any) => sheet.ownerNode === style
        );
        if (isLoaded) {
          clearInterval(interval);
          resolve();
        } else if (Date.now() > timeoutAt) {
          clearInterval(interval);
          reject(
            new Error(
              'Added <style> element was not reflected in doc.styleSheets within timeout'
            )
          );
        }
      }, 5);
    });
  }
  return q;
}

/**
 * Add a list of stylesheets
 *
 * @param sheets array of sheets data object
 * @param rootNode document/fragment to which to append style
 * @returns axe.utils.queue
 */
export function addStyleSheets(
  sheets: Array<{
    href?: string;
    mediaPrint?: boolean;
    text?: string;
    id?: string;
  }>,
  rootNode?: Document
): any {
  const q = axe.utils.queue();
  sheets.forEach(function (data) {
    q.defer(addStyleSheet(data, rootNode));
  });
  return q;
}

/**
 * Remove a list of stylesheets from the document
 * @param sheets array of sheets data object
 * @returns axe.utils.queue
 */
export function removeStyleSheets(sheets: Array<{ id: string }>): any {
  const q = axe.utils.queue();
  sheets.forEach(function (data) {
    q.defer(function (resolve: () => void, reject: () => void) {
      const node = document.getElementById(data.id);
      if (!node || !node.parentNode) {
        reject();
      }
      node!.parentNode!.removeChild(node!);
      resolve();
    });
  });
  return q;
}

/**
 * Assert a given stylesheet against selectorText and cssText.
 *
 * NOTE: This function uses innerHTML to create a temporary style element for
 * CSS comparison. This is safe because cssText is trusted test data, not user input.
 *
 * @param sheet CSS Stylesheet
 * @param selectorText CSS Selector
 * @param cssText CSS Values
 * @param includes flag to check if existence of selectorText within cssText
 */
export function assertStylesheet(
  sheet: any,
  selectorText: string,
  cssText: string,
  includes?: boolean
): void {
  expect(sheet).toBeDefined();
  expect(sheet).toHaveProperty('cssRules');
  if (includes) {
    expect(cssText.includes(selectorText)).toBe(true);
  } else {
    expect(sheet.cssRules[0].selectorText).toBe(selectorText);

    // compare the selector properties
    const styleEl = document.createElement('style');
    styleEl.type = 'text/css';
    // Safe: cssText is trusted test data, not user input
    styleEl.textContent = cssText;
    document.body.appendChild(styleEl);

    const testSheet = document.styleSheets[document.styleSheets.length - 1];
    const sheetRule = sheet.cssRules[0];
    const testRule = (testSheet as CSSStyleSheet).cssRules[0] as CSSStyleRule;

    try {
      for (let i = 0; i < testRule.style.length; i++) {
        const property = testRule.style[i];
        expect(
          (sheetRule as CSSStyleRule).style.getPropertyValue(property)
        ).toBe(testRule.style.getPropertyValue(property));
      }
    } finally {
      styleEl.parentNode!.removeChild(styleEl);
    }
  }
}

/**
 * Injecting content into a fixture and return queried element within fixture
 *
 * @param html content to go into the fixture (html or DOM node)
 * @param query the CSS selector query to find target DOM node
 */
export function queryFixture(htmlContent: string, query?: string): any {
  query = query || '#target';
  const rootNode = fixtureSetup(htmlContent);
  const vNode = axe.utils.querySelectorAll(rootNode, query)[0];
  expect(
    vNode,
    'Node does not exist in query `' +
      query +
      '`. This is usually fixed by adding the default target (`id="target"`) to your html parameter. If you do not intend on querying the fixture for #target, consider using `axe.testUtils.fixtureSetup()` instead.'
  ).toBeDefined();
  return vNode;
}

/**
 * Return the checks evaluate method and apply default options
 * @param checkId ID of the check
 * @param testOptions Options for the test
 */
export function getCheckEvaluate(checkId: string, testOptions?: any): any {
  const check = checks[checkId];
  testOptions = testOptions || {};

  const noneChecks = computeNoneChecks();

  /**
   * Wraps a check for evaluation using .call()
   * @param node
   * @param options
   * @param virtualNode
   * @param context
   */
  const evaluateWrapper = function (
    this: any,
    node: HTMLElement,
    options: any,
    virtualNode: any,
    context: any
  ): any {
    const opts = check.getOptions(options);

    const result = check.evaluate.call(this, node, opts, virtualNode, context);

    // ensure that every result has a corresponding message
    if (testOptions.verifyMessage !== false) {
      const messages = axe._audit.data.checks[checkId].messages;
      const messageKey = this._data && this._data.messageKey;

      // see how the check is used to know where to find the message
      // e.g. a check used only in the `none` array of a rule will look at
      // the messageKey of a passing result in the `fail` messages
      let keyResult = result;
      const isNoneCheck = noneChecks.indexOf(checkId) !== -1;
      if (isNoneCheck) {
        keyResult = result === true ? false : result === false ? true : result;
      }

      const key =
        keyResult === true
          ? 'pass'
          : keyResult === false
            ? 'fail'
            : 'incomplete';
      const noneCheckMessage = isNoneCheck
        ? '. Note that since this check is only used in the "none" array of all rules, the messages use the inverse of the result (e.g. a result of false uses the "pass" messages)'
        : '';

      expect(
        messages[key],
        'Missing "' +
          key +
          '" message for check result of ' +
          result +
          noneCheckMessage
      ).toBeDefined();
      if (messageKey) {
        expect(
          messages[key][messageKey],
          'Missing ' +
            key +
            ' message key "' +
            messageKey +
            '" for check result of ' +
            result +
            noneCheckMessage
        ).toBeDefined();

        const message = axe.utils.processMessage(
          messages[key][messageKey],
          this._data
        );
        expect(
          message.indexOf('${') === -1,
          'Data object missing properties for ' +
            key +
            ' message key "' +
            messageKey +
            '": "' +
            message +
            '"'
        ).toBe(true);
      } else {
        const message = axe.utils.processMessage(messages[key], this._data);
        expect(
          message.indexOf('${') === -1,
          'Data object missing properties for ' +
            key +
            ' message: "' +
            message +
            '"'
        ).toBe(true);
      }
    }

    return result;
  };
  return evaluateWrapper;
}

/**
 * Capture errors from a callback and pass them to an error handler
 */
export function captureError(
  cb: (...args: any[]) => void,
  errorHandler: (e: Error) => void
): (...args: any[]) => void {
  return function () {
    try {
      cb.apply(null, arguments as any);
    } catch (e) {
      errorHandler(e as Error);
    }
  };
}

/**
 * Recursively run axe.runPartial on a window and all its frames
 */
export function runPartialRecursive(
  context: any,
  options?: any,
  win?: Window
): any[] {
  options = options || {};
  win = win || window;
  const axeRef = (win as any).axe;
  const frameContexts = axeRef.utils.getFrameContexts(context);
  let promiseResults = [axeRef.runPartial(context, options)];

  frameContexts.forEach(function (c: any) {
    const frame = shadowQuerySelector(c.frameSelector, win!.document);
    const frameWin = (frame as HTMLIFrameElement).contentWindow!;
    const frameResults = runPartialRecursive(c.frameContext, options, frameWin);
    promiseResults = promiseResults.concat(frameResults);
  });
  return promiseResults;
}

/**
 * Query an element that may be inside a shadow DOM using an axe selector
 */
export function shadowQuerySelector(
  axeSelector: string | string[],
  doc?: Document | ShadowRoot
): Element | undefined {
  let elm: Element | undefined;
  let currentDoc: Document | ShadowRoot | undefined = doc || document;
  const selectorArray = Array.isArray(axeSelector)
    ? axeSelector
    : [axeSelector];
  selectorArray.forEach(function (selectorStr: string) {
    elm = currentDoc?.querySelector(selectorStr) as Element | undefined;
    currentDoc = elm ? (elm as any).shadowRoot : undefined;
  });
  return elm;
}

/**
 * Create a nested shadow DOM tree for testing
 */
export function createNestedShadowDom(
  fixtureNode: Element | ShadowRoot,
  ...htmlCodes: string[]
): Element | null {
  if (htmlCodes.length <= 1) {
    throw new Error(
      'createNestedShadowDom must contain at least two HTML snippets'
    );
  }
  let currentNode: Element | ShadowRoot = fixtureNode;
  let htmlCode: string | undefined;
  const codes = [...htmlCodes];
  while ((htmlCode = codes.shift())) {
    appendHtml(currentNode, htmlCode);
    if (codes.length) {
      const query = (currentNode as Element).querySelectorAll
        ? (currentNode as Element).querySelectorAll('#shadowHost, .shadowHost')
        : (currentNode as ShadowRoot).querySelectorAll(
            '#shadowHost, .shadowHost'
          );
      currentNode = query[query.length - 1];
      currentNode = (currentNode as Element).attachShadow({ mode: 'open' });
    }
  }
  return (currentNode as Element).querySelector
    ? (currentNode as Element).querySelector('#target')
    : (currentNode as ShadowRoot).querySelector('#target');
}

/**
 * Enables test code like html` <img /> ` to get code highlighting
 */
export function html(strings: TemplateStringsArray, ...values: any[]): string {
  return strings.reduce((total: string, string: string, i: number) => {
    return total + string + (values[i] ?? '');
  }, '');
}

function appendHtml(fixtureNode: Element | ShadowRoot, htmlCode: string): void {
  const tmp = document.createElement('div');
  // Safe: htmlCode is trusted test fixture markup, not user input
  tmp.innerHTML = htmlCode; // eslint-disable-line no-unsanitized/property
  // Append to avoid clobbering other shadow trees with innerHTML
  for (const child of Array.from(tmp.children)) {
    (fixtureNode as Element).appendChild(child.cloneNode(true));
  }
}

function isObject(obj: any): boolean {
  return obj && typeof obj === 'object' && !Array.isArray(obj);
}

function getType(obj: any): string {
  if (isObject(obj)) {
    return 'object';
  }
  if (Array.isArray(obj)) {
    return 'array';
  }
  if (obj === null) {
    return 'null';
  }
  return typeof obj;
}

/**
 * Deep-equal assertion for axe results, with support for ignoring specific paths
 */
export function assertResultsDeepEqual(
  expected: any,
  actual: any,
  ignoredPaths: string[] = [
    'timestamp',
    // testEnvironment is ignored by default because Chrome's UI animations for the
    // "an automated test is controlling this browser" notification can cause
    // inconsistencies in windowHeight for otherwise-identical scans.
    'testEnvironment'
  ],
  keyPath: string = 'result'
): void {
  const typeObj1 = getType(expected);
  const typeObj2 = getType(actual);

  axe.utils.assert(
    typeObj1 === typeObj2,
    `Expected type of ${keyPath} to equal ${typeObj1} but got ${typeObj2}`
  );

  if (typeObj1 === 'object') {
    const res1Keys = Object.keys(expected);
    const res2Keys = Object.keys(actual);

    axe.utils.assert(
      res1Keys.length === res2Keys.length &&
        res1Keys.every((key: string) => res2Keys.includes(key)),
      `Expected ${keyPath} to have keys "${JSON.stringify(res1Keys)}" but got "${JSON.stringify(res2Keys)}"`
    );

    for (const key of res1Keys) {
      if (ignoredPaths.includes(key)) {
        continue;
      }

      assertResultsDeepEqual(
        expected[key],
        actual[key],
        ignoredPaths,
        `${keyPath}.${key}`
      );
    }
  } else if (typeObj1 === 'array') {
    axe.utils.assert(
      expected.length === actual.length,
      `Expected ${keyPath} to have length of "${expected.length}" but got "${actual.length}"`
    );

    for (let i = 0; i < expected.length; i++) {
      assertResultsDeepEqual(
        expected[i],
        actual[i],
        ignoredPaths,
        `${keyPath}[${i}]`
      );
    }
  } else {
    axe.utils.assert(
      expected === actual,
      `Expected ${keyPath} to equal "${expected}" but got "${actual}"`
    );
  }
}

/**
 * Register beforeEach/afterEach hooks for test lifecycle management.
 * Call this function once in your test setup to restore axe state between tests.
 */
export function registerTestHooks(): void {
  // prevent setting read-only properties
  // @see https://github.com/dequelabs/axe-core/issues/3837
  if (typeof DOMRectReadOnly !== 'undefined') {
    const readonlyRect = new DOMRectReadOnly();
    const proto = Object.getPrototypeOf(readonlyRect);
    ['left', 'right', 'top', 'bottom'].forEach(prop => {
      Object.defineProperty(proto, prop, {
        set(_value: any) {
          throw new TypeError(`setting getter-only property "${prop}"`);
        }
      });
    });
  }

  beforeEach(() => {
    // reset from axe._load overriding
    checks = originalChecks();
    axe._audit = originalAudit();
    axe._audit.rules = originalRules();
    commons = axe.commons = originalCommons();
  });

  afterEach(() => {
    const fixture = document.getElementById('fixture');
    axe.teardown();
    if (fixture) {
      fixture.textContent = '';

      // remove all attributes from fixture (otherwise a leftover
      // style attribute would cause avoid-inline-spacing integration
      // test to fail with [#fixture] being included in the results)
      const attrs = fixture.attributes;
      for (let i = 0; i < attrs.length; i++) {
        const attrName = attrs[i].name;
        if (attrName !== 'id') {
          fixture.removeAttribute(attrs[i].name);
        }
      }
    }

    // reset html and body styles
    document.body.removeAttribute('style');
    document.documentElement.removeAttribute('style');
  });
}
