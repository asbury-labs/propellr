import type {
  Diagnostic,
  IssueGroup,
  IssueId,
  Occurrence,
  Report,
  ScanResult,
} from "../contracts.js";
import { z } from "zod";

export const identityVersion = "exact-document-target/1";
// Boundary schema; never imported by browser analysis. No vendor or database dependency.
export const gatePolicySchema = z.strictObject({
  id: z.string().min(1),
  version: z.string().min(1),
  maxUniqueViolations: z.number().int().nonnegative(),
  maxViolationOccurrences: z.number().int().nonnegative(),
  exceptions: z.array(
    z.strictObject({
      issueId: z.string().min(1),
      owner: z.string().min(1),
      expiresAt: z.iso.datetime(),
    }),
  ),
});
export type GatePolicy = z.infer<typeof gatePolicySchema>;
// Stable key encoding shared by exact reporting and separate component views.
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`)
      .join(",")}}`;
  return JSON.stringify(value) ?? "null";
}
const occurrences = (scan: ScanResult) =>
  scan.rules.flatMap((result) =>
    result.state === "evaluated"
      ? result.occurrences.map((occurrence) => ({ rule: result.rule, occurrence }))
      : [],
  );
const issueKey = (rule: IssueGroup["rule"], occurrence: Occurrence) =>
  canonical([identityVersion, rule, occurrence.target]);
function complete(scan: ScanResult): boolean {
  const inScope = occurrences(scan).every(({ occurrence }) => {
    const matches = (target: ScanResult["scope"]["include"][number]) =>
      target.pageId === occurrence.target.pageId &&
      target.documentId === occurrence.target.documentId &&
      target.path.length <= occurrence.target.path.length &&
      target.path.every(
        (step, index) => canonical(step) === canonical(occurrence.target.path[index]),
      );
    return scan.scope.include.some(matches) && !scan.scope.exclude.some(matches);
  });
  const resolved = scan.resolvedRules.map(({ rule }) => canonical(rule)).sort();
  const evaluated = scan.rules.map(({ rule }) => canonical(rule)).sort();
  return (
    inScope &&
    scan.coverage.state === "complete" &&
    canonical(resolved) === canonical(evaluated) &&
    new Set(resolved).size === resolved.length &&
    scan.rules.every((rule) => rule.state !== "not-evaluated") &&
    !occurrences(scan).some(({ occurrence }) => occurrence.outcome === "incomplete")
  );
}
function compatible(a: ScanResult, b: ScanResult): boolean {
  return (
    ![a, b].some((scan) =>
      scan.report?.groups.some((group) => group.identityVersion !== identityVersion),
    ) &&
    complete(a) &&
    complete(b) &&
    canonical([
      a.engine,
      a.policy,
      a.configuration,
      a.scope,
      [...a.resolvedRules].sort((a, b) => a.rule.id.localeCompare(b.rule.id)),
    ]) ===
      canonical([
        b.engine,
        b.policy,
        b.configuration,
        b.scope,
        [...b.resolvedRules].sort((a, b) => a.rule.id.localeCompare(b.rule.id)),
      ])
  );
}

