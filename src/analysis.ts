import type {
  Diagnostic,
  NonEmpty,
  RuleResult,
  ScanRequest,
  Target,
  VersionRef,
  JsonObject,
} from "./contracts.js";

export const sliceRules = ["button-name", "target-size", "landmark-one-main"] as const;
export const engineVersion = { id: "propellr-slice", version: "0.1" } as const;
export interface BrowserScanInput {
  readonly target: Target;
  readonly rules: NonEmpty<{ readonly rule: VersionRef; readonly options: JsonObject }>;
}
export interface BrowserScanOutput {
  readonly rules: readonly RuleResult[];
  readonly gaps: readonly Diagnostic[];
}
export interface BrowserAnalysis {
  scan(input: BrowserScanInput): BrowserScanOutput;
  finish(): boolean;
}
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
