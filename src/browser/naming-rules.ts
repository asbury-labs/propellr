// SPDX-License-Identifier: MPL-2.0
// Canonical ANY/NONE combinations, separate from bounded accessible-name precedence.
// Source pins/branches: specs/{naming-coverage,native-form-naming}-protocol.md, PROVENANCE.md.
import type { namingRules } from "../analysis.js";
import type { Evidence, Occurrence, Target } from "../contracts.js";
import {
  nameString,
  parent,
  takeNameBudget,
  text,
  visible,
  focusable,
  presentation,
} from "./naming.js";
import type { NamingBudget } from "./naming.js";

type NamingRule = (typeof namingRules)[number];
type Truth = boolean | null;
interface Check {
  id: string;
  result: Truth;
  related?: readonly Target["path"][];
}
const negate = (value: Truth): Truth => (value === null ? null : !value);
const truth = (value: ReturnType<typeof text>): Truth =>
  value.unsupported ? null : Boolean(value.value);
export function namingApplicability(node: Element, rule: NamingRule): Truth {
  if (rule === "link-name") return node.matches("a[href]");
  if (rule === "select-name") return node.localName === "select";
  if (rule === "input-button-name" || rule === "input-image-alt") {
    if (
      !node.matches(
        rule === "input-button-name"
          ? 'input[type="button"], input[type="submit"], input[type="reset"]'
          : 'input[type="image"]',
      )
    )
      return false;
    const role = node.getAttribute("role")?.toLowerCase();
    if (!role || ["button", "img", "none", "presentation"].includes(role)) return true;
    if (["gridcell", "separator"].includes(role)) return focusable(node);
    return null;
  }
  if (rule === "label")
    return (
      node.matches("input, textarea") &&
      !(
        node.localName === "input" &&
        ["hidden", "image", "button", "submit", "reset"].includes(
          node.getAttribute("type")?.toLowerCase() ?? "",
        )
      )
    );
  if (node.localName !== "img") return false;
  const role = node.getAttribute("role")?.toLowerCase();
  if (!role || ["img", "none", "presentation", "button"].includes(role)) return true;
  if (role === "separator") return focusable(node);
  return null;
}

