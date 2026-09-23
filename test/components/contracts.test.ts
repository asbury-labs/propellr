import { describe, expect, test } from "vitest";
import type {
  Evidence,
  Occurrence,
  OccurrenceId,
  PageId,
  ScanId,
  ScanResult,
  Target,
} from "../../src/contracts.js";
import type {
  ComponentCapture,
  ComponentEvidence,
  ComponentManifest,
} from "../../src/components/contracts.js";
import { componentCollector } from "../../src/analysis.js";
import { resolveEvidence } from "../../src/components/attribution.js";
import { buildRepairView } from "../../src/components/grouping.js";
import { captureSchema, evidenceSchema, manifestSchema } from "../../src/components/validation.js";
import { ComponentRegistry } from "../../src/host/components.js";
import { applyGate, reportScan } from "../../src/reporting/index.js";
import { definition, manifest } from "../fixtures/components/cases.js";
import { gatePolicy } from "../support/component-corpus.js";

const storefront = { application: "storefront", build: "b1" } as const;
const template = { kind: "template" } as const;
const approved: ComponentManifest = manifestSchema.parse(
  manifest(
    storefront,
    [
      definition(
        "ProductCard",
        { favorite: template, image: { kind: "data-record", field: "alt" } },
        ["desktop"],
        "src/ProductCard.vue",
      ),
      definition("Tile", { favorite: template }),
      definition("IconButton", { control: { kind: "callsite" } }),
      definition("Row", {}),
      definition("Wishlist", { control: { kind: "unreviewed" } }),
    ],
    [
      { id: "row-remove", caller: "Row", renders: "IconButton" },
      { id: "tile-remove", caller: "Tile", renders: "IconButton" },
    ],
  ),
);
const at = (selector: string, frame?: string): Target => ({
  pageId: "page_fixture" as PageId,
  documentId: "document-1",
  path: [
    ...(frame ? [{ kind: "frame" as const, selector: frame }] : []),
    { kind: "element" as const, selector },
  ],
});
const capture = (fields: Partial<ComponentCapture> = {}): ComponentCapture => ({
  schema: "propellr-component-capture/1",
  collector: componentCollector,
  visits: 0,
  instances: [],
  parts: [],
  containment: [],
  malformed: [],
  omitted: [],
  gaps: [],
  ...fields,
});
const root = (
  selector: string,
  definitionId: string,
  instance: string,
  extra: Record<string, string> = {},
  frame?: string,
) => ({ target: at(selector, frame), ...storefront, definition: definitionId, instance, ...extra });
const part = (selector: string, key: string, owner?: string, frame?: string) =>
  owner === undefined
    ? { target: at(selector, frame), part: key }
    : { target: at(selector, frame), part: key, owner, placement: "contained" as const };
const missingName: Evidence = {
  kind: "name",
  observed: { hasName: false, source: "none" },
  expected: { hasName: true },
  explanation: "Supported naming checks",
};
function scan(
  entries: readonly {
    selector: string;
    frame?: string;
    outcome?: Occurrence["outcome"];
    evidence?: Evidence;
  }[],
  overrides: Partial<ScanResult> = {},
): ScanResult {
  const rule = { id: "button-name", version: "4.13.0" };
  const occurrences: Occurrence[] = entries.map(
    ({ selector, frame, outcome = "violation", evidence }, index) => {
      const base = {
        id: `button-name:${index + 1}` as OccurrenceId,
        target: at(selector, frame),
        impact: "critical" as const,
        evidence: [evidence ?? missingName],
      };
      return outcome === "incomplete"
        ? { ...base, outcome, reason: { code: "unsupported-evidence", message: "Unsupported" } }
        : { ...base, outcome };
    },
  );
  const [first, ...rest] = occurrences;
  return {
    id: "scan_test-1" as ScanId,
    epoch: 1,
    origin: { kind: "direct" },
    engine: { id: "propellr-slice", version: "0.3" },
    policy: { id: "test", version: "1" },
    configuration: { id: "test", version: "1" },
    scope: { include: [{ ...at("x"), path: [] }], exclude: [] },
    resolvedRules: [{ rule, options: {} }],
    execution: { requested: "full", actual: "full" },
    coverage: { state: "complete" },
    rules: [
      first
        ? { rule, state: "evaluated", occurrences: [first, ...rest] }
        : { rule, state: "inapplicable" },
    ],
    durationMs: 1,
    ...overrides,
  };
}
const resolve = (
  value: ComponentCapture,
  options: {
    scan?: ScanResult;
    associated?: readonly { application: string; build: string }[];
  } = {},
) =>
  resolveEvidence({
    scan: options.scan ?? scan([]),
    documentId: "document-1",
    capture: { ok: true, value: captureSchema.parse(value) },
    manifests: [
      approved,
      manifestSchema.parse(
        manifest({ application: "outlet", build: "o1" }, [
          definition("ProductCard", { favorite: template }),
        ]),
      ),
    ],
    associated: options.associated ?? [storefront],
  });
