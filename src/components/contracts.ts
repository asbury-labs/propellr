// Component identity contract. Inputs derive from schemas; the repair view is an output type.
// Separate from Report/IssueGroup: exact reporting and gates never consume these values.
import type {
  Coverage,
  Diagnostic,
  IssueId,
  NonEmpty,
  OccurrenceId,
  ScanId,
  VersionRef,
} from "../contracts.js";
import type {
  ManifestInput,
  ValidatedBinding,
  ValidatedBuildRef,
  ValidatedCapture,
  ValidatedEvidence,
  ValidatedManifest,
  ValidatedStructure,
} from "./validation.js";

declare const identity: unique symbol;
export type RepairScopeId = string & { readonly [identity]: "repair-scope" };
export type ComponentManifest = ValidatedManifest;
export type ComponentManifestInput = ManifestInput;
export type PartBinding = ValidatedBinding;
export type BuildRef = ValidatedBuildRef;
export type ComponentCapture = ValidatedCapture;
export type ComponentEvidence = ValidatedEvidence;
export type StructureCapture = ValidatedStructure;
export type ComponentAttribution = ComponentEvidence["attributions"][number];
export type ComponentInstance = ComponentEvidence["instances"][number];
export type Provenance = Extract<ComponentAttribution, { status: "supported" }>["provenance"];

// Owner is the proposed place a repair would change, never proof that it fixes every member.
export type RepairOwner =
  | { readonly kind: "template"; readonly definition: string }
  | { readonly kind: "callsite"; readonly callsite: string; readonly caller: string }
  | {
      readonly kind: "data-record";
      readonly definition: string;
      readonly record: string;
      readonly field: string;
    };

export interface RepairMember {
  readonly scanId: ScanId;
  readonly occurrenceId: OccurrenceId;
  readonly issueId: IssueId;
  readonly instance: string;
  readonly variant?: string;
  readonly provenance: Provenance;
}

type ScopeBase = {
  readonly id: RepairScopeId;
  readonly application: string;
  readonly build: string;
  readonly definition: string;
  readonly part: string;
  readonly rule: VersionRef;
  readonly defect: string;
  readonly variants: {
    readonly observed: readonly string[];
    readonly unobserved: readonly string[];
    readonly undeclaredMembers: number;
  };
  readonly members: NonEmpty<RepairMember>;
};
// Supported needs reviewed binding evidence. Suggested is shared membership with unknown cause.
export type RepairScope = ScopeBase &
  (
    | {
        readonly status: "supported";
        readonly basis: "reviewed-binding";
        readonly owner: RepairOwner;
      }
    | {
        readonly status: "suggested";
        readonly basis: "definition-membership";
        readonly owner: { readonly kind: "definition"; readonly definition: string };
      }
  );

export interface UnattributedOccurrence {
  readonly scanId: ScanId;
  readonly occurrenceId: OccurrenceId;
  readonly issueId: IssueId;
  readonly status: "unknown" | "conflicting" | "stale" | "unavailable";
  readonly reasons: NonEmpty<Diagnostic>;
  readonly candidates: readonly string[];
}

export interface RepairSplit {
  readonly application: string;
  readonly build: string;
  readonly definition: string;
  readonly part: string;
  readonly rule: VersionRef;
  readonly scopes: NonEmpty<RepairScopeId>;
  readonly differing: NonEmpty<"owner" | "defect" | "basis">;
}

export interface ComponentRepairView {
  readonly schema: "propellr-component-repair-view/1";
  readonly groupingVersion: "component-repair/1";
  readonly scanId: ScanId;
  readonly evidence: {
    readonly collector: VersionRef;
    readonly resolver: VersionRef;
    readonly availability: ComponentEvidence["availability"];
  };
  readonly coverage: { readonly scan: Coverage["state"] };
  // Separate counts: candidate fixes are not confirmed defects or exact issues.
  readonly counts: {
    readonly violationOccurrences: number;
    readonly exactViolationIssues: number;
    readonly excludedIncompleteOccurrences: number;
    readonly supportedRepairScopes: number;
    readonly suggestedRepairScopes: number;
    readonly supportedOccurrences: number;
    readonly suggestedOccurrences: number;
    readonly unattributedOccurrences: number;
  };
  readonly scopes: readonly RepairScope[];
  readonly splits: readonly RepairSplit[];
  readonly unattributed: readonly UnattributedOccurrence[];
}
