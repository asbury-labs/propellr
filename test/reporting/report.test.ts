import { describe, expect, test } from "vitest";
import type {
  Occurrence,
  OccurrenceId,
  PageId,
  ScanId,
  ScanResult,
  Target,
} from "../../src/contracts.js";
import { applyGate, reportScan } from "../../src/reporting/index.js";
import { selectedRequest } from "../../src/analysis.js";

const target: Target = { pageId: "page_fixture" as PageId, documentId: "document-1", path: [] };
const rule = { id: "button-name", version: "4.13.0" };
function scan(
  id: string,
  outcomes: readonly {
    selector: string;
    outcome: Occurrence["outcome"];
    page?: string;
    frame?: string;
  }[],
  overrides: Partial<ScanResult> = {},
): ScanResult {
  const occurrences: Occurrence[] = outcomes.map((entry, index) => {
    const base = {
      id: `${id}-${index}` as OccurrenceId,
      target: {
        ...target,
        pageId: (entry.page ?? target.pageId) as PageId,
        path: [
          ...(entry.frame ? [{ kind: "frame" as const, selector: entry.frame }] : []),
          { kind: "element" as const, selector: entry.selector },
        ],
      },
      impact: "critical" as const,
      evidence: [
        {
          kind: "name",
          explanation: "Naming check",
          observed: { hasName: entry.outcome === "pass" },
        },
      ],
    };
    return entry.outcome === "incomplete"
      ? {
          ...base,
          outcome: entry.outcome,
          reason: { code: "name-unsupported", message: "Unsupported naming branch" },
        }
      : { ...base, outcome: entry.outcome };
  });
  const first = occurrences[0];
  return {
    id: id as ScanId,
    epoch: 1,
    origin: { kind: "direct" },
    engine: { id: "propellr-slice", version: "0.1" },
    policy: { id: "fixture", version: "1" },
    configuration: { id: "test", version: "1" },
    scope: selectedRequest(target).scope,
    resolvedRules: [{ rule, options: {} }],
    execution: { requested: "full", actual: "full" },
    coverage: { state: "complete" },
    rules: [
      first
        ? { rule, state: "evaluated", occurrences: [first, ...occurrences.slice(1)] }
        : { rule, state: "inapplicable" },
    ],
    durationMs: 1,
    ...overrides,
  };
}
const violation = { selector: "#save", outcome: "violation" } as const;
const policy = {
  id: "local-gate",
  version: "1",
  maxUniqueViolations: 0,
  maxViolationOccurrences: 0,
  exceptions: [],
};
const now = "2026-09-12T18:00:00Z";