const codes = (evidence: ComponentEvidence, token: string) => {
  const instance = evidence.instances.find((entry) =>
    entry.status === "supported" ? entry.instance === token : entry.declared.instance === token,
  );
  return instance?.status === "conflicting" ? instance.reasons.map(({ code }) => code) : [];
};
const attribution = (evidence: ComponentEvidence, selector: string, frame?: string) =>
  evidence.attributions.find(
    (entry) => JSON.stringify(entry.target) === JSON.stringify(at(selector, frame)),
  );

describe("manifest boundary", () => {
  test("accepts approved manifests and rejects unknown, duplicate or dangling entries", () => {
    const valid = manifest(
      storefront,
      [definition("Card", { control: template })],
      [{ id: "site", caller: "Card", renders: "Card" }],
    );
    expect(manifestSchema.parse(valid).definitions).toHaveLength(1);
    for (const invalid of [
      { ...valid, extra: true },
      { ...valid, schema: "propellr-component-manifest/2" },
      { ...valid, definitions: [] },
      { ...valid, definitions: [...valid.definitions, ...valid.definitions] },
      { ...valid, callsites: [{ id: "site", caller: "Missing", renders: "Card" }] },
      { ...valid, callsites: [...valid.callsites, ...valid.callsites] },
      { ...valid, application: "bad token" },
      { ...valid, definitions: [{ ...valid.definitions[0]!, variants: ["a", "a"] }] },
      {
        ...valid,
        definitions: [
          { ...valid.definitions[0]!, variants: Array.from({ length: 33 }, (_, i) => `v${i}`) },
        ],
      },
      {
        ...valid,
        definitions: [
          { ...valid.definitions[0]!, parts: [{ key: "control", binding: { kind: "guess" } }] },
        ],
      },
      {
        ...valid,
        definitions: [
          {
            ...valid.definitions[0]!,
            parts: [{ key: "control", binding: { kind: "data-record" } }],
          },
        ],
      },
    ])
      expect(manifestSchema.safeParse(invalid).success, JSON.stringify(invalid).slice(0, 120)).toBe(
        false,
      );
  });

  test("source references stay relative POSIX paths without traversal or schemes", () => {
    const withSource = (sourceRef: string) =>
      manifestSchema.safeParse(manifest(storefront, [definition("Card", {}, [], sourceRef)]))
        .success;
    expect(withSource("src/cards/Card.vue")).toBe(true);
    for (const path of [
      "/etc/passwd",
      "../outside.vue",
      "src/../x.vue",
      "src//x.vue",
      "./x.vue",
      "C:\\x.vue",
      "file:x.vue",
      "a\0b",
    ])
      expect(withSource(path), path).toBe(false);
  });

  test("registry approves at most 16 unique builds and rejects invalid manifests", () => {
    const build = (index: number) =>
      manifest({ application: "app", build: `b${index}` }, [definition("Card", {})]);
    expect(
      new ComponentRegistry(Array.from({ length: 16 }, (_, i) => build(i))).manifests,
    ).toHaveLength(16);
    expect(() => new ComponentRegistry(Array.from({ length: 17 }, (_, i) => build(i)))).toThrow(
      "16",
    );
    expect(() => new ComponentRegistry([build(1), build(1)])).toThrow("Duplicate");
    expect(() => new ComponentRegistry([{ ...build(1), definitions: [] }])).toThrow();
  });
});

