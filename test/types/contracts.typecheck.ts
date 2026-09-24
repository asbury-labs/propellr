// Compile-only examples. No runtime assertions or host behavior are claimed.
import type {
  Commands,
  Coverage,
  ExecutionMode,
  Json,
  Occurrence,
  Operation,
  OperationId,
  PlaybookResult,
  ScanResult,
  Session,
  SessionId,
} from "../../src/contracts.js";

declare const operation: Operation;
declare const operationId: OperationId;
declare const session: Session;
declare const playbookResult: PlaybookResult;
declare const occurrence: Omit<Occurrence, "outcome">;
declare function acceptsScan(result: ScanResult): void;
declare function acceptsPlaybook(result: PlaybookResult): void;

// Discriminating state and kind preserves the associated result type.
if (operation.state === "completed") {
  if (operation.kind === "scan") {
    acceptsScan(operation.result);
  } else if (operation.kind === "components") {
    // Component analysis carries the exact scan beside separate enrichment.
    acceptsScan(operation.result.scan);
    // @ts-expect-error - enrichment is not a scan result
    acceptsScan(operation.result.enrichment);
    if (operation.result.enrichment.state === "available") void operation.result.enrichment.view;
    // @ts-expect-error - views exist only on available enrichment
    else void operation.result.enrichment.view;
  } else {
    acceptsPlaybook(operation.result);
  }
}
if (operation.state === "running") {
  // @ts-expect-error - progress is not a completed result
  void operation.result;
}

export const incomplete: Occurrence = {
  ...occurrence,
  outcome: "incomplete",
  reason: {
    code: "evidence-unavailable",
    message: "Required evidence missing",
  },
};
export const fallback: ExecutionMode = {
  requested: "incremental",
  actual: "full",
  fallback: { code: "unknown-dependency", message: "Full scan required" },
};

// @ts-expect-error - incomplete outcomes require a reason
export const missingReason: Occurrence = {
  ...occurrence,
  outcome: "incomplete",
};
// @ts-expect-error - partial coverage requires at least one gap
export const emptyGaps: Coverage = { state: "partial", gaps: [] };
// @ts-expect-error - fallback must be explained
export const silentFallback: ExecutionMode = {
  requested: "incremental",
  actual: "full",
};
// @ts-expect-error - a playbook result cannot satisfy a completed scan operation
export const wrongResult: Extract<Operation<"scan">, { state: "completed" }>["result"] =
  playbookResult;
// @ts-expect-error - operation identities are not session identities
export const wrongIdentity: SessionId = operationId;
// @ts-expect-error - returned policy snapshots are readonly
session.policy.version = "mutated";
// @ts-expect-error - dates must be explicitly encoded, not leaked onto the wire
export const nonJson: Json = new Date();
// @ts-expect-error - protocol changes require a new contract, not implicit acceptance
export const wrongProtocol: Commands["open"]["input"]["protocol"] = "propellr/99";
