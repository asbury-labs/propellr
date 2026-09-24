import type {
  Diagnostic,
  IssueId,
  Json,
  NonEmpty,
  OccurrenceId,
  ScanResult,
} from "../contracts.js";
import { canonical, reportScan } from "../reporting/index.js";
import type {
  ComponentEvidence,
  ComponentRepairView,
  RepairMember,
  RepairOwner,
  RepairScope,
  RepairScopeId,
  RepairSplit,
  UnattributedOccurrence,
} from "./contracts.js";
import { evidenceSchema } from "./validation.js";

export const groupingVersion = "component-repair/1";
type Without<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type Scoped = Without<RepairScope, "id" | "variants" | "members"> & { members: RepairMember[] };
const reason = (code: string, message: string): Diagnostic => ({ code, message });
// Target paths make every defect instance-specific; the mechanism excludes them.
function withoutPaths(value: Json | undefined): Json | undefined {
  if (Array.isArray(value)) return value.map((entry) => withoutPaths(entry) ?? null);
  if (value !== null && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== "related" && key !== "neighbors")
        .map(([key, entry]) => [key, withoutPaths(entry) ?? null]),
    );
  return value;
}

// Rule plus canonical evidence observations, excluding instance-specific target paths.
export function defectSignature(
  rule: ScanResult["rules"][number]["rule"],
  occurrence: Extract<ScanResult["rules"][number], { state: "evaluated" }>["occurrences"][number],
): string {
  return canonical([
    rule,
    occurrence.evidence.map(({ kind, observed }) => [kind, withoutPaths(observed) ?? null]),
  ]);
}