describe("capture boundary", () => {
  test("rejects free text, inconsistent placement, bad tokens and oversize captures", () => {
    expect(captureSchema.safeParse(capture()).success).toBe(true);
    for (const invalid of [
      { ...capture(), text: "Product name" },
      capture({ parts: [{ target: at("#a"), part: "favorite", placement: "contained" }] }),
      capture({ parts: [{ target: at("#a"), part: "favorite", owner: "p0" }] }),
      capture({ instances: [root("#a", "Card", "bad token")] }),
      capture({
        instances: Array.from({ length: 257 }, (_, i) => root(`#a${i}`, "Card", `p${i}`)),
      }),
      capture({ containment: [{ target: at("#a"), candidates: [], truncated: false }] }),
      capture({ visits: 2001 }),
      capture({
        malformed: Array.from({ length: 1200 }, (_, i) => ({
          target: at(`#${"x".repeat(100)}${i}`),
          attributes: ["data-propellr-owner"],
        })),
      }),
    ])
      expect(captureSchema.safeParse(invalid).success).toBe(false);
  });
});

describe("attribution resolution", () => {
  test("forged, unassociated and inconsistent declarations never become supported", () => {
    const evidence = resolve(
      capture({
        instances: [
          root("#a", "ProductCard", "unapproved", { build: "b2" }),
          root("#b", "ProductCard", "outlet", { application: "outlet", build: "o1" }),
          root("#c", "AdminPanel", "unknown"),
          root("#d", "ProductCard", "tablet", { variant: "tablet" }),
          root("#e", "ProductCard", "wrong-site", { callsite: "row-remove" }),
          root("#f", "ProductCard", "orphan", { parent: "nobody" }),
          root("#g", "ProductCard", "self", { parent: "self" }),
          root("#h", "Tile", "tile"),
          root("#i", "IconButton", "caller-mismatch", { parent: "tile", callsite: "row-remove" }),
          root("#j", "IconButton", "bad-parent", { parent: "unknown", callsite: "row-remove" }),
          root("#k", "ProductCard", "dup"),
          root("#l", "ProductCard", "dup", { variant: "desktop" }),
        ],
        parts: [
          part("#p1", "favorite", "unknown"),
          part("#p2", "favorite", "ghost"),
          part("#p3", "missing-part", "tile"),
          part("#p4", "favorite"),
          part("#p5", "favorite", "tile"),
        ],
        malformed: [{ target: at("#m"), attributes: ["data-propellr-owner"] }],
        containment: [{ target: at("#p4"), candidates: ["tile", "dup"], truncated: false }],
      }),
    );
    expect(evidenceSchema.parse(evidence)).toEqual(evidence);
    expect(codes(evidence, "unapproved")).toEqual(["unapproved-build"]);
    expect(codes(evidence, "outlet")).toEqual(["unassociated-build"]);
    expect(codes(evidence, "unknown")).toEqual(["unknown-definition"]);
    expect(codes(evidence, "tablet")).toEqual(["unknown-variant"]);
    expect(codes(evidence, "wrong-site")).toEqual(["callsite-mismatch"]);
    expect(codes(evidence, "orphan")).toEqual(["parent-missing"]);
    expect(codes(evidence, "self")).toEqual(["parent-missing"]);
    expect(codes(evidence, "caller-mismatch")).toEqual(["callsite-mismatch"]);
    expect(codes(evidence, "bad-parent")).toEqual(["parent-conflicting"]);
    expect(codes(evidence, "dup")).toEqual(["instance-declaration-conflict"]);
    expect(attribution(evidence, "#p1")).toMatchObject({
      status: "conflicting",
      reasons: [{ code: "owner-conflicting" }],
    });
    expect(attribution(evidence, "#p2")).toMatchObject({
      status: "conflicting",
      reasons: [{ code: "owner-missing" }],
    });
    expect(attribution(evidence, "#p3")).toMatchObject({
      status: "conflicting",
      reasons: [{ code: "unknown-part" }],
    });
    // Ownerless part inside two roots stays ambiguous: both candidates, no membership.
    expect(attribution(evidence, "#p4")).toMatchObject({
      status: "unknown",
      reason: { code: "ownership-uncertain" },
    });
    expect(
      attribution(evidence, "#p4")?.status === "unknown" && attribution(evidence, "#p4"),
    ).toMatchObject({ candidates: [expect.any(String), expect.any(String)] });
    expect(attribution(evidence, "#p5")).toMatchObject({
      status: "supported",
      part: "favorite",
      provenance: "declared",
    });
    expect(attribution(evidence, "#m")).toMatchObject({
      status: "conflicting",
      reasons: [{ code: "malformed-declaration" }],
    });
    expect(evidence.availability).toEqual({ state: "complete" });
  });

  test("parent conflicts propagate regardless of declaration order", () => {
    // The child precedes a parent that only fails the callsite-caller check against Tile.
    const value = scan([{ selector: "#x" }]);
    const evidence = resolve(
      capture({
        instances: [
          root("#c", "ProductCard", "child", { parent: "ib" }),
          root("#g", "Tile", "tile"),
          root("#ib", "IconButton", "ib", { parent: "tile", callsite: "row-remove" }),
          root("#gc", "ProductCard", "grandchild", { parent: "child" }),
        ],
        parts: [part("#x", "favorite", "grandchild")],
      }),
      { scan: value },
    );
    expect(codes(evidence, "ib")).toEqual(["callsite-mismatch"]);
    expect(codes(evidence, "child")).toEqual(["parent-conflicting"]);
    expect(codes(evidence, "grandchild")).toEqual(["parent-conflicting"]);
    expect(evidenceSchema.parse(evidence)).toEqual(evidence);
    expect(buildRepairView(value, evidence).unattributed).toMatchObject([
      { status: "conflicting", reasons: [{ code: "owner-conflicting" }] },
    ]);
  });

  test("tokens are document-scoped, identical roots form fragments and manifests set provenance", () => {
    const evidence = resolve(
      capture({
        instances: [
          root("#a", "ProductCard", "p0"),
          root("#b", "ProductCard", "p0"),
          root("#c", "ProductCard", "p0", { application: "outlet", build: "o1" }, "#frame"),
        ],
        parts: [part("#x", "favorite", "p0"), part("#y", "favorite", "p0", "#frame")],
      }),
      { associated: [storefront, { application: "outlet", build: "o1" }] },
    );
    const [main, frame] = evidence.instances;
    expect(main).toMatchObject({
      status: "supported",
      instance: "p0",
      provenance: "source-linked",
    });
    expect(main?.roots).toHaveLength(2);
    expect(frame).toMatchObject({ status: "supported", instance: "p0", provenance: "declared" });
    expect(evidence.definitions.map(({ application }) => application)).toEqual([
      "storefront",
      "outlet",
    ]);
    expect(attribution(evidence, "#y", "#frame")).toMatchObject({
      status: "supported",
      instance: frame?.key,
    });
    // Source references never leave the host registry.
    expect(JSON.stringify(evidence)).not.toContain("ProductCard.vue");
  });

  test("stale scans, foreign targets and dropped captures carry no identity", () => {
    const declared = capture({
      instances: [root("#a", "Tile", "t0")],
      parts: [part("#b", "favorite", "t0")],
    });
    const stale = resolve(declared, {
      scan: scan([], {
        coverage: { state: "stale", gaps: [{ code: "scan-stale", message: "Changed" }] },
      }),
    });
    expect(stale.availability.state).toBe("stale");
    expect([...stale.instances, ...stale.attributions]).toEqual([]);
    const foreign = resolve(
      capture({
        instances: [
          { ...root("#a", "Tile", "t0"), target: { ...at("#a"), documentId: "document-2" } },
        ],
      }),
    );
    expect(foreign.availability).toMatchObject({
      state: "unavailable",
      reason: { code: "component-capture-invalid" },
    });
    const dropped = resolve(
      capture({ gaps: [{ code: "component-evidence-limit", message: "Too large" }] }),
    );
    expect(dropped.availability).toMatchObject({
      state: "unavailable",
      reason: { code: "component-evidence-limit" },
    });
    const partial = resolve(
      capture({ ...declared, gaps: [{ code: "component-visit-limit", message: "Budget" }] }),
    );
    expect(partial.availability).toMatchObject({
      state: "partial",
      gaps: [{ code: "component-visit-limit" }],
    });
    expect(partial.attributions).toHaveLength(1);
  });
});

