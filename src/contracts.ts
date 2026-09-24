// Transport-neutral contract. Inputs derive from runtime schemas; outputs remain types.
import type {
  CommandInputs,
  ValidatedRuleSelection,
  ValidatedScanRequest,
  ValidatedScope,
  ValidatedTarget,
  ValidatedVersionRef,
} from "./validation.js";
import type { ComponentRepairView } from "./components/contracts.js";

declare const identity: unique symbol;
type Id<Kind extends string> = string & { readonly [identity]: Kind };
export type SessionId = Id<"session">;
export type OperationId = Id<"operation">;
export type PageId = Id<"page">;
export type ScanId = Id<"scan">;
export type OccurrenceId = Id<"occurrence">;
export type IssueId = Id<"issue">;
export type NonEmpty<T> = readonly [T, ...T[]];
export type Json = null | boolean | number | string | readonly Json[] | JsonObject;
export type JsonObject = { readonly [key: string]: Json };
export type VersionRef = ValidatedVersionRef;

// Paths traverse frame/shadow boundaries in order. Empty path means document.
export type Target = ValidatedTarget;

export interface Diagnostic {
  readonly code: string;
  readonly message: string;
  readonly target?: Target;
}

export type Reply<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly diagnostic: Diagnostic };

export interface Session {
  readonly protocol: "propellr/0.1";
  readonly id: SessionId;
  readonly state: "active" | "ending" | "ended" | "lost";
  readonly diagnostics: readonly Diagnostic[];
  readonly browser: {
    readonly targetId: string;
    readonly ownership: "owned" | "borrowed";
  };
  readonly pages: readonly PageId[];
  readonly documents: readonly { readonly pageId: PageId; readonly documentId: string }[];
  readonly capabilities: readonly string[];
  readonly policy: VersionRef;
  readonly configuration: VersionRef;
}

export type Scope = ValidatedScope;
export type RuleSelection = ValidatedRuleSelection;
export type ScanRequest = ValidatedScanRequest;

export interface Evidence {
  readonly kind: string;
  readonly observed?: Json;
  readonly expected?: Json;
  readonly explanation: string;
}

type OccurrenceBase = {
  readonly id: OccurrenceId;
  readonly target: Target;
  readonly impact: "minor" | "moderate" | "serious" | "critical" | null;
  readonly evidence: readonly Evidence[];
  readonly remediation?: string;
};

export type Occurrence = OccurrenceBase &
  (
    | { readonly outcome: "pass" | "violation" }
    | { readonly outcome: "incomplete"; readonly reason: Diagnostic }
  );

export type RuleResult = { readonly rule: VersionRef } & (
  | { readonly state: "evaluated"; readonly occurrences: NonEmpty<Occurrence> }
  | { readonly state: "inapplicable" }
  | { readonly state: "not-evaluated"; readonly reason: Diagnostic }
);

export type Coverage =
  | { readonly state: "complete" }
  | {
      readonly state: "partial" | "stale";
      readonly gaps: NonEmpty<Diagnostic>;
    };

export type ExecutionMode =
  | { readonly requested: "full"; readonly actual: "full" }
  | { readonly requested: "incremental"; readonly actual: "incremental" }
  | {
      readonly requested: "incremental";
      readonly actual: "full";
      readonly fallback: Diagnostic;
    };

export interface ScanResult {
  readonly id: ScanId;
  readonly epoch: number;
  readonly origin:
    | { readonly kind: "direct" }
    | {
        readonly kind: "playbook";
        readonly playbook: VersionRef;
        readonly checkpointId: string;
      };
  readonly engine: VersionRef;
  readonly policy: VersionRef;
  readonly configuration: VersionRef;
  readonly scope: Scope;
  readonly resolvedRules: NonEmpty<{
    readonly rule: VersionRef;
    readonly options: JsonObject;
  }>;
  readonly execution: ExecutionMode;
  readonly coverage: Coverage;
  readonly rules: readonly RuleResult[];
  readonly durationMs: number;
  readonly report?: Report;
}

// Groups reference raw occurrences, including historical scans, never replace them.
export interface IssueGroup {
  readonly id: IssueId;
  readonly rule: VersionRef;
  readonly members: NonEmpty<{
    readonly scanId: ScanId;
    readonly occurrenceId: OccurrenceId;
  }>;
  readonly identityVersion: string;
  readonly groupingBasis: string;
  readonly lifecycle: "new" | "existing" | "resolved" | "recurring" | "not-compared";
}

export interface Report {
  // Current-scan counts only; historical/resolved members do not inflate them.
  readonly counts: {
    readonly violationOccurrences: number;
    readonly incompleteOccurrences: number;
    readonly uniqueViolationIssues: number;
    readonly uniqueIncompleteIssues: number;
  };
  readonly groups: readonly IssueGroup[];
  readonly comparison:
    | { readonly state: "not-compared" }
    | { readonly state: "comparable"; readonly baseline: NonEmpty<ScanId> }
    | { readonly state: "not-comparable"; readonly reason: Diagnostic };
  readonly gate?: {
    readonly policy: VersionRef;
    readonly decision: "pass" | "fail" | "indeterminate";
    readonly reasons: NonEmpty<Diagnostic>;
  };
}