// Separate versioned view over one raw scan. It never edits the scan, report or gate.
export function buildRepairView(scan: ScanResult, input: ComponentEvidence): ComponentRepairView {
  const evidence = evidenceSchema.parse(input);
  if (
    evidence.scanId !== scan.id ||
    evidence.epoch !== scan.epoch ||
    scan.scope.include.some((target) => target.documentId !== evidence.documentId)
  )
    throw new Error("Component evidence does not match this scan, document and epoch");
  const report = reportScan(scan);
  const issues = new Map<OccurrenceId, IssueId>();
  for (const group of report.groups)
    for (const member of group.members)
      if (member.scanId === scan.id) issues.set(member.occurrenceId, group.id);
  const attributions = new Map(
    evidence.attributions.map((entry) => [canonical(entry.target), entry]),
  );
  const instances = new Map(evidence.instances.map((entry) => [entry.key, entry]));
  const definitions = new Map(evidence.definitions.map((entry) => [entry.key, entry]));
  const callsites = new Map(evidence.callsites.map((entry) => [entry.key, entry]));
  const availability = evidence.availability;
  const scoped = new Map<string, Scoped>();
  const unattributed: UnattributedOccurrence[] = [];
  let violations = 0;
  for (const result of scan.rules) {
    if (result.state !== "evaluated") continue;
    for (const occurrence of result.occurrences) {
      if (occurrence.outcome !== "violation") continue;
      violations++;
      const ref = {
        scanId: scan.id,
        occurrenceId: occurrence.id,
        issueId: issues.get(occurrence.id)!,
      };
      const unmatched = (
        status: UnattributedOccurrence["status"],
        reasons: NonEmpty<Diagnostic>,
        candidates: readonly string[] = [],
      ) => unattributed.push({ ...ref, status, reasons, candidates });
      if (availability.state === "stale") {
        unmatched("stale", availability.gaps);
        continue;
      }
      if (availability.state === "unavailable") {
        unmatched("unavailable", [availability.reason]);
        continue;
      }
      const attribution = attributions.get(canonical(occurrence.target));
      if (!attribution) {
        unmatched("unknown", [
          reason("no-declaration", "No component declaration for this target"),
        ]);
        continue;
      }
      if (attribution.status === "unknown") {
        unmatched("unknown", [attribution.reason], attribution.candidates);
        continue;
      }
      if (attribution.status === "conflicting") {
        unmatched("conflicting", attribution.reasons, attribution.candidates);
        continue;
      }
      const instance = instances.get(attribution.instance);
      if (instance?.status !== "supported") throw new Error("Unsupported attributed instance");
      const definition = definitions.get(instance.definition)!;
      const binding = definition.parts.find(({ key }) => key === attribution.part)!.binding;
      const callsite =
        instance.callsite === undefined ? undefined : callsites.get(instance.callsite);
      let owner: RepairOwner | undefined;
      if (binding.kind === "template")
        owner = { kind: "template", definition: definition.definition };
      else if (binding.kind === "callsite" && callsite)
        owner = { kind: "callsite", callsite: callsite.callsite, caller: callsite.caller };
      else if (binding.kind === "data-record" && instance.record !== undefined)
        owner = {
          kind: "data-record",
          definition: definition.definition,
          record: instance.record,
          field: binding.field,
        };
      if (binding.kind !== "unreviewed" && !owner) {
        unmatched(
          "unknown",
          [reason("owner-undeclared", `Binding needs a declared ${binding.kind} owner`)],
          [instance.key],
        );
        continue;
      }
      const defect = defectSignature(result.rule, occurrence);
      const shared = {
        application: definition.application,
        build: definition.build,
        definition: definition.definition,
        part: attribution.part,
        rule: result.rule,
        defect,
      };
      const scope: Without<RepairScope, "id" | "variants" | "members"> = owner
        ? { ...shared, status: "supported", basis: "reviewed-binding", owner }
        : {
            ...shared,
            status: "suggested",
            basis: "definition-membership",
            owner: { kind: "definition", definition: definition.definition },
          };
      // Every key field must match; no member is admitted through resemblance to another.
      const key = canonical([
        groupingVersion,
        scope.application,
        scope.build,
        scope.definition,
        scope.part,
        scope.owner,
        scope.rule,
        scope.basis,
        scope.defect,
      ]);
      const entry = scoped.get(key) ?? { ...scope, members: [] };
      entry.members.push({
        ...ref,
        instance: instance.key,
        ...(instance.variant === undefined ? {} : { variant: instance.variant }),
        provenance: attribution.provenance,
      });
      scoped.set(key, entry);
    }
  }
  const scopes: RepairScope[] = [...scoped].map(
    ([
      key,
      {
        members: [member, ...others],
        ...scope
      },
    ]) => {
      const declared = [...definitions.values()].find(
        (entry) =>
          entry.application === scope.application &&
          entry.build === scope.build &&
          entry.definition === scope.definition,
      )!;
      const members: NonEmpty<RepairMember> = [member!, ...others];
      const observed = [
        ...new Set(members.flatMap(({ variant }) => (variant === undefined ? [] : [variant]))),
      ].sort();
      return {
        ...scope,
        id: `repair:${key}` as RepairScopeId,
        variants: {
          observed,
          unobserved: declared.variants.filter((variant) => !observed.includes(variant)),
          undeclaredMembers: members.filter(({ variant }) => variant === undefined).length,
        },
        members,
      };
    },
  );
  // Record where one definition/part/rule became several hypotheses, and why.
  const families = new Map<string, RepairScope[]>();
  for (const scope of scopes) {
    const family = canonical([
      scope.application,
      scope.build,
      scope.definition,
      scope.part,
      scope.rule,
    ]);
    families.set(family, [...(families.get(family) ?? []), scope]);
  }
  const splits: RepairSplit[] = [];
  for (const family of families.values()) {
    const [first, second, ...rest] = family;
    if (!first || !second) continue;
    const varies = (field: (scope: RepairScope) => unknown) =>
      new Set(family.map((scope) => canonical(field(scope)))).size > 1;
    const differing = (
      [
        ["owner", (scope: RepairScope) => scope.owner],
        ["defect", (scope: RepairScope) => scope.defect],
        ["basis", (scope: RepairScope) => scope.basis],
      ] as const
    )
      .filter(([, field]) => varies(field))
      .map(([name]) => name);
    const [difference, ...differences] = differing;
    if (!difference) throw new Error("Split scopes must differ in a key field");
    splits.push({
      application: first.application,
      build: first.build,
      definition: first.definition,
      part: first.part,
      rule: first.rule,
      scopes: [first.id, second.id, ...rest.map(({ id }) => id)],
      differing: [difference, ...differences],
    });
  }
  const members = (status: RepairScope["status"]) =>
    scopes
      .filter((scope) => scope.status === status)
      .reduce((total, scope) => total + scope.members.length, 0);
  return {
    schema: "propellr-component-repair-view/1",
    groupingVersion,
    scanId: scan.id,
    evidence: { collector: evidence.collector, resolver: evidence.resolver, availability },
    coverage: { scan: scan.coverage.state },
    counts: {
      violationOccurrences: violations,
      exactViolationIssues: report.counts.uniqueViolationIssues,
      excludedIncompleteOccurrences: report.counts.incompleteOccurrences,
      supportedRepairScopes: scopes.filter(({ status }) => status === "supported").length,
      suggestedRepairScopes: scopes.filter(({ status }) => status === "suggested").length,
      supportedOccurrences: members("supported"),
      suggestedOccurrences: members("suggested"),
      unattributedOccurrences: unattributed.length,
    },
    scopes,
    splits,
    unattributed,
  };
}
