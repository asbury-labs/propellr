// SPDX-License-Identifier: MPL-2.0
// Bounded naming checks, not a complete accessible-name engine. See PROVENANCE.md.
const compact = (text: string) => text.replace(/\s+/g, " ").trim().slice(0, 160);
export function parent(node: Element): Element | null {
  if (node.assignedSlot) return node.assignedSlot;
  if (node.parentElement) return node.parentElement;
  const root = node.getRootNode();
  return root.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? (root as ShadowRoot).host : null;
}
export function composedContains(ancestor: Element, node: Element, budget?: NamingBudget): boolean {
  for (let current: Element | null = node; current; current = parent(current)) {
    if (budget && !takeNameBudget(budget)) return false;
    if (current === ancestor) return true;
  }
  return false;
}
export function visible(node: Element, budget?: NamingBudget): boolean {
  for (let current: Element | null = node; current; current = parent(current)) {
    if (budget && !takeNameBudget(budget)) return false;
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
  if (frame && !visible(frame, budget)) return false;
  const modal = node.ownerDocument.querySelector("dialog:modal");
  if (modal && !composedContains(modal, node, budget)) return false;
  return true;
}
export interface NamingBudget {
  nodes: number;
  characters: number;
  exhausted: boolean;
}
export function takeNameBudget(budget: NamingBudget, characters = 0): boolean {
  if (budget.exhausted || budget.nodes < 1 || characters > budget.characters) {
    budget.exhausted = true;
    return false;
  }
  budget.nodes--;
  budget.characters -= characters;
  return true;
}
export function nameString(value: string, budget: NamingBudget): string {
  return takeNameBudget(budget, value.length) ? compact(value) : "";
}
// Pinned canonical focusability for this native naming slice, not a browser tab-order API.
export function focusable(node: Element): boolean {
  return (
    !node.matches(":disabled") &&
    (node.matches("a[href], input, textarea, select") ||
      /^\s*[+-]?\d/.test(node.getAttribute("tabindex") ?? ""))
  );
}
export function presentation(node: Element, budget: NamingBudget): boolean | null {
  if (!["none", "presentation"].includes(node.getAttribute("role")?.toLowerCase() ?? ""))
    return false;
  if (focusable(node)) return false;
  // Known global attributes conflict. Other ARIA attributes require standards-role resolution.
  const globals = [
    "aria-actions",
    "aria-braillelabel",
    "aria-brailleroledescription",
    "aria-description",
    "aria-label",
    "aria-labelledby",
    "aria-describedby",
    "aria-live",
    "aria-atomic",
    "aria-busy",
    "aria-controls",
    "aria-current",
    "aria-details",
    "aria-disabled",
    "aria-dropeffect",
    "aria-errormessage",
    "aria-flowto",
    "aria-grabbed",
    "aria-haspopup",
    "aria-hidden",
    "aria-invalid",
    "aria-keyshortcuts",
    "aria-owns",
    "aria-relevant",
    "aria-roledescription",
  ];
  if (globals.some((attr) => node.hasAttribute(attr))) return false;
  for (const attr of node.attributes) {
    if (!takeNameBudget(budget)) return null;
    if (attr.name.startsWith("aria-")) return null;
  }
  return true;
}
function children(node: Element): Iterable<Node> {
  if (node.localName === "slot") {
    const assigned = (node as HTMLSlotElement).assignedNodes({ flatten: true });
    if (assigned.length) return assigned;
  }
  return (node.shadowRoot ?? node).childNodes;
}
export function text(
  node: Element,
  budget: NamingBudget,
  includeHidden = false,
  seen = new Set<Element>(),
  depth = 0,
  contentsOnly = false,
): { value: string; unsupported: boolean } {
  if (seen.has(node)) return { value: "", unsupported: false };
  if (depth >= 64 || !takeNameBudget(budget)) {
    budget.exhausted = true;
    return { value: "", unsupported: true };
  }
  seen.add(node);
  if (["script", "style", "template", "noscript"].includes(node.localName))
    return { value: "", unsupported: false };
  if (!includeHidden && !visible(node, budget)) return { value: "", unsupported: budget.exhausted };
  let unsupported =
    node.namespaceURI !== "http://www.w3.org/1999/xhtml" ||
    node.hasAttribute("aria-owns") ||
    ["input", "textarea", "select", "canvas", "video", "audio", "object", "iframe"].includes(
      node.localName,
    ) ||
    (node.hasAttribute("role") &&
      !["button", "link", "img", "none", "presentation"].includes(
        node.getAttribute("role")!.toLowerCase(),
      ));
  for (const pseudo of ["::before", "::after"]) {
    const content = node.ownerDocument.defaultView!.getComputedStyle(node, pseudo).content;
    // Firefox's broken-image fallback exposes native alt, not authored generated text.
    if (node.localName === "img" && content === "-moz-alt-content") continue;
    if (content && !["none", "normal", '""'].includes(content)) unsupported = true;
  }
  if (node.localName === "img") {
    const role = node.getAttribute("role")?.toLowerCase();
    if (role === "none" || role === "presentation") {
      const presentational = presentation(node, budget);
      if (presentational === true)
        return { value: "", unsupported: unsupported || budget.exhausted };
      if (presentational === null) unsupported = true;
    } else if (role && role !== "img") unsupported = true;
  }
  const label = contentsOnly ? "" : nameString(node.getAttribute("aria-label") ?? "", budget);
  if (label || budget.exhausted)
    return { value: label, unsupported: unsupported || budget.exhausted };
  if (node.localName === "img") {
    return {
      value: nameString(node.getAttribute("alt") ?? node.getAttribute("title") ?? "", budget),
      unsupported,
    };
  }
  let value = "";
  for (const child of children(node)) {
    if (!takeNameBudget(budget)) break;
    if (child.nodeType === Node.TEXT_NODE) {
      const textNode = child as Text;
      if (!takeNameBudget(budget, textNode.length)) break;
      value += textNode.substringData(0, textNode.length);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const element = child as Element;
      if (seen.has(element) || (!includeHidden && !visible(element, budget))) continue;
      if (
        element.hasAttribute("aria-labelledby") ||
        ["input", "select", "textarea"].includes(element.localName)
      )
        unsupported = true;
      const result = text(element, budget, includeHidden, seen, depth + 1);
      value += result.value;
      unsupported ||= result.unsupported;
    }
    if (budget.exhausted) break;
  }
  const result =
    compact(value) || (contentsOnly ? "" : nameString(node.getAttribute("title") ?? "", budget));
  return { value: result, unsupported: unsupported || budget.exhausted };
}
export function name(
  node: Element,
  budget: NamingBudget,
): { value: string; source: string; unsupported: boolean } {
  if (budget.exhausted) return { value: "", source: "none", unsupported: true };
  function* candidates() {
    const refs = node.getAttribute("aria-labelledby") ?? "";
    const root = node.getRootNode() as Document | ShadowRoot;
    const referenced: ReturnType<typeof text>[] = [];
    if (takeNameBudget(budget, refs.length)) {
      for (const id of refs.trim().split(/\s+/)) {
        if (!id) continue;
        if (!takeNameBudget(budget)) break;
        const label = root.getElementById(id);
        if (label) referenced.push(text(label, budget, !visible(label, budget)));
        if (budget.exhausted) break;
      }
    }
    if (referenced.length || budget.exhausted)
      yield {
        value: compact(referenced.map((result) => result.value).join(" ")),
        source: "aria-labelledby",
        unsupported: referenced.some((result) => result.unsupported),
      };
    yield {
      value: nameString(node.getAttribute("aria-label") ?? "", budget),
      source: "aria-label",
      unsupported: false,
    };
    if (node.localName === "button") {
      const values: ReturnType<typeof text>[] = [];
      for (const label of (node as HTMLButtonElement).labels ?? []) {
        values.push(text(label, budget));
        if (budget.exhausted) break;
      }
      yield {
        value: compact(values.map((result) => result.value).join(" ")),
        source: "label",
        unsupported: values.some((result) => result.unsupported),
      };
    }
    yield { ...text(node, budget, false, new Set(), 0, true), source: "contents" };
    yield {
      value: nameString(node.getAttribute("title") ?? "", budget),
      source: "title",
      unsupported: false,
    };
  }
  let unsupported: { value: string; source: string; unsupported: boolean } | undefined;
  // button-name is an OR of naming checks. Stop after a supported positive check.
  for (const candidate of candidates()) {
    if (budget.exhausted) return { ...candidate, unsupported: true };
    if (candidate.value && !candidate.unsupported) return candidate;
    if (candidate.unsupported) unsupported ??= candidate;
  }
  return unsupported ?? { value: "", source: "none", unsupported: false };
}
