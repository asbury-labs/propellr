// Opt-in semantic text sidecar (propellr-text-capture/1). Reads the final raw results and the
// residual naming budget only; it cannot add, drop, reorder or reinterpret findings.
// Protocol: specs/semantic-text-capture-protocol.md.
import type { RuleResult, Target, VersionRef } from "../contracts.js";
import type { NameText, TextCapture, TextTarget } from "../review/contracts.js";
import { structureRoles, textCollector, textDiagnostics, textRules } from "../analysis.js";
import { compacted, takeNameBudget, text } from "./naming.js";
import type { NamingBudget } from "./naming.js";

export interface PassingName {
  readonly rule: VersionRef;
  readonly node: Element;
  readonly target: Target;
  readonly check: string;
  readonly name: NameText;
}
type Named = Extract<TextTarget, { name: { state: "available" } }>;
type Field = Named["heading"];
type Image = NonNullable<Named["image"]>;

// Budget, depth or size exhaustion abandons the whole sidecar; a long excerpt only its field.
class Limit extends Error {}
class TooLong extends Error {}
const roles = new Set<string>(structureRoles);
const headings = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);
const containers = new Set([
  "label",
  "li",
  "article",
  "section",
  "form",
  "nav",
  "main",
  "div",
  "p",
]);
const skipped = new Set([
  "script",
  "style",
  "template",
  "noscript",
  "iframe",
  "frame",
  "object",
  "embed",
  "video",
  "audio",
  "canvas",
  "img",
  "picture",
  "button",
  "input",
  "select",
  "textarea",
  "option",
  "optgroup",
  "datalist",
  "output",
]);
const bytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).byteLength;

export function captureText(input: {
  readonly facts: readonly {
    readonly node: Element;
    readonly target: Target;
    readonly visible: boolean;
  }[];
  readonly passing: readonly PassingName[];
  // Undefined when raw results were replaced by the evidence-limit fallback.
  readonly results: readonly RuleResult[] | undefined;
  readonly selected: readonly string[];
  readonly populationComplete: boolean;
  readonly budget: NamingBudget;
}): TextCapture {
  const header = { schema: "propellr-text-capture/1", collector: textCollector } as const;
  const unavailable = (code: keyof typeof textDiagnostics): TextCapture => ({
    ...header,
    state: "unavailable",
    reason: { code, message: textDiagnostics[code] },
  });
  const naming = (input.results ?? []).filter(({ rule }) =>
    (textRules as readonly string[]).includes(rule.id),
  );
  // Absent usable naming results is unavailable, never an empty successful capture.
  if (!naming.some(({ state }) => state === "evaluated" || state === "inapplicable"))
    return unavailable("text-population-unavailable");
  const selectionComplete = textRules.every((id) => input.selected.includes(id));
  const populationComplete =
    input.populationComplete && naming.every(({ state }) => state !== "not-evaluated");
  const gaps: Extract<TextCapture, { state: "available" }>["gaps"][number][] = [];
  if (!selectionComplete)
    gaps.push({
      code: "text-selection-incomplete",
      message: textDiagnostics["text-selection-incomplete"],
    });
  if (!populationComplete)
    gaps.push({
      code: "text-population-incomplete",
      message: textDiagnostics["text-population-incomplete"],
    });
  if (input.passing.length > 96) return unavailable("text-capture-limit");
  const { budget } = input;
  const step = (characters = 0) => {
    if (!takeNameBudget(budget, characters)) throw new Limit();
  };
  try {
    const sameName = sameNames(input.passing, selectionComplete, populationComplete);
    const nearest = nearestHeadings(input.facts, input.passing);
    const headingText = new Map<Element, Field>();
    const excerpts = new Map<Element, Field>();
    const targets: TextTarget[] = [];
    for (const record of input.passing) {
      const base = {
        target: record.target,
        rule: record.rule,
        check: record.check,
        role: role(record.node, step),
      };
      if (record.name.state !== "available") {
        targets.push({ ...base, name: record.name });
      } else {
        const heading = nearest.get(record.node);
        let headingField: Field = { state: "absent" };
        if (heading) {
          headingField = headingText.get(heading) ?? headingValue(heading, budget);
          headingText.set(heading, headingField);
        }
        const image =
          record.rule.id === "image-alt" || record.rule.id === "input-image-alt"
            ? imageFields(record.node, step)
            : undefined;
        targets.push({
          ...base,
          name: record.name,
          heading: headingField,
          container: containerText(record.node, budget, step, excerpts),
          sameName: sameName(record),
          ...(image ? { image } : {}),
        });
      }
      if (budget.exhausted) throw new Limit();
      // An oversized record, including a long target path, abandons the whole sidecar.
      if (bytes(targets.at(-1)) > 1024) throw new Limit();
    }
    const capture: TextCapture = { ...header, state: "available", targets, gaps };
    return bytes(capture) <= 65_536 ? capture : unavailable("text-capture-limit");
  } catch (error) {
    if (error instanceof Limit) return unavailable("text-capture-limit");
    // The raw scan never depends on the sidecar: any other failure only drops the capture.
    return unavailable("text-capture-unavailable");
  }
}