// Describes an authorized workflow; not an arbitrary remote script to evaluate.
export interface PlaybookManifest {
  readonly playbook: VersionRef;
  readonly inputSchema: JsonObject;
  readonly prerequisites: readonly string[];
  readonly permissions: {
    readonly origins: NonEmpty<string>;
    readonly actions: readonly string[];
  };
  readonly checkpoints: NonEmpty<{
    readonly id: string;
    readonly expectedBehavior: string;
  }>;
}

export type Checkpoint = {
  readonly id: string;
  readonly observed?: JsonObject;
} & (
  | { readonly state: "reached"; readonly scans: NonEmpty<ScanResult> }
  | { readonly state: "blocked" | "skipped"; readonly reason: Diagnostic }
);

export interface PlaybookResult {
  readonly playbook: VersionRef;
  readonly coverage: Coverage;
  readonly checkpoints: NonEmpty<Checkpoint>;
  readonly cleanup: "complete" | "incomplete" | "not-required";
  readonly diagnostics: readonly Diagnostic[];
}

// Enrichment is correlated to the exact committed scan; it never replaces raw results.
export type ComponentEnrichment = {
  readonly scanId: ScanId;
  readonly documentId: string;
  readonly epoch: number;
  readonly generation: number;
} & (
  | { readonly state: "available"; readonly view: ComponentRepairView }
  | { readonly state: "unavailable" | "evicted"; readonly reason: Diagnostic }
);
export interface ComponentAnalysis {
  readonly scan: ScanResult;
  readonly enrichment: ComponentEnrichment;
}

type Results = {
  readonly scan: ScanResult;
  readonly playbook: PlaybookResult;
  readonly components: ComponentAnalysis;
};

// Mapping preserves kind/result correlation, including when K is the full union.
export type Operation<K extends keyof Results = keyof Results> = {
  [Kind in K]: {
    readonly id: OperationId;
    readonly sessionId: SessionId;
    readonly requestId: string;
    readonly kind: Kind;
    readonly policy: VersionRef;
    readonly configuration: VersionRef;
    readonly invocation?: { readonly playbook: VersionRef; readonly inputs: JsonObject };
  } & (
    | { readonly state: "queued" | "running" | "cancelling" }
    | { readonly state: "completed"; readonly result: Results[Kind] }
    | {
        readonly state: "failed" | "cancelled" | "lost";
        readonly diagnostics: NonEmpty<Diagnostic>;
        readonly completedScans: readonly ScanResult[];
        readonly checkpoints?: readonly Checkpoint[];
        readonly sideEffects: "none" | "confirmed" | "uncertain";
        readonly cleanup: "complete" | "incomplete" | "not-required";
      }
  );
}[K];

export type Event = {
  readonly sessionId: SessionId;
  readonly cursor: string;
} & (
  | { readonly type: "session"; readonly session: Session }
  | { readonly type: "operation"; readonly operation: Operation }
  | {
      readonly type: "checkpoint";
      readonly operationId: OperationId;
      readonly playbook: VersionRef;
      readonly checkpoint: Checkpoint;
    }
  // Raw results commit and are delivered before component enrichment completes.
  | { readonly type: "raw-scan"; readonly operationId: OperationId; readonly scan: ScanResult }
);

export type EventDelivery =
  | { readonly type: "event"; readonly event: Event }
  | {
      readonly type: "gap";
      readonly sessionId: SessionId;
      readonly requestedAfter: string;
      readonly earliestAvailable: string;
      readonly reason: Diagnostic;
    };

export interface Commands {
  readonly open: {
    readonly input: CommandInputs["open"];
    readonly output: Session;
  };
  readonly inspect: {
    readonly input: CommandInputs["inspect"];
    readonly output: {
      readonly session: Session;
      readonly operations: readonly Pick<Operation, "id" | "kind" | "state">[];
      readonly selectedOperation?: Operation;
      readonly playbooks: readonly PlaybookManifest[];
    };
  };
  readonly scan: {
    readonly input: CommandInputs["scan"];
    readonly output: Operation<"scan">;
  };
  readonly analyzeComponents: {
    readonly input: CommandInputs["analyzeComponents"];
    readonly output: Operation<"components">;
  };
  readonly runPlaybook: {
    readonly input: CommandInputs["runPlaybook"];
    readonly output: Operation<"playbook">;
  };
  readonly subscribe: {
    readonly input: CommandInputs["subscribe"];
    readonly output: AsyncIterable<EventDelivery>;
  };
  readonly cancel: {
    readonly input: CommandInputs["cancel"];
    readonly output: {
      readonly disposition: "requested" | "already-terminal";
      readonly operation: Operation;
    };
  };
  readonly end: {
    readonly input: CommandInputs["end"];
    readonly output: Session;
  };
}

// A typed SDK surface, not a promise that TypeScript validates wire messages.
export type SessionClient = {
  readonly [Name in keyof Commands]: (
    input: Commands[Name]["input"],
  ) => Promise<Reply<Commands[Name]["output"]>>;
};
