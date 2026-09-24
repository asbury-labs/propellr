// Compile-only examples. No runtime assertions or host behavior are claimed.
import type {
  ComponentAttribution,
  ComponentCapture,
  ComponentEvidence,
  ComponentManifest,
  ComponentRepairView,
  RepairScope,
  RepairScopeId,
  UnattributedOccurrence,
} from "../../src/components/contracts.js";
import type { IssueId, Target } from "../../src/contracts.js";

declare const target: Target;
declare const scope: RepairScope;
declare const view: ComponentRepairView;
declare const manifest: ComponentManifest;
declare const issueId: IssueId;
declare const unattributed: UnattributedOccurrence;

// Owner kind is correlated with support: suggested scopes only name the definition.
if (scope.status === "suggested") {
  const definition: string = scope.owner.definition;
  void definition;
  // @ts-expect-error - suggested membership never carries a proposed callsite owner
  void scope.owner.callsite;
}
export const supported: ComponentAttribution = {
  target,
  status: "supported",
  instance: "i0",
  part: "favorite",
  provenance: "source-linked",
  placement: "contained",
};
export const unknownWithPart: ComponentAttribution = {
  target,
  status: "unknown",
  reason: { code: "ownership-uncertain", message: "No explicit owner" },
  // @ts-expect-error - unknown attributions keep a reason, never a claimed part
  part: "favorite",
  candidates: [],
};
// @ts-expect-error - inference is reserved for a later, separately approved contract
export const inferred: ComponentAttribution["status"] = "inferred";
// @ts-expect-error - provenance is declared or source-linked, not model confidence
export const confident: Extract<ComponentAttribution, { status: "supported" }>["provenance"] = 0.99;
export const silentConflict: ComponentAttribution = {
  target,
  status: "conflicting",
  // @ts-expect-error - conflicting evidence requires at least one reason
  reasons: [],
  candidates: [],
};
// @ts-expect-error - partial evidence availability must name a gap
export const gapless: ComponentEvidence["availability"] = { state: "partial", gaps: [] };
export const noText: ComponentCapture["instances"][number] = {
  target,
  application: "storefront",
  build: "b1",
  definition: "Card",
  instance: "p0",
  // @ts-expect-error - captures carry declarations, not page text
  text: "Product name",
};
// @ts-expect-error - an unattributed occurrence is never supported
export const promoted: UnattributedOccurrence["status"] = "supported";
// @ts-expect-error - exact issue identities are not repair-scope identities
export const wrongIdentity: RepairScopeId = issueId;
// @ts-expect-error - view counts are readonly outputs
view.counts.supportedRepairScopes = 0;
// @ts-expect-error - parsed manifests are readonly
manifest.definitions[0]!.parts = [];
// @ts-expect-error - unattributed occurrences must explain themselves
export const unexplained: UnattributedOccurrence = { ...unattributed, reasons: [] };