// Caller supplies bounded raw history. Exact identity only; no inferred shared causes.
export function reportScan(scan: ScanResult, history: readonly ScanResult[] = []): Report {
  if (history.length > 32) throw new Error("Reporting history limit exceeded");
  const scans = [...history, scan];
  if (new Set(scans.map((scan) => scan.id)).size !== scans.length)
    throw new Error("Duplicate scan IDs");
  for (const entry of scans) {
    const ids = occurrences(entry).map(({ occurrence }) => occurrence.id);
    if (new Set(ids).size !== ids.length) throw new Error("Duplicate occurrence IDs");
  }
  const scansById = new Map(scans.map((entry) => [entry.id, entry]));
  const membersCompatible = (group: IssueGroup, current: ScanResult) =>
    group.members.every((member) => compatible(scansById.get(member.scanId)!, current));
  const groups = new Map<string, IssueGroup>();
  const lastObserved = new Map<string, ScanResult>();
  const active = new Set<string>();
  for (let index = 0; index < scans.length; index++) {
    const current = scans[index]!;
    const previous = scans[index - 1];
    const comparable = previous !== undefined && compatible(previous, current);
    const currentKeys = new Set<string>();
    for (const { rule, occurrence } of occurrences(current)) {
      if (occurrence.outcome === "pass") continue;
      const key = issueKey(rule, occurrence);
      currentKeys.add(key);
      const prior = groups.get(key);
      const member = { scanId: current.id, occurrenceId: occurrence.id };
      groups.set(key, {
        id: `issue:${key}` as IssueId,
        rule,
        members: prior ? [...prior.members, member] : [member],
        identityVersion,
        groupingBasis:
          "Exact rule version and scoped target within the same document generation; no shared-cause inference",
        lifecycle:
          lastObserved.get(key)?.id === current.id
            ? prior!.lifecycle
            : prior
              ? comparable && membersCompatible(prior, current)
                ? active.has(key)
                  ? "existing"
                  : "recurring"
                : "not-compared"
              : "new",
      });
      lastObserved.set(key, current);
    }
    // Adjacent scans may agree with each other but omit an older issue's scope/configuration.
    for (const [key, group] of groups)
      if (!currentKeys.has(key))
        groups.set(key, {
          ...group,
          lifecycle: comparable && membersCompatible(group, current) ? "resolved" : "not-compared",
        });
    active.clear();
    for (const key of currentKeys) active.add(key);
  }
  const raw = occurrences(scan);
  const keys = (outcome: Occurrence["outcome"]) =>
    new Set(
      raw
        .filter(({ occurrence }) => occurrence.outcome === outcome)
        .map(({ rule, occurrence }) => issueKey(rule, occurrence)),
    ).size;
  const previous = history.at(-1);
  return {
    counts: {
      violationOccurrences: raw.filter(({ occurrence }) => occurrence.outcome === "violation")
        .length,
      incompleteOccurrences: raw.filter(({ occurrence }) => occurrence.outcome === "incomplete")
        .length,
      uniqueViolationIssues: keys("violation"),
      uniqueIncompleteIssues: keys("incomplete"),
    },
    groups: [...groups.values()],
    comparison: !previous
      ? { state: "not-compared" }
      : compatible(previous, scan)
        ? { state: "comparable", baseline: [previous.id] }
        : {
            state: "not-comparable",
            reason: {
              code: "coverage-incompatible",
              message:
                "Incomplete or changed scope, document, rule, engine, policy or configuration; no resolution inferred",
            },
          },
  };
}

export function applyGate(
  scan: ScanResult,
  report: Report,
  input: GatePolicy,
  now: string,
): Report {
  const policy = gatePolicySchema.parse(input);
  const timestamp = Date.parse(now);
  if (!Number.isFinite(timestamp)) throw new Error("Invalid gate time");
  // Recompute membership/counts rather than trusting a caller's summary to weaken enforcement.
  const current = reportScan(scan);
  if (canonical(current.counts) !== canonical(report.counts))
    throw new Error("Report counts do not match raw scan");
  const membership = (report: Report) =>
    report.groups
      .flatMap((group) =>
        group.members
          .filter((member) => member.scanId === scan.id)
          .map((member) => canonical([group.id, group.rule, group.identityVersion, member])),
      )
      .sort();
  if (canonical(membership(current)) !== canonical(membership(report)))
    throw new Error("Report membership does not match raw scan");
  const reasons: Diagnostic[] = [];
  const waived = new Set<string>();
  for (const exception of policy.exceptions) {
    const valid = Date.parse(exception.expiresAt) > timestamp;
    const matched = current.groups.some((group) => group.id === exception.issueId);
    if (valid && matched) waived.add(exception.issueId);
    reasons.push({
      code: !valid ? "exception-expired" : matched ? "exception-applied" : "exception-unmatched",
      message: `${exception.issueId}; owner=${exception.owner}; expiry=${exception.expiresAt}`,
    });
  }
  const violations = occurrences(scan).filter(
    ({ rule, occurrence }) =>
      occurrence.outcome === "violation" && !waived.has(`issue:${issueKey(rule, occurrence)}`),
  );
  const unique = new Set(violations.map(({ rule, occurrence }) => issueKey(rule, occurrence))).size;
  const failed =
    unique > policy.maxUniqueViolations || violations.length > policy.maxViolationOccurrences;
  const incomplete = !complete(scan);
  reasons.unshift({
    code: incomplete ? "incomplete-scan" : failed ? "threshold-exceeded" : "within-thresholds",
    message: `Unwaived unique=${unique}/${policy.maxUniqueViolations}; occurrences=${violations.length}/${policy.maxViolationOccurrences}; completeness=${!incomplete}`,
  });
  return {
    ...report,
    gate: {
      policy: { id: policy.id, version: policy.version },
      decision: incomplete ? "indeterminate" : failed ? "fail" : "pass",
      reasons: [reasons[0]!, ...reasons.slice(1)],
    },
  };
}