// Counted in code over the declared observable passing population; never page-wide inference.
function sameNames(
  passing: readonly PassingName[],
  selectionComplete: boolean,
  populationComplete: boolean,
): (record: PassingName) => Named["sameName"] {
  const reason = !selectionComplete
    ? "selection-incomplete"
    : !populationComplete
      ? "population-incomplete"
      : passing.some(({ name }) => name.state !== "available")
        ? "name-unavailable"
        : undefined;
  if (reason) return () => ({ state: "unavailable", reason });
  // Exact targets passing more than one naming rule are counted once per name.
  const targets = new Map<string, Set<string>>();
  for (const { name, target } of passing) {
    if (name.state !== "available") continue;
    const set = targets.get(name.value) ?? new Set<string>();
    set.add(JSON.stringify(target.path));
    targets.set(name.value, set);
  }
  return ({ name }) =>
    name.state === "available"
      ? { state: "available", count: targets.get(name.value)!.size }
      : { state: "unavailable", reason: "name-unavailable" };
}

// Reader order within the target's own document or shadow root; reuses the reader's facts.
function nearestHeadings(
  facts: readonly { readonly node: Element; readonly target: Target; readonly visible: boolean }[],
  passing: readonly PassingName[],
): Map<Element, Element | undefined> {
  const wanted = new Set(
    passing.filter(({ name }) => name.state === "available").map(({ node }) => node),
  );
  const last = new Map<string, Element>();
  const nearest = new Map<Element, Element | undefined>();
  for (const { node, target, visible } of facts) {
    const root = JSON.stringify(target.path.slice(0, -1));
    if (wanted.has(node)) nearest.set(node, last.get(root));
    if (visible && headings.has(node.localName)) last.set(root, node);
  }
  return nearest;
}

function headingValue(heading: Element, budget: NamingBudget): Field {
  const result = text(heading, budget, false, new Set(), 0, true);
  if (budget.exhausted) throw new Limit();
  if (result.unsupported) return { state: "unavailable", reason: "unsupported" };
  if (result.excluded) return { state: "unavailable", reason: "excluded-source" };
  if (result.truncated) return { state: "unavailable", reason: "too-long" };
  if (!result.value) return { state: "unavailable", reason: "empty" };
  return { state: "available", value: result.value };
}

// Allowlisted tokens only: supported explicit role, else a supported implicit native role.
function role(node: Element, step: (characters?: number) => void): TextTarget["role"] {
  const explicit = node.getAttribute("role");
  step(explicit?.length ?? 0);
  if (explicit !== null) {
    const token = explicit.trim().toLowerCase();
    return roles.has(token) ? (token as TextTarget["role"]) : "unknown";
  }
  const type = node.getAttribute("type")?.toLowerCase() ?? "";
  step(type.length);
  switch (node.localName) {
    case "button":
      return "button";
    case "a":
      return node.hasAttribute("href") ? "link" : "unknown";
    case "img":
      return node.getAttribute("alt") === "" ? "presentation" : "img";
    case "textarea":
      return "textbox";
    case "select":
      return (node as HTMLSelectElement).multiple || (node as HTMLSelectElement).size > 1
        ? "listbox"
        : "combobox";
    case "input":
      if (["button", "submit", "reset", "image"].includes(type)) return "button";
      if (["checkbox", "radio"].includes(type)) return type as "checkbox" | "radio";
      if (type === "range") return "slider";
      if (type === "number") return "spinbutton";
      if (type === "search") return "searchbox";
      return ["", "text", "email", "tel", "url"].includes(type) ? "textbox" : "unknown";
    default:
      return "unknown";
  }
}

function hidden(element: Element): boolean {
  const style = element.ownerDocument.defaultView!.getComputedStyle(element);
  return (
    element.getAttribute("aria-hidden") === "true" ||
    element.hasAttribute("inert") ||
    style.display === "none" ||
    style.visibility !== "visible" ||
    style.contentVisibility === "hidden"
  );
}

