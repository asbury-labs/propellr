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
// Shared egress grammar: element name plus an allowlisted role or "other".
export function isStructureLabel(value: string): boolean {
  const [name, role, ...rest] = value.split("|");
  return (
    !rest.length &&
    value.length <= 64 &&
    /^[A-Za-z][A-Za-z0-9._-]*$/.test(name ?? "") &&
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
