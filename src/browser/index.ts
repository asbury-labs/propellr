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
import { composedContains, parent, visible, name } from "./naming.js";
import type { NamingBudget } from "./naming.js";
import { evaluateNamingRule, namingApplicability } from "./naming-rules.js";
import { implementedRules, namingRules } from "../analysis.js";
import { captureComponents } from "./components.js";

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
function widget(node: Element): boolean {
  if (node.localName === "area" || node.matches(":disabled")) return false;
  const native = node.matches(
    "button, a[href], input:not([type=hidden]), select, textarea, summary",
  );
  const role = node.getAttribute("role")?.toLowerCase();
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
    node.getAttribute("role")?.toLowerCase() === "button"
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
    let unreadScope = false;
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
      // Missing subtrees affect verdicts even when their diagnostic cannot be retained.
      if (code === "frame-unavailable" || code === "reader-limit" || code === "identity-limit")
        unreadScope = true;
      if (gaps.length < 32) gaps.push(diagnostic(code, message, target));
    };
    let exhausted = false;
    function walk(node: Element, path: Target["path"]): void {
      if (exhausted || seen.has(node)) return;
      if (seen.size >= 2000) {
        exhausted = true;
        gap("reader-limit", "Node traversal budget exceeded");
        return;
      }
      seen.add(node);
      if (path.length >= 32) {
        gap("reader-limit", "Boundary depth budget exceeded");
        return;
      }
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
      if (exhausted) return;
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
        for (const child of node.shadowRoot.children) {
          walk(child, next);
          if (exhausted) break;
        }
      } else if (node.localName === "slot" && (node as HTMLSlotElement).assignedNodes().length) {
        // Assigned nodes retain their light-DOM identity; composed visibility uses assignedSlot.
        for (const child of (node as HTMLSlotElement).assignedElements({ flatten: true })) {
          walk(child, path.slice(0, -1));
          if (exhausted) break;
        }
      } else
        for (const child of node.children) {
          walk(child, path);
          if (exhausted) break;
        }
    }
    watch(document);
    documents.push({
      target: { ...input.target, path: [{ kind: "element", selector: "html" }] },
      document,
    });
    walk(document.documentElement, []);
    const widgets = facts.filter((fact) => fact.visible && widget(fact.node));
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
            : ["button-name", "image-alt", "label"].includes(rule)
              ? ("critical" as const)
              : rule === "target-size" || rule === "link-name"
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
    const ambiguousRole = facts.find(
      (fact) => fact.visible && /\s/.test(fact.node.getAttribute("role") ?? ""),
    );
    const roleTokens = ambiguousRole
      ? diagnostic(
          "role-tokens-unavailable",
          "Whitespace/fallback role-token resolution is outside this slice",
          ambiguousRole.target,
        )
      : undefined;
    if (roleTokens) gap(roleTokens.code, roleTokens.message, roleTokens.target);
    const unavailableScope = shadowModal ?? roleTokens;
    const targetsByNode = new Map(facts.map(({ node, target }) => [node, target.path]));
    const namingBudget: NamingBudget = { nodes: 2000, characters: 16_384, exhausted: false };
    let namingLimitReported = false;
    // Shared occurrence budget must not depend on caller selection order.
    const orderedRules = input.rules.toSorted((a, b) => a.rule.id.localeCompare(b.rule.id));
    const rules: RuleResult[] = orderedRules.map(({ rule, options }) => {
      if (unavailableScope) return { rule, state: "not-evaluated", reason: unavailableScope };
      if (!implementedRules.some((id) => id === rule.id) || Object.keys(options).length) {
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
          const named = name(fact.node, namingBudget);
          if (namingBudget.exhausted && !namingLimitReported) {
            namingLimitReported = true;
            gap("naming-limit", "Naming node, text or depth budget exceeded", fact.target);
          }
          const role = fact.node.getAttribute("role");
          const unsupported =
            named.unsupported || (role !== null && role.toLowerCase() !== "button");
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
              namingBudget.exhausted
                ? "Naming traversal budget exceeded"
                : "Complex naming or explicit-role branch is unsupported",
            ),
          );
        }
      const namingRule = namingRules.find((id) => id === rule.id);
      if (namingRule)
        for (const fact of facts) {
          if (!fact.visible) continue;
          const applies = namingApplicability(fact.node, namingRule);
          if (applies === false) continue;
          if (!available()) break;
          const result = evaluateNamingRule(fact.node, namingRule, namingBudget, applies, (node) =>
            targetsByNode.get(node),
          );
          if (namingBudget.exhausted && !namingLimitReported) {
            namingLimitReported = true;
            gap("naming-limit", "Naming node, text or depth budget exceeded", fact.target);
          }
          add(() => ({
            ...occurrence(
              fact,
              rule.id,
              result.outcome,
              result.evidence,
              namingBudget.exhausted
                ? "Naming traversal budget exceeded"
                : "Complex naming or role evidence is unsupported",
            ),
            impact: result.impact,
          }));
        }
      if (rule.id === "target-size") {
        const generatedDocuments = new Set<Document>();
        if (widgets.length && count < 96)
          for (const fact of facts) {
            if (fact.style.display === "none" || fact.style.visibility !== "visible") continue;
            const view = fact.node.ownerDocument.defaultView!;
            if (
              ["::before", "::after"].some((pseudo) => {
                const content = view.getComputedStyle(fact.node, pseudo).content;
                return (
                  content &&
                  content !== "none" &&
                  content !== "normal" &&
                  !(fact.node.localName === "img" && content === "-moz-alt-content")
                );
              })
            )
              generatedDocuments.add(fact.node.ownerDocument);
          }
        const uncertainRectangle = ({ node, rect }: Fact) => {
          if (generatedDocuments.has(node.ownerDocument)) return true;
          // Visual occluders include aria-hidden/inert elements, unlike accessibility candidates.
          // Any unrelated overlapping box is uncertain, including strips between hit-test samples.
          const overlaps = facts.some(
            (other) =>
              other.style.visibility === "visible" &&
              other.rect.width > 0 &&
              other.rect.height > 0 &&
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
          return (
            overlaps ||
            points.some(([x, y]) => {
              if (x! < 0 || y! < 0 || x! >= viewport.innerWidth || y! >= viewport.innerHeight)
                return true;
              const hit = root.elementFromPoint(x!, y!);
              return hit !== null && hit !== node && !node.contains(hit);
            })
          );
        };
        const ancestorUncertainty = new Map<Element, boolean>();
        const uncertainAncestors = (node: Element): boolean => {
          const cached = ancestorUncertainty.get(node);
          if (cached !== undefined) return cached;
          const ancestor = parent(node);
          if (!ancestor) return false;
          const style = ancestor.ownerDocument.defaultView!.getComputedStyle(ancestor);
          let clipped = false;
          if (style.overflowX !== "visible" || style.overflowY !== "visible") {
            const rect = node.getBoundingClientRect();
            const box = ancestor.getBoundingClientRect();
            const left = box.left + ancestor.clientLeft;
            const top = box.top + ancestor.clientTop;
            clipped =
              (style.overflowX !== "visible" &&
                (rect.left < left || rect.right > left + ancestor.clientWidth)) ||
              (style.overflowY !== "visible" &&
                (rect.top < top || rect.bottom > top + ancestor.clientHeight));
          }
          const uncertain =
            style.transform !== "none" ||
            style.clipPath !== "none" ||
            clipped ||
            uncertainAncestors(ancestor);
          ancestorUncertainty.set(node, uncertain);
          return uncertain;
        };
        const frameUncertainty = new Map<Document, boolean>();
        const factsByNode = new Map(facts.map((fact) => [fact.node, fact]));
        const uncertainFrame = (doc: Document): boolean => {
          if (doc === document) return false; // Do not inspect ancestry outside the scan root.
          const frame = doc.defaultView?.frameElement;
          if (!frame) return false;
          const cached = frameUncertainty.get(doc);
          if (cached !== undefined) return cached;
          const fact = factsByNode.get(frame);
          const uncertain =
            !fact ||
            uncertainRectangle(fact) ||
            fact.style.transform !== "none" ||
            fact.style.clipPath !== "none" ||
            uncertainAncestors(frame) ||
            uncertainFrame(frame.ownerDocument);
          frameUncertainty.set(doc, uncertain);
          return uncertain;
        };
        for (const fact of widgets) {
          // At most 96 target rows against bounded facts; enclosing-frame proofs are memoized.
          if (!available()) break;
          const { node, rect, style } = fact;
          const peers = widgets.filter(
            (other) =>
              other.node !== node &&
              other.rect.width > 0 &&
              other.rect.height > 0 &&
              other.node.ownerDocument === node.ownerDocument &&
              !composedContains(node, other.node) &&
              !composedContains(other.node, node),
          );
          const overflow =
            node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1;
          const complex =
            rect.width <= 0 ||
            rect.height <= 0 ||
            generatedDocuments.has(node.ownerDocument) ||
            !supportedWidget(node) ||
            style.transform !== "none" ||
            style.display === "inline" ||
            node.getClientRects().length !== 1 ||
            uncertainRectangle(fact) ||
            uncertainAncestors(node) ||
            uncertainFrame(node.ownerDocument) ||
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
                    .map((other) =>
                      other.target.path.map(({ kind, selector }) => ({ kind, selector })),
                    ),
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
              present ? "pass" : unreadScope ? "incomplete" : "violation",
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
    const raw = (): BrowserScanOutput => {
      if (new TextEncoder().encode(JSON.stringify({ rules, gaps })).byteLength <= 131_072)
        return { rules, gaps };
      const reason = diagnostic(
        "evidence-limit",
        "Results exceed 128 KiB retention budget; no usable evaluation retained",
      );
      const fallback: BrowserScanOutput = {
        rules: orderedRules.map(({ rule }) => ({ rule, state: "not-evaluated", reason })),
        gaps: [reason, ...gaps.slice(0, 31)],
      };
      // Even not-evaluated metadata can exceed the budget for a large explicit selection.
      return new TextEncoder().encode(JSON.stringify(fallback)).byteLength <= 131_072
        ? fallback
        : { rules: [], gaps: [reason] };
    };
    const output = raw();
    if (!input.components) return output;
    // Enrichment reads the final raw results; it cannot add, drop or reorder findings.
    const violations = output.rules.flatMap((result) =>
      result.state === "evaluated"
        ? result.occurrences
            .filter((occurrence) => occurrence.outcome === "violation")
            .map((occurrence) => occurrence.target)
        : [],
    );
    return { ...output, components: captureComponents(facts, violations, unreadScope) };
  }
  return { scan, finish };
}

const analysis = createAnalysis();
export const scan = analysis.scan;
export const finish = analysis.finish;