// Nearest eligible ancestor in the target's own tree; never crosses a frame or shadow root.
function containerText(
  node: Element,
  budget: NamingBudget,
  step: (characters?: number) => void,
  excerpts: Map<Element, Field>,
): Field {
  let container: Element | null = null;
  for (let current = node.parentElement; current; current = current.parentElement) {
    step();
    if (current.localName === "body" || current.localName === "html") break;
    if (
      current.namespaceURI === "http://www.w3.org/1999/xhtml" &&
      containers.has(current.localName)
    ) {
      container = current;
      break;
    }
  }
  if (!container) return { state: "absent" };
  // isContentEditable inherits, so this also covers text directly inside an editable host.
  if ((container as Partial<HTMLElement>).isContentEditable)
    return { state: "unavailable", reason: "excluded-source" };
  // A skipped target's subtree is omitted either way, so its excerpt is shared and charged once.
  const shared = skipped.has(node.localName);
  const known = shared ? excerpts.get(container) : undefined;
  if (known) return known;
  const field = excerpt(container, node, budget, step);
  if (shared) excerpts.set(container, field);
  return field;
}

function excerpt(
  container: Element,
  node: Element,
  budget: NamingBudget,
  step: (characters?: number) => void,
): Field {
  // Visible composed text, omitting the target subtree, controls, hidden and embedded content.
  let out = "";
  let excluded = false;
  const seen = new Set<Node>();
  const append = (chunk: string) => {
    out = `${out}${chunk}`.replace(/\s+/g, " ");
    if (out.trimStart().length > 160) throw new TooLong();
  };
  const walk = (current: Node, depth: number): void => {
    if (seen.has(current)) return;
    seen.add(current);
    if (current.nodeType === Node.TEXT_NODE) {
      const data = current as Text;
      // Charge each bounded chunk before copying it; never collect then slice.
      for (let offset = 0; offset < data.length; offset += 256) {
        const size = Math.min(256, data.length - offset);
        step(size);
        append(data.substringData(offset, size));
      }
      return;
    }
    if (current.nodeType !== Node.ELEMENT_NODE) return;
    const element = current as Element;
    if (depth > 64) throw new Limit();
    step();
    if (
      element === node ||
      element.namespaceURI !== "http://www.w3.org/1999/xhtml" ||
      skipped.has(element.localName) ||
      hidden(element)
    )
      return append(" ");
    if ((element as Partial<HTMLElement>).isContentEditable) {
      excluded = true;
      return;
    }
    const children =
      element.localName === "slot" && (element as HTMLSlotElement).assignedNodes().length
        ? (element as HTMLSlotElement).assignedNodes({ flatten: true })
        : [...(element.shadowRoot ?? element).childNodes];
    for (const child of children) walk(child, depth + 1);
    append(" ");
  };
  try {
    for (const child of (container.shadowRoot ?? container).childNodes) walk(child, 1);
  } catch (error) {
    if (error instanceof TooLong) return { state: "unavailable", reason: "too-long" };
    throw error;
  }
  if (budget.exhausted) throw new Limit();
  const value = out.trim();
  if (excluded) return { state: "unavailable", reason: "excluded-source" };
  return value ? { state: "available", value } : { state: "unavailable", reason: "empty" };
}

function imageFields(node: Element, step: (characters?: number) => void): Image {
  const alt = node.getAttribute("alt");
  step(alt?.length ?? 0);
  const altValue = alt === null ? undefined : compacted(alt);
  const src = node.getAttribute("src");
  step(src?.length ?? 0);
  return {
    alt:
      altValue === undefined
        ? { state: "absent" }
        : altValue.truncated
          ? { state: "unavailable", reason: "too-long" }
          : { state: "available", value: altValue.value },
    basename: basename(src, node.baseURI),
  };
}

// Last nonempty pathname segment, still percent-encoded. No scheme, host, query or fragment.
function basename(src: string | null, base: string): Image["basename"] {
  if (!src) return { state: "unavailable", reason: "no-src" };
  let url: URL;
  try {
    url = new URL(src, base);
  } catch {
    return { state: "unavailable", reason: "invalid-url" };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:")
    return { state: "unavailable", reason: "unsupported-url" };
  const segment = url.pathname.split("/").findLast((part) => part !== "");
  if (!segment) return { state: "unavailable", reason: "no-basename" };
  if (segment.length > 160) return { state: "unavailable", reason: "too-long" };
  return { state: "available", value: segment };
}