export function evaluateNamingRule(
  node: Element,
  rule: NamingRule,
  budget: NamingBudget,
  applicable: Truth,
  targetPath: (node: Element) => Target["path"] | undefined,
) {
  const any: Check[] = [];
  const none: Check[] = [];
  const relationships = new Map<string, Target["path"][]>();
  let relationshipUnknown = false;
  const related = (id: string, nodes: readonly Element[]) => {
    const paths: Target["path"][] = [];
    for (const node of nodes) {
      const path = targetPath(node);
      if (path) paths.push(path);
      else relationshipUnknown = true;
    }
    relationships.set(id, paths);
  };
  const root = node.getRootNode() as Document | ShadowRoot;
  const attr = (key: string): Truth => {
    const value = nameString(node.getAttribute(key) ?? "", budget);
    return budget.exhausted ? null : Boolean(value);
  };
  const check = (id: string, run: () => Truth) => {
    if (any.some((check) => check.result === true)) return;
    const result = run();
    const paths = relationships.get(id);
    any.push({ id, result, ...(paths ? { related: paths } : {}) });
  };
  let refs: Truth | undefined;
  const references = (): Truth => {
    if (refs !== undefined) return refs;
    let value: Truth = false;
    const ids = node.getAttribute("aria-labelledby") ?? "";
    if (!takeNameBudget(budget, ids.length)) return (refs = null);
    const visited = new Set<Element>();
    for (const id of ids.trim().split(/\s+/)) {
      if (!id) continue;
      if (!takeNameBudget(budget)) break;
      const label = root.getElementById(id);
      if (!label || visited.has(label)) continue;
      visited.add(label);
      const named = truth(
        text(label, budget, !visible(label, budget), new Set(label === node ? [] : [node])),
      );
      if (named === null) value = null;
      else if (named && value !== null) value = true;
    }
    return (refs = budget.exhausted ? null : value);
  };
  let contents: Truth | undefined;
  const content = () => {
    if (contents === undefined) contents = truth(text(node, budget, false, new Set(), 0, true));
    return contents;
  };
  let labels: Element[] | undefined;
  const explicitLabels = () => {
    if (labels) return labels;
    labels = [];
    if (!node.id || !takeNameBudget(budget, node.id.length)) return labels;
    // Native query is root-local; retained results and text work remain bounded.
    for (const label of root.querySelectorAll(`label[for="${CSS.escape(node.id)}"]`)) {
      if (!takeNameBudget(budget)) break;
      labels.push(label);
    }
    return labels;
  };
  let implicit: Element | null | undefined;
  const implicitLabel = () => {
    if (implicit !== undefined) return implicit;
    for (let ancestor = parent(node); ancestor; ancestor = parent(ancestor)) {
      if (!takeNameBudget(budget)) break;
      if (ancestor.localName === "label") return (implicit = ancestor);
    }
    return (implicit = null);
  };
  const labelText = (label: Element) => truth(text(label, budget, false, new Set([node])));
  const someLabels = (values: Iterable<Element>): Truth => {
    let result: Truth = false;
    for (const label of values) {
      const value = labelText(label);
      if (value === true) return true;
      if (value === null) result = null;
      if (budget.exhausted) return null;
    }
    return result;
  };
  // This is ordered name precedence for NONE checks, not the ANY-check OR.
  const accessibleName = (): Truth => {
    const referenced = references();
    if (referenced !== false) return referenced;
    const aria = attr("aria-label");
    if (aria !== false) return aria;
    if (rule === "link-name") {
      const value = content();
      if (value !== false) return value;
    } else {
      const wrap = implicitLabel();
      const value = someLabels(wrap ? [...explicitLabels(), wrap] : explicitLabels());
      if (value !== false) return value;
    }
    const title = attr("title");
    return title !== false || rule !== "label" ? title : attr("placeholder");
  };
  const role = node.getAttribute("role")?.toLowerCase();
  const roleSupported =
    !role ||
    (rule === "image-alt"
      ? ["img", "none", "presentation", "button", "separator"]
      : rule === "link-name"
        ? ["link", "none", "presentation"]
        : rule === "select-name"
          ? ["combobox", "listbox", "none", "presentation"]
          : rule === "input-button-name" || rule === "input-image-alt"
            ? ["button", "img", "none", "presentation", "gridcell", "separator"]
            : ["textbox", "none", "presentation"]
    ).includes(role);
  if (applicable === null || !roleSupported || node.hasAttribute("aria-owns")) {
    any.push({ id: "unsupported-naming-branch", result: null });
  } else if (rule === "image-alt") {
    check("has-alt", () => node.hasAttribute("alt"));
    check("aria-label", () => attr("aria-label"));
    check("aria-labelledby", references);
    check("non-empty-title", () => attr("title"));
    check("presentational-role", () => presentation(node, budget));
    const alt = node.getAttribute("alt") ?? "";
    const bounded = takeNameBudget(budget, alt.length);
    // Empty alt is valid; whitespace-only alt is a separate prohibition.
    const spaces = bounded ? /^\s+$/.test(alt) : null;
    const presentational = presentation(node, budget);
    none.push({
      id: "alt-space-value",
      result:
        spaces === false || presentational === true
          ? false
          : presentational === null
            ? null
            : spaces,
    });
  } else if (rule === "link-name") {
    check("has-visible-text", content);
    check("aria-label", () => attr("aria-label"));
    check("aria-labelledby", references);
    check("non-empty-title", () => attr("title"));
    none.push({
      id: "focusable-no-name",
      result: (node as HTMLElement).tabIndex < 0 ? false : negate(accessibleName()),
    });
  } else {
    const input = rule === "input-button-name" || rule === "input-image-alt";
    if (rule === "input-button-name") {
      check(
        "non-empty-if-present",
        () =>
          ["submit", "reset"].includes(node.getAttribute("type")?.toLowerCase() ?? "") &&
          !node.hasAttribute("value"),
      );
      check("non-empty-value", () => attr("value"));
    } else if (rule === "input-image-alt") {
      check("non-empty-alt", () => attr("alt"));
    }
    if (input) {
      check("aria-label", () => attr("aria-label"));
      check("aria-labelledby", references);
      check("non-empty-title", () => attr("title"));
    }
    check("implicit-label", () => {
      const label = implicitLabel();
      if (label) related("implicit-label", [label]);
      return label ? labelText(label) : budget.exhausted ? null : false;
    });
    check("explicit-label", () => {
      let result: Truth = false;
      const labels = explicitLabels();
      if (node.id) related("explicit-label", labels);
      for (const label of labels) {
        // Canonical explicit-label defers CSS-hidden labels to its NONE check.
        for (let ancestor: Element | null = label; ancestor; ancestor = parent(ancestor)) {
          if (!takeNameBudget(budget)) return null;
          const style = ancestor.ownerDocument.defaultView!.getComputedStyle(ancestor);
          if (
            style.display === "none" ||
            style.visibility !== "visible" ||
            style.contentVisibility === "hidden"
          )
            return true;
        }
        const value = labelText(label);
        if (value === true) return true;
        if (value === null) result = null;
      }
      return budget.exhausted ? null : result;
    });
    if (!input) {
      check("aria-label", () => attr("aria-label"));
      check("aria-labelledby", references);
      check("non-empty-title", () => attr("title"));
    }
    if (rule === "label") check("non-empty-placeholder", () => attr("placeholder"));
    if (rule !== "input-image-alt") check("presentational-role", () => presentation(node, budget));
    if (!input) {
      const first = explicitLabels()[0];
      none.push({
        id: "hidden-explicit-label",
        result:
          first && !visible(first, budget)
            ? negate(accessibleName())
            : budget.exhausted
              ? null
              : false,
      });
    }
  }
  const failed =
    none.some((check) => check.result === true) || any.every((check) => check.result === false);
  const uncertain =
    budget.exhausted ||
    none.some((check) => check.result === null) ||
    !any.some((check) => check.result === true);
  const outcome: Occurrence["outcome"] =
    budget.exhausted || relationshipUnknown
      ? "incomplete"
      : failed
        ? "violation"
        : uncertain
          ? "incomplete"
          : "pass";
  const impact: Occurrence["impact"] =
    outcome === "pass" ? null : rule !== "link-name" ? "critical" : "serious";
  const evidence: Evidence = {
    kind: "naming-checks",
    observed: {
      any: any.map(({ id, result, related }) => ({
        id,
        result,
        ...(related
          ? {
              related: related.map((path) =>
                path.map(({ kind, selector }) => ({ kind, selector })),
              ),
            }
          : {}),
      })),
      none: none.map(({ id, result }) => ({ id, result })),
    },
    expected: { any: true, none: false },
    explanation: "Bounded canonical check combination; no name strings or control values retained",
  };
  return { outcome, impact, evidence };
}
