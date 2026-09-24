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
