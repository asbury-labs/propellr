// SPDX-License-Identifier: MPL-2.0
// Selected rule/check semantics adapted from axe-core v4.13.0; new bounded DOM reader.
// No canonical runtime shell. Branch limits and source paths: PROVENANCE.md.
import type { BrowserAnalysis, BrowserScanInput, BrowserScanOutput } from "../analysis.js";
import type {
  Diagnostic,
  Evidence,
  Occurrence,
  OccurrenceId,
  RuleResult,
  Target,
} from "../contracts.js";
import { minimumSize, offsetDiameter } from "./geometry.js";

interface Fact {
  readonly node: Element;
  readonly target: Target;
  readonly rect: DOMRect;
  readonly style: CSSStyleDeclaration;
  readonly visible: boolean;
}
const diagnostic = (code: string, message: string, target?: Target): Diagnostic => ({
  code,
  message,
  ...(target ? { target } : {}),
});
const compact = (text: string) => text.replace(/\s+/g, " ").trim().slice(0, 160);
function parent(node: Element): Element | null {
  if (node.assignedSlot) return node.assignedSlot;
  if (node.parentElement) return node.parentElement;
  const root = node.getRootNode();
  return root.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? (root as ShadowRoot).host : null;
}
function composedContains(ancestor: Element, node: Element): boolean {
  for (let current: Element | null = node; current; current = parent(current))
    if (current === ancestor) return true;
  return false;
}
function selector(node: Element): string {
  const root = node.getRootNode();
  if (
    node.id &&
    "querySelectorAll" in root &&
    (root as Document | ShadowRoot).querySelectorAll(`#${CSS.escape(node.id)}`).length === 1
  )
    return `#${CSS.escape(node.id)}`;
  const pieces: string[] = [];
  let current: Element | null = node;
  while (current) {
    const name = current.localName;
    const siblings: Element[] = current.parentNode
      ? [...current.parentNode.children].filter((element) => element.localName === name)
      : [current];
    pieces.unshift(`${name}:nth-of-type(${siblings.indexOf(current) + 1})`);
    current = current.parentElement;
  }
  return pieces.join(" > ");
}
function visible(node: Element): boolean {
  for (let current: Element | null = node; current; current = parent(current)) {
    const style = current.ownerDocument.defaultView!.getComputedStyle(current);
    if (
      current.getAttribute("aria-hidden") === "true" ||
      current.hasAttribute("inert") ||
      style.display === "none" ||
      style.visibility !== "visible" ||
      style.contentVisibility === "hidden"
    )
      return false;
  }
  const frame = node.ownerDocument.defaultView?.frameElement;
  if (frame && !visible(frame)) return false;
  const modal = node.ownerDocument.querySelector("dialog:modal");
  if (modal && !composedContains(modal, node)) return false;
  return true;
}
function children(node: Element): readonly Node[] {
  if (node.localName === "slot") {
    const assigned = (node as HTMLSlotElement).assignedNodes({ flatten: true });
    if (assigned.length) return assigned;
  }
  return [...(node.shadowRoot ?? node).childNodes];
}
function text(
  node: Element,
  includeHidden = false,
  seen = new Set<Element>(),
): { value: string; unsupported: boolean } {
  if (seen.has(node)) return { value: "", unsupported: false };
  seen.add(node);
  if (!includeHidden && !visible(node)) return { value: "", unsupported: false };
  let unsupported = node.namespaceURI !== "http://www.w3.org/1999/xhtml";
  for (const pseudo of ["::before", "::after"]) {
    const content = node.ownerDocument.defaultView!.getComputedStyle(node, pseudo).content;
    if (content && !["none", "normal", '""'].includes(content)) unsupported = true;
  }
  const label = node.getAttribute("aria-label");
  if (label?.trim()) return { value: compact(label), unsupported };
  if (node.localName === "img")
    return { value: compact(node.getAttribute("alt") ?? ""), unsupported };
  let value = "";
  for (const child of children(node)) {
    if (child.nodeType === Node.TEXT_NODE) value += child.textContent ?? "";
    else if (child.nodeType === Node.ELEMENT_NODE) {
      const element = child as Element;
      if (
        element.hasAttribute("aria-labelledby") ||
        ["input", "select", "textarea"].includes(element.localName)
      )
        unsupported = true;
      const result = text(element, includeHidden, seen);
      value += result.value;
      unsupported ||= result.unsupported;
    }
  }
  return { value: compact(value), unsupported };
}
function name(node: Element): { value: string; source: string; unsupported: boolean } {
  const refs = node.getAttribute("aria-labelledby")?.trim().split(/\s+/) ?? [];
  const root = node.getRootNode() as Document | ShadowRoot;
  const labels = refs.map((id) => root.getElementById(id)).filter((label) => label !== null);
  const candidates: { value: string; source: string; unsupported: boolean }[] = [];
  if (labels.length) {
    const values = labels.map((label) => text(label, true));
    candidates.push({
      value: compact(values.map((result) => result.value).join(" ")),
      source: "aria-labelledby",
      unsupported: values.some((result) => result.unsupported),
    });
  }
  candidates.push({
    value: compact(node.getAttribute("aria-label") ?? ""),
    source: "aria-label",
    unsupported: false,
  });
  if (node.localName === "button") {
    const values = [...((node as HTMLButtonElement).labels ?? [])].map((label) => text(label));
    candidates.push({
      value: compact(values.map((result) => result.value).join(" ")),
      source: "label",
      unsupported: values.some((result) => result.unsupported),
    });
  }
  candidates.push(
    { ...text(node), source: "contents" },
    { value: compact(node.getAttribute("title") ?? ""), source: "title", unsupported: false },
  );
  // button-name is an OR of naming checks, not a complete accessible-name API.
  return (
    candidates.find((candidate) => candidate.value && !candidate.unsupported) ??
    candidates.find((candidate) => candidate.unsupported) ?? {
      value: "",
      source: "none",
      unsupported: false,
    }
  );
}
function widget(node: Element): boolean {
  if (node.matches(":disabled")) return false;
  const native = node.matches(
    "button, a[href], input:not([type=hidden]), select, textarea, summary",
  );
  const role = node.getAttribute("role");
  if (!role || native) return native;
  return (
    [
      "button",
      "checkbox",
      "combobox",
      "gridcell",
      "link",
      "listbox",
      "menuitem",
      "menuitemcheckbox",
      "menuitemradio",
      "option",
      "radio",
      "scrollbar",
      "searchbox",
      "slider",
      "spinbutton",
      "switch",
      "tab",
      "textbox",
      "treeitem",
    ].includes(role) &&
    (native || node.hasAttribute("tabindex"))
  );
}
function supportedWidget(node: Element): boolean {
  return (
    (node.matches("button, a[href]") && !node.hasAttribute("role")) ||
    node.getAttribute("role") === "button"
  );
}