describe("evidence boundary", () => {
  const good = resolve(
    capture({ instances: [root("#a", "Tile", "t0")], parts: [part("#b", "favorite", "t0")] }),
  );
  test("rejects dangling references, undeclared parts and stale attributions", () => {
    expect(evidenceSchema.safeParse(good).success).toBe(true);
    const [instance] = good.instances;
    const [supported] = good.attributions;
    for (const invalid of [
      { ...good, extra: 1 },
      { ...good, textCapture: "enabled" },
      { ...good, attributions: [{ ...supported!, part: "undeclared" }] },
      { ...good, attributions: [{ ...supported!, instance: "i9" }] },
      { ...good, attributions: [supported!, supported!] },
      {
        ...good,
        attributions: [
          {
            target: at("#z"),
            status: "unknown",
            reason: { code: "x", message: "" },
            candidates: ["i7"],
          },
        ],
      },
      { ...good, attributions: [{ target: at("#z"), status: "inferred" }] },
      { ...good, instances: [{ ...instance!, definition: "d9" }] },
      { ...good, instances: [{ ...instance!, variant: "undeclared" }] },
      { ...good, instances: [{ ...instance!, parent: "i0" }], attributions: [] },
      { ...good, availability: { state: "stale", gaps: [{ code: "scan-stale", message: "" }] } },
      { ...good, availability: { state: "partial", gaps: [] } },
      { ...good, documentId: "document-2" },
      { ...good, scanId: "operation_1" },
    ])
      expect(evidenceSchema.safeParse(invalid).success, JSON.stringify(invalid).slice(-200)).toBe(
        false,
      );
  });
});

