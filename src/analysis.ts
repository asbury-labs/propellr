import type {
  Diagnostic,
  NonEmpty,
  RuleResult,
  ScanRequest,
  Target,
  VersionRef,
  JsonObject,
} from "./contracts.js";
import type { ComponentCapture, StructureCapture } from "./components/contracts.js";

export const sliceRules = ["button-name", "target-size", "landmark-one-main"] as const;
export const namingRules = [
  "image-alt",
  "link-name",
  "label",
  "input-button-name",
  "input-image-alt",
  "select-name",
] as const;
export const implementedRules = [...sliceRules, ...namingRules] as const;
export const engineVersion = { id: "propellr-slice", version: "0.3" } as const;
export const componentCollector = { id: "propellr-bridge", version: "1" } as const;
export const structureCollector = { id: "propellr-structure", version: "1" } as const;
// Roles a structural label may carry verbatim; any other role becomes "other".
export const structureRoles = [
  "alert",
  "alertdialog",
  "application",
  "article",
  "banner",
  "button",
  "cell",
  "checkbox",
  "columnheader",
  "combobox",
  "complementary",
  "contentinfo",
  "definition",
  "dialog",
  "directory",
  "document",
  "feed",
  "figure",
  "form",
  "grid",
  "gridcell",
  "group",
  "heading",
  "img",
  "link",
  "list",
  "listbox",
  "listitem",
  "log",
  "main",
  "marquee",
  "math",
  "menu",
  "menubar",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "navigation",
  "none",
  "note",
  "option",
  "presentation",
  "progressbar",
  "radio",
  "radiogroup",
  "region",
  "row",
  "rowgroup",
  "rowheader",
  "scrollbar",
  "search",
  "searchbox",
  "separator",
  "slider",
  "spinbutton",
  "status",
  "switch",
  "tab",
  "table",
  "tablist",
  "tabpanel",
  "term",
  "textbox",
  "timer",
  "toolbar",
  "tooltip",
  "tree",
  "treegrid",
  "treeitem",
] as const;
// Element names a structural label may carry; custom elements become "custom", others "unknown".
export const structureElements = [
  "a",
  "abbr",
  "address",
  "area",
  "article",
  "aside",
  "audio",
  "b",
  "bdi",
  "bdo",
  "blockquote",
  "body",
  "br",
  "button",
  "canvas",
  "caption",
  "cite",
  "code",
  "col",
  "colgroup",
  "data",
  "datalist",
  "dd",
  "del",
  "details",
  "dfn",
  "dialog",
  "div",
  "dl",
  "dt",
  "em",
  "embed",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hgroup",
  "hr",
  "html",
  "i",
  "iframe",
  "img",
  "input",
  "ins",
  "kbd",
  "label",
  "legend",
  "li",
  "link",
  "main",
  "map",
  "mark",
  "menu",
  "meta",
  "meter",
  "nav",
  "noscript",
  "object",
  "ol",
  "optgroup",
  "option",
  "output",
  "p",
  "picture",
  "pre",
  "progress",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "script",
  "search",
  "section",
  "select",
  "slot",
  "small",
  "source",
  "span",
  "strong",
  "style",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "template",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "time",
  "title",
  "tr",
  "track",
  "u",
  "ul",
  "var",
  "video",
  "wbr",
  "svg",
  "path",
  "g",
  "circle",
  "rect",
  "line",
  "polyline",
  "polygon",
  "ellipse",
  "text",
  "use",
  "defs",
  "symbol",
  "math",
  "frame",
  "frameset",
] as const;
export function structureElement(localName: string): string {
  const name = localName.toLowerCase();
  if ((structureElements as readonly string[]).includes(name)) return name;
  return name.includes("-") ? "custom" : "unknown";
}
// Shared egress grammar: an allowlisted element name plus an allowlisted role or "other".
export function isStructureLabel(value: string): boolean {
  const [name, role, ...rest] = value.split("|");
  return (
    !rest.length &&
    name !== undefined &&
    ((structureElements as readonly string[]).includes(name) ||
      name === "custom" ||
      name === "unknown") &&
    (role === undefined || role === "other" || (structureRoles as readonly string[]).includes(role))
  );
}
export function sixRuleRequest(target: Target, mode: ScanRequest["mode"] = "full"): ScanRequest {
  return {
    mode,
    scope: { include: [target], exclude: [] },
    rules: {
      kind: "explicit",
      rules: [
        { id: "button-name", options: {} },
        { id: "target-size", options: {} },
        { id: "landmark-one-main", options: {} },
        { id: "image-alt", options: {} },
        { id: "link-name", options: {} },
        { id: "label", options: {} },
      ],
    },
  };
}
export interface BrowserScanInput {
  readonly target: Target;
  readonly rules: NonEmpty<{ readonly rule: VersionRef; readonly options: JsonObject }>;
  // Optional enrichment in the same call; never changes rules, gaps or coverage.
  readonly components?: {
    readonly bridge: "propellr-bridge/1";
    readonly structure?: "propellr-structure/1";
  };
}
export interface BrowserScanOutput {
  readonly rules: readonly RuleResult[];
  readonly gaps: readonly Diagnostic[];
  readonly components?: ComponentCapture;
  readonly structure?: StructureCapture;
}
export interface BrowserAnalysis {
  scan(input: BrowserScanInput): BrowserScanOutput;
  finish(): boolean;
}
// Keep the original explicit workload stable for playbooks and historical benchmarks.
export function selectedRequest(target: Target, mode: ScanRequest["mode"] = "full"): ScanRequest {
  return {
    mode,
    scope: { include: [target], exclude: [] },
    rules: {
      kind: "explicit",
      rules: [
        { id: "button-name", options: {} },
        { id: "target-size", options: {} },
        { id: "landmark-one-main", options: {} },
      ],
    },
  };
}