// Synchronous collection; transfer guards are released by finish(), never reused across scans.
export function createAnalysis(): BrowserAnalysis {
  let observers: MutationObserver[] = [];
  let stableChecks: (() => boolean)[] = [];
  let changed = false;
  const finish = () => {
    const stable =
      !changed &&
      !observers.some((observer) => observer.takeRecords().length > 0) &&
      stableChecks.every((check) => check());
    for (const observer of observers) observer.disconnect();
    observers = [];
    stableChecks = [];
    return stable;
  };
  function scan(input: BrowserScanInput): BrowserScanOutput {
    finish();
    changed = false;
    const facts: Fact[] = [];
    const documents: { target: Target; document: Document }[] = [];
    const gaps: Diagnostic[] = [];
    let shadowModal: Diagnostic | undefined;
    const seen = new Set<Element>();
    const watch = (root: Document | ShadowRoot) => {
      const focused = root.activeElement;
      stableChecks.push(() => root.activeElement === focused);
      if (root.nodeType === Node.DOCUMENT_NODE) {
        const view = (root as Document).defaultView!;
        const viewportState = () => {
          const visual = view.visualViewport;
          return [
            view.innerWidth,
            view.innerHeight,
            view.devicePixelRatio,
            view.scrollX,
            view.scrollY,
            visual?.width,
            visual?.height,
            visual?.offsetLeft,
            visual?.offsetTop,
            visual?.scale,
          ].join(":");
        };
        const initial = viewportState();
        stableChecks.push(() => viewportState() === initial);
      }
      const observer = new MutationObserver(() => {
        changed = true;
      });
      observer.observe(root, {
        subtree: true,
        childList: true,
        attributes: true,
        characterData: true,
      });
      observers.push(observer);
    };
    const gap = (code: string, message: string, target?: Target) => {
      if (gaps.length < 32) gaps.push(diagnostic(code, message, target));
    };
    function walk(node: Element, path: Target["path"]): void {
      if (seen.has(node)) return;
      if (facts.length >= 2000 || path.length >= 32) {
        gap("reader-limit", "Node or boundary depth budget exceeded");
        return;
      }
      seen.add(node);
      const nodeSelector = selector(node);
      if (
        nodeSelector.length + path.reduce((size, step) => size + step.selector.length, 0) >
        1024
      ) {
        gap("identity-limit", "Target path exceeds bounded evidence identity size");
        return;
      }
      const target = {
        ...input.target,
        path: [...path, { kind: "element" as const, selector: nodeSelector }],
      };
      const { scrollLeft, scrollTop, shadowRoot } = node;
      stableChecks.push(
        () =>
          node.scrollLeft === scrollLeft &&
          node.scrollTop === scrollTop &&
          node.shadowRoot === shadowRoot,
      );
      const style = node.ownerDocument.defaultView!.getComputedStyle(node);
      facts.push({
        node,
        target,
        style,
        rect: node.getBoundingClientRect(),
        visible: visible(node),
      });
      if ((node.localName === "iframe" || node.localName === "frame") && visible(node)) {
        const frameTarget = {
          ...input.target,
          path: [...path, { kind: "frame" as const, selector: selector(node) }],
        };
        try {
          const doc = (node as HTMLIFrameElement).contentDocument;
          if (!doc?.documentElement) throw new Error("unavailable");
          watch(doc);
          documents.push({
            target: {
              ...frameTarget,
              path: [...frameTarget.path, { kind: "element", selector: "html" }],
            },
            document: doc,
          });
          walk(doc.documentElement, frameTarget.path);
        } catch {
          gap(
            "frame-unavailable",
            "Frame is inaccessible; no injection or access is claimed",
            frameTarget,
          );
        }
      }
      if (node.shadowRoot) {
        if (node.shadowRoot.querySelector("dialog:modal")) {
          shadowModal = diagnostic(
            "shadow-modal-unavailable",
            "Modal dialog rooted inside shadow DOM is outside this slice",
            target,
          );
          gap(shadowModal.code, shadowModal.message, target);
        }
        watch(node.shadowRoot);
        const next = [...path, { kind: "shadow" as const, selector: selector(node) }];
        for (const child of node.shadowRoot.children) walk(child, next);
      } else if (node.localName === "slot" && (node as HTMLSlotElement).assignedElements().length) {
        // Assigned nodes retain their light-DOM identity; composed visibility uses assignedSlot.
        for (const child of (node as HTMLSlotElement).assignedElements({ flatten: true }))
          walk(child, path.slice(0, -1));
      } else for (const child of node.children) walk(child, path);
    }
    watch(document);
    documents.push({
      target: { ...input.target, path: [{ kind: "element", selector: "html" }] },
      document,
    });
    walk(document.documentElement, []);
    const widgets = facts.filter(
      (fact) => fact.visible && widget(fact.node) && fact.rect.width > 0 && fact.rect.height > 0,
    );
    let count = 0;
    function occurrence(
      fact: Pick<Fact, "target">,
      rule: string,
      outcome: Occurrence["outcome"],
      evidence: Evidence,
      reason?: string,
    ): Occurrence {
      const base = {
        id: `${rule}:${++count}` as OccurrenceId,
        target: fact.target,
        impact:
          outcome === "pass"
            ? null
            : rule === "button-name"
              ? ("critical" as const)
              : rule === "target-size"
                ? ("serious" as const)
                : ("moderate" as const),
        evidence: [evidence],
      };
      if (outcome === "incomplete") {
        const issue = diagnostic(
          "unsupported-evidence",
          reason ?? "Selected branch is not implemented",
          fact.target,
        );
        gap(issue.code, issue.message, fact.target);
        return { ...base, outcome, reason: issue };
      }
      return { ...base, outcome };
    }
    const rules: RuleResult[] = input.rules.map(({ rule, options }) => {
      if (shadowModal) return { rule, state: "not-evaluated", reason: shadowModal };
      if (
        !["button-name", "target-size", "landmark-one-main"].includes(rule.id) ||
        Object.keys(options).length
      ) {
        const reason = diagnostic(
          "rule-unavailable",
          "Rule or non-default options not implemented",
        );
        gap(reason.code, `${rule.id}: ${reason.message}`);
        return { rule, state: "not-evaluated", reason };
      }
      const occurrences: Occurrence[] = [];
      let limited = false;
      const available = () => {
        if (count < 96) return true;
        limited = true;
        gap("occurrence-limit", "Scan occurrence budget exceeded");
        return false;
      };
      const add = (make: () => Occurrence) => {
        if (available()) occurrences.push(make());
      };
      if (rule.id === "button-name")
        for (const fact of facts.filter(
          (fact) => fact.visible && fact.node.localName === "button",
        )) {
          if (!available()) break;
          const named = name(fact.node);
          const role = fact.node.getAttribute("role");
          const unsupported = named.unsupported || (role !== null && role !== "button");
          add(() =>
            occurrence(
              fact,
              rule.id,
              unsupported ? "incomplete" : named.value ? "pass" : "violation",
              {
                kind: "name",
                observed: { hasName: Boolean(named.value), source: named.source },
                expected: { hasName: true },
                explanation:
                  "Discernible text from supported naming checks; name text not retained",
              },
              "Complex naming or explicit-role branch is unsupported",
            ),
          );
        }
      if (rule.id === "target-size") {
        const generatedDocuments = new Set<Document>();
        if (widgets.length && count < 96)
          for (const fact of facts) {
            if (!fact.visible) continue;
            const view = fact.node.ownerDocument.defaultView!;
            if (
              ["::before", "::after"].some((pseudo) => {
                const content = view.getComputedStyle(fact.node, pseudo).content;
                return content && content !== "none" && content !== "normal";
              })
            )
              generatedDocuments.add(fact.node.ownerDocument);
          }
        for (const fact of widgets) {
          // At most 96 target rows against the bounded facts, never all W² target pairs.
          if (!available()) break;
          const { node, rect, style } = fact;
          const peers = widgets.filter(
            (other) =>
              other.node !== node &&
              other.node.ownerDocument === node.ownerDocument &&
              !composedContains(node, other.node) &&
              !composedContains(other.node, node),
          );
          // Any unrelated overlapping box is uncertain, including non-widget overlays between samples.
          const overlaps = facts.some(
            (other) =>
              other.visible &&
              other.node.ownerDocument === node.ownerDocument &&
              !composedContains(node, other.node) &&
              !composedContains(other.node, node) &&
              rect.left < other.rect.right &&
              rect.right > other.rect.left &&
              rect.top < other.rect.bottom &&
              rect.bottom > other.rect.top,
          );
          const points = [
            [rect.left + 1, rect.top + 1],
            [rect.right - 1, rect.bottom - 1],
            [(rect.left + rect.right) / 2, (rect.top + rect.bottom) / 2],
          ];
          const root = node.getRootNode() as Document | ShadowRoot;
          const viewport = node.ownerDocument.defaultView!;
          const obscured = points.some(([x, y]) => {
            if (x! < 0 || y! < 0 || x! >= viewport.innerWidth || y! >= viewport.innerHeight)
              return true;
            const hit = root.elementFromPoint(x!, y!);
            return hit !== null && hit !== node && !node.contains(hit);
          });
          const overflow =
            node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1;
          const complex =
            generatedDocuments.has(node.ownerDocument) ||
            !supportedWidget(node) ||
            style.transform !== "none" ||
            style.display === "inline" ||
            node.getClientRects().length !== 1 ||
            overlaps ||
            obscured ||
            overflow ||
            style.clipPath !== "none";
          const nearest = Math.min(24, ...peers.map((other) => offsetDiameter(rect, other.rect)));
          const enough = minimumSize(rect) || nearest + 0.05 >= 24;
          const tabbable = (node as HTMLElement).tabIndex >= 0;
          const closeTabbable = peers.some(
            (other) =>
              (other.node as HTMLElement).tabIndex >= 0 &&
              offsetDiameter(rect, other.rect) + 0.05 < 24,
          );
          const outcome =
            complex || (!enough && (!tabbable || !closeTabbable))
              ? "incomplete"
              : enough
                ? "pass"
                : "violation";
          add(() =>
            occurrence(
              fact,
              rule.id,
              outcome,
              {
                kind: "geometry",
                observed: {
                  width: Math.round(rect.width * 10) / 10,
                  height: Math.round(rect.height * 10) / 10,
                  closestOffset: nearest,
                  neighbors: peers
                    .filter((other) => offsetDiameter(rect, other.rect) + 0.05 < 24)
                    .map((other) => other.target.path.map((step) => step.selector).join(" / ")),
                },
                expected: { minSize: 24, minOffset: 24 },
                explanation: "Single unobscured rectangle size or spacing exception; CSS pixels",
              },
              "Complex/obscured/overflowing geometry or non-tabbable evidence requires review",
            ),
          );
        }
      }
      if (rule.id === "landmark-one-main") {
        const mains = facts.filter(
          (fact) => fact.visible && fact.node.matches("main:not([role]), [role='main']"),
        );
        // Canonical passForModal uses its dialog heuristic, not only native :modal state.
        const modal = facts.some(
          (fact) =>
            fact.visible &&
            fact.rect.width > 0 &&
            fact.rect.height > 0 &&
            fact.node.matches("dialog, [role=dialog], [aria-modal=true]"),
        );
        const present = mains.length > 0 || modal;
        for (const doc of documents.filter((entry) => visible(entry.document.documentElement)))
          add(() =>
            occurrence(
              doc,
              rule.id,
              present
                ? "pass"
                : gaps.some(
                      (item) => item.code === "frame-unavailable" || item.code === "reader-limit",
                    )
                  ? "incomplete"
                  : "violation",
              {
                kind: "main-presence",
                observed: { present, modal },
                expected: { present: true },
                explanation:
                  "Main presence or canonical dialog exception across accessible documents; multiple mains do not fail this rule",
              },
              "Unavailable scope could contain a main landmark",
            ),
          );
      }
      const first = occurrences[0];
      return first
        ? { rule, state: "evaluated", occurrences: [first, ...occurrences.slice(1)] }
        : limited
          ? {
              rule,
              state: "not-evaluated",
              reason: diagnostic("occurrence-limit", "Occurrence budget prevented evaluation"),
            }
          : { rule, state: "inapplicable" };
    });
    if (new TextEncoder().encode(JSON.stringify({ rules, gaps })).byteLength > 131_072) {
      const reason = diagnostic(
        "evidence-limit",
        "Results exceed 128 KiB retention budget; no usable evaluation retained",
      );
      const fallback: BrowserScanOutput = {
        rules: input.rules.map(({ rule }) => ({ rule, state: "not-evaluated", reason })),
        gaps: [reason, ...gaps.slice(0, 31)],
      };
      // Even not-evaluated metadata can exceed the budget for a large explicit selection.
      return new TextEncoder().encode(JSON.stringify(fallback)).byteLength <= 131_072
        ? fallback
        : { rules: [], gaps: [reason] };
    }
    return { rules, gaps };
  }
  return { scan, finish };
}

const analysis = createAnalysis();
export const scan = analysis.scan;
export const finish = analysis.finish;