describe("conservative exact-target reporting", () => {
  test("retains every occurrence, separates unrelated targets/pages/frames and counts current scan only", () => {
    const scope = {
      include: [target, { ...target, pageId: "page_other" as PageId }],
      exclude: [],
    } as const;
    const first = scan(
      "s1",
      [
        violation,
        violation,
        { ...violation, selector: "#other" },
        { ...violation, page: "page_other" },
        { ...violation, frame: "#frame" },
      ],
      { scope },
    );
    const second = scan("s2", [violation], { scope });
    const report = reportScan(first);
    expect(report.counts).toEqual({
      violationOccurrences: 5,
      incompleteOccurrences: 0,
      uniqueViolationIssues: 4,
      uniqueIncompleteIssues: 0,
    });
    expect(report.groups.find((group) => group.members.length === 2)).toBeDefined();
    const next = reportScan(second, [first]);
    expect(next.counts.violationOccurrences).toBe(1);
    expect(next.groups.find((group) => group.lifecycle === "existing")?.members).toHaveLength(3);
  });

  test("unchanged identities survive harmless ordering and evidence wording changes; recurrence links history", () => {
    const a = scan("a", [violation]);
    const b = scan("b", [violation]);
    const c = scan("c", [{ ...violation, outcome: "pass" }]);
    const d = scan("d", [violation]);
    expect(reportScan(b, [a]).groups[0]).toMatchObject({
      id: reportScan(a).groups[0]!.id,
      lifecycle: "existing",
    });
    expect(reportScan(c, [a, b]).groups[0]?.lifecycle).toBe("resolved");
    expect(reportScan(d, [a, b, c]).groups[0]).toMatchObject({
      lifecycle: "recurring",
      members: [{ scanId: "a" }, { scanId: "b" }, { scanId: "d" }],
    });
  });

  test.each([
    "partial",
    "stale",
    "narrow",
    "rules",
    "options",
    "configuration",
    "policy",
    "engine",
    "document",
    "incomplete",
    "missing-result",
  ])("%s scan cannot falsely resolve history", (change) => {
    const a = scan("a", [violation]);
    const overrides: Partial<ScanResult> =
      change === "partial" || change === "stale"
        ? { coverage: { state: change, gaps: [{ code: "gap", message: "Unavailable scope" }] } }
        : change === "narrow"
          ? {
              scope: {
                include: [{ ...target, path: [{ kind: "element", selector: "#other" }] }],
                exclude: [],
              },
            }
          : change === "rules"
            ? { resolvedRules: [{ rule: { id: "target-size", version: "4.13.0" }, options: {} }] }
            : change === "options"
              ? { resolvedRules: [{ rule, options: { changed: true } }] }
              : change === "document"
                ? { scope: { include: [{ ...target, documentId: "document-2" }], exclude: [] } }
                : change === "missing-result"
                  ? { rules: [] }
                  : change === "incomplete"
                    ? {}
                    : { [change]: { id: change, version: "2" } };
    const b = scan(
      "b",
      change === "incomplete" ? [{ ...violation, selector: "#other", outcome: "incomplete" }] : [],
      overrides,
    );
    const result = reportScan(b, [a]);
    expect(result.comparison.state).toBe("not-comparable");
    expect(result.groups.some((group) => group.lifecycle === "resolved")).toBe(false);
    const c = { ...b, id: "c" as ScanId };
    const later = reportScan(c, [a, b]);
    expect(
      later.groups.find((group) => group.id === reportScan(a).groups[0]!.id)?.lifecycle,
    ).not.toBe("resolved");
  });

  test("gate thresholds, owner/expiry exceptions and incomplete status never rewrite raw verdicts", () => {
    const raw = scan("a", [violation, violation]);
    const before = JSON.stringify(raw);
    const report = reportScan(raw);
    expect(applyGate(raw, report, policy, now).gate?.decision).toBe("fail");
    expect(
      applyGate(raw, report, { ...policy, maxUniqueViolations: 1, maxViolationOccurrences: 1 }, now)
        .gate?.decision,
    ).toBe("fail");
    const exception = {
      issueId: report.groups[0]!.id,
      owner: "fixture-owner",
      expiresAt: "2026-10-01T00:00:00Z",
    };
    expect(applyGate(raw, report, { ...policy, exceptions: [exception] }, now).gate).toMatchObject({
      decision: "pass",
      reasons: expect.arrayContaining([expect.objectContaining({ code: "exception-applied" })]),
    });
    expect(
      applyGate(
        raw,
        report,
        { ...policy, exceptions: [{ ...exception, expiresAt: "2026-01-01T00:00:00Z" }] },
        now,
      ).gate?.decision,
    ).toBe("fail");
    const partial = {
      ...raw,
      coverage: {
        state: "partial",
        gaps: [{ code: "frame-unavailable", message: "Denied frame" }],
      },
    } as const;
    expect(
      applyGate(partial, reportScan(partial), { ...policy, exceptions: [exception] }, now).gate
        ?.decision,
    ).toBe("indeterminate");
    expect(() =>
      applyGate(raw, report, { ...policy, exceptions: [{ ...exception, owner: "" }] }, now),
    ).toThrow();
    expect(JSON.stringify(raw)).toBe(before);
  });

  test("identity-version changes and out-of-scope occurrences cannot establish complete coverage", () => {
    const first = scan("a", [violation]);
    const oldReport = reportScan(first);
    const prior = {
      ...first,
      report: {
        ...oldReport,
        groups: oldReport.groups.map((group) => ({ ...group, identityVersion: "other/0" })),
      },
    };
    expect(reportScan(scan("b", []), [prior]).comparison.state).toBe("not-comparable");
    const outside = scan("c", [{ ...violation, page: "page_other" }]);
    expect(applyGate(outside, reportScan(outside), policy, now).gate?.decision).toBe(
      "indeterminate",
    );
  });

  test("rejects duplicate identities, oversized histories and forged summary counts", () => {
    const raw = scan("a", [violation]);
    expect(() => reportScan(raw, [raw])).toThrow("Duplicate scan");
    expect(() =>
      reportScan(
        raw,
        Array.from({ length: 33 }, (_, i) => scan(`s${i}`, [])),
      ),
    ).toThrow("history limit");
    expect(() => applyGate(raw, { ...reportScan(raw), groups: [] }, policy, now)).toThrow(
      "membership",
    );
    expect(() =>
      applyGate(
        raw,
        {
          ...reportScan(raw),
          counts: {
            violationOccurrences: 0,
            incompleteOccurrences: 0,
            uniqueViolationIssues: 0,
            uniqueIncompleteIssues: 0,
          },
        },
        policy,
        now,
      ),
    ).toThrow("counts");
  });
});