describe("repair view", () => {
  const instances = [
    root("#p", "ProductCard", "p0", { record: "sku-1" }),
    root("#q", "Tile", "t0"),
    root("#r1", "Row", "r1"),
    root("#r2", "Row", "r2"),
    root("#ib1", "IconButton", "ib1", { parent: "r1", callsite: "row-remove" }),
    root("#ib2", "IconButton", "ib2", { parent: "q-missing" }),
    root("#ib3", "IconButton", "ib3", { parent: "t0", callsite: "tile-remove" }),
    root("#ib4", "IconButton", "ib4"),
    root("#w", "Wishlist", "w0"),
  ];
  test("admits members only by exact common owner; similarity is never transitive", () => {
    // A belongs to ProductCard, C to Tile. B resembles both but its declaration conflicts.
    const value = scan([{ selector: "#a" }, { selector: "#b" }, { selector: "#c" }]);
    const evidence = resolve(
      capture({
        instances: instances.slice(0, 2),
        parts: [part("#a", "favorite", "p0"), part("#c", "favorite", "t0")],
        malformed: [{ target: at("#b"), attributes: ["data-propellr-owner"] }],
        containment: [{ target: at("#b"), candidates: ["p0", "t0"], truncated: false }],
      }),
      { scan: value },
    );
    const view = buildRepairView(value, evidence);
    expect(
      view.scopes.map((scope) => [
        scope.definition,
        scope.members.map(({ occurrenceId }) => occurrenceId),
      ]),
    ).toEqual([
      ["ProductCard", ["button-name:1"]],
      ["Tile", ["button-name:3"]],
    ]);
    expect(view.unattributed).toMatchObject([
      { occurrenceId: "button-name:2", status: "conflicting", candidates: ["i0", "i1"] },
    ]);
    expect(view.counts).toMatchObject({
      violationOccurrences: 3,
      supportedRepairScopes: 2,
      supportedOccurrences: 2,
      unattributedOccurrences: 1,
    });
  });

  test("splits one renderer by caller and defect, suggests unreviewed membership and never guesses owners", () => {
    const aria: Evidence = {
      ...missingName,
      observed: { hasName: false, source: "aria-labelledby" },
    };
    const value = scan([
      { selector: "#ib1" },
      { selector: "#ib3" },
      { selector: "#ib3b", evidence: aria },
      { selector: "#ib4" },
      { selector: "#w" },
      { selector: "#img" },
      { selector: "#pending", outcome: "incomplete" },
      { selector: "#passing", outcome: "pass" },
    ]);
    const evidence = resolve(
      capture({
        instances: [
          ...instances,
          root("#ib3b", "IconButton", "ib3b", { parent: "t0", callsite: "tile-remove" }),
        ],
        parts: [
          part("#ib1", "control", "ib1"),
          part("#ib3", "control", "ib3"),
          part("#ib3b", "control", "ib3b"),
          part("#ib4", "control", "ib4"),
          part("#w", "control", "w0"),
          part("#img", "image", "p0"),
          part("#pending", "favorite", "t0"),
          part("#passing", "favorite", "t0"),
        ],
      }),
      { scan: value },
    );
    const view = buildRepairView(value, evidence);
    const owners = view.scopes.map(({ status, owner }) => [status, owner]);
    expect(owners).toEqual([
      ["supported", { kind: "callsite", callsite: "row-remove", caller: "Row" }],
      ["supported", { kind: "callsite", callsite: "tile-remove", caller: "Tile" }],
      ["supported", { kind: "callsite", callsite: "tile-remove", caller: "Tile" }],
      ["suggested", { kind: "definition", definition: "Wishlist" }],
      [
        "supported",
        { kind: "data-record", definition: "ProductCard", record: "sku-1", field: "alt" },
      ],
    ]);
    expect(view.splits).toEqual([
      expect.objectContaining({
        definition: "IconButton",
        part: "control",
        differing: ["owner", "defect"],
      }),
    ]);
    expect(view.splits[0]?.scopes).toHaveLength(3);
    // IconButton ib4 has a callsite binding but no declared caller: unknown, not blamed.
    expect(view.unattributed).toMatchObject([
      { status: "unknown", reasons: [{ code: "owner-undeclared" }] },
    ]);
    expect(view.counts).toEqual({
      violationOccurrences: 6,
      exactViolationIssues: 6,
      excludedIncompleteOccurrences: 1,
      supportedRepairScopes: 4,
      suggestedRepairScopes: 1,
      supportedOccurrences: 4,
      suggestedOccurrences: 1,
      unattributedOccurrences: 1,
    });
    expect(view.scopes.find(({ owner }) => owner.kind === "data-record")?.variants).toEqual({
      observed: [],
      unobserved: ["desktop"],
      undeclaredMembers: 1,
    });
  });

  test("target paths never split a mechanism; related label paths are excluded from defects", () => {
    const naming = (related: string): Evidence => ({
      kind: "naming-checks",
      observed: {
        any: [
          {
            id: "explicit-label",
            result: false,
            related: [[{ kind: "element", selector: related }]],
          },
        ],
        none: [],
      },
      expected: { any: true, none: false },
      explanation: "Bounded canonical check combination",
    });
    const value = scan([
      { selector: "#a", evidence: naming("#la") },
      { selector: "#b", evidence: naming("#lb") },
    ]);
    const evidence = resolve(
      capture({
        instances: [root("#t", "Tile", "t0")],
        parts: [part("#a", "favorite", "t0"), part("#b", "favorite", "t0")],
      }),
      { scan: value },
    );
    expect(buildRepairView(value, evidence).scopes).toHaveLength(1);
  });

  test("exact report and gate are unchanged, inputs are not mutated and mismatches are rejected", () => {
    const value = scan([{ selector: "#a" }, { selector: "#b", outcome: "incomplete" }]);
    const evidence = resolve(
      capture({ instances: [root("#t", "Tile", "t0")], parts: [part("#a", "favorite", "t0")] }),
      { scan: value },
    );
    const freeze = <T>(input: T): T => {
      if (input && typeof input === "object") {
        for (const entry of Object.values(input)) freeze(entry);
        Object.freeze(input);
      }
      return input;
    };
    const before = JSON.stringify({
      report: reportScan(value),
      gate: applyGate(value, reportScan(value), gatePolicy, "2026-09-23T00:00:00Z"),
    });
    const view = buildRepairView(freeze(value), freeze(evidence));
    expect(
      JSON.stringify({
        report: reportScan(value),
        gate: applyGate(value, reportScan(value), gatePolicy, "2026-09-23T00:00:00Z"),
      }),
    ).toBe(before);
    expect(view.scopes[0]?.members[0]?.issueId).toBe(reportScan(value).groups[0]?.id);
    expect(JSON.stringify(view)).not.toContain("ProductCard.vue");
    expect(() => buildRepairView({ ...value, id: "scan_other" as ScanId }, evidence)).toThrow(
      "does not match",
    );
    expect(() => buildRepairView({ ...value, epoch: 2 }, evidence)).toThrow("does not match");
    expect(() =>
      buildRepairView(
        {
          ...value,
          scope: { include: [{ ...at("x"), documentId: "document-2", path: [] }], exclude: [] },
        },
        evidence,
      ),
    ).toThrow("does not match");
  });

  test("stale and unavailable evidence leave every violation unattributed", () => {
    const value = scan([{ selector: "#a" }, { selector: "#b" }]);
    for (const evidence of [
      resolve(capture(), {
        scan: {
          ...value,
          coverage: { state: "stale", gaps: [{ code: "scan-stale", message: "Changed" }] },
        },
      }),
      resolveEvidence({
        scan: value,
        documentId: "document-1",
        capture: { ok: false, reason: { code: "component-capture-unavailable", message: "None" } },
        manifests: [approved],
        associated: [],
      }),
    ]) {
      const view = buildRepairView(value, evidence);
      expect(view.scopes).toEqual([]);
      expect(view.unattributed.map(({ status }) => status)).toEqual(
        Array(2).fill(evidence.availability.state),
      );
    }
  });
});
