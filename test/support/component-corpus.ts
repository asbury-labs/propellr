import type { Browser } from "playwright";
import type { OccurrenceId, ScanRequest, ScanResult } from "../../src/contracts.js";
import type { ComponentEvidence, ComponentRepairView } from "../../src/components/contracts.js";
import { applyGate, canonical, reportScan } from "../../src/reporting/index.js";
import type { GatePolicy } from "../../src/reporting/index.js";
import { buildRepairView } from "../../src/components/grouping.js";
import { BrowserTarget } from "../../src/host/browser.js";
import { ComponentRegistry, scanComponents } from "../../src/host/components.js";
import { scanTarget } from "../../src/host/scan.js";
import type { Arm, ComponentCase } from "../fixtures/components/cases.js";
import type { ExpectedCase } from "../fixtures/components/oracle.js";
import { fixturePage } from "./parity.js";

export const scanContext = {
  policy: { id: "test", version: "1" },
  configuration: { id: "component-intelligence", version: "1" },
  origin: { kind: "direct" },
} as const;
export const gatePolicy: GatePolicy = {
  id: "local-zero-violations",
  version: "1",
  maxUniqueViolations: 0,
  maxViolationOccurrences: 0,
  exceptions: [],
};
export const request = (target: BrowserTarget, rules: readonly string[]): ScanRequest => ({
  mode: "full",
  scope: {
    include: [{ pageId: target.pageId, documentId: target.documentId, path: [] }],
    exclude: [],
  },
  rules: {
    kind: "explicit",
    rules: [{ id: rules[0]!, options: {} }, ...rules.slice(1).map((id) => ({ id, options: {} }))],
  },
});
const replace = (value: unknown, scan: ScanResult) => {
  const root = scan.scope.include[0];
  return JSON.parse(
    JSON.stringify(value)
      .replaceAll(scan.id, "SCAN")
      .replaceAll(root.pageId, "PAGE")
      .replaceAll(root.documentId, "DOCUMENT"),
  ) as unknown;
};
// Everything authoritative about a scan except its fresh identity and timing.
export const raw = (scan: ScanResult) =>
  replace(
    {
      engine: scan.engine,
      resolvedRules: scan.resolvedRules,
      execution: scan.execution,
      coverage: scan.coverage,
      rules: scan.rules,
    },
    scan,
  );
export const exact = (scan: ScanResult) => {
  const report = reportScan(scan);
  return replace(
    { report, gate: applyGate(scan, report, gatePolicy, "2026-09-23T00:00:00Z").gate },
    scan,
  );
};

export function elementIds(scan: ScanResult): Map<OccurrenceId, string> {
  return new Map(
    scan.rules.flatMap((result) =>
      result.state === "evaluated"
        ? result.occurrences.map(
            (occurrence) =>
              [occurrence.id, occurrence.target.path.at(-1)!.selector.replace(/^#/, "")] as const,
          )
        : [],
    ),
  );
}
const numeric = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });
export function summarize(scan: ScanResult, view: ComponentRepairView) {
  const ids = elementIds(scan);
  return {
    scopes: view.scopes
      .map((scope) => ({
        status: scope.status,
        application: scope.application,
        definition: scope.definition,
        part: scope.part,
        rule: scope.rule.id,
        owner: scope.owner,
        members: scope.members.map(({ occurrenceId }) => ids.get(occurrenceId)!).sort(numeric),
        variants: { observed: scope.variants.observed, unobserved: scope.variants.unobserved },
      }))
      .sort((a, b) =>
        canonical([a.application, a.definition, a.part, a.owner]).localeCompare(
          canonical([b.application, b.definition, b.part, b.owner]),
        ),
      ),
    unattributed: Object.fromEntries(
      view.unattributed
        .map(({ occurrenceId, status }) => [ids.get(occurrenceId)!, status] as const)
        .sort(([a], [b]) => numeric(a, b)),
    ),
    splits: view.splits.length,
  };
}
export function expected(oracle: ExpectedCase): ReturnType<typeof summarize> {
  return {
    scopes: oracle.scopes
      .map((scope) => ({
        status: scope.status,
        application: scope.application,
        definition: scope.definition,
        part: scope.part,
        rule: scope.rule,
        owner: scope.owner,
        members: [...scope.members].sort(numeric),
        variants: scope.variants ?? { observed: [], unobserved: [] },
      }))
      .sort((a, b) =>
        canonical([a.application, a.definition, a.part, a.owner]).localeCompare(
          canonical([b.application, b.definition, b.part, b.owner]),
        ),
      ),
    unattributed: Object.fromEntries(
      Object.entries(oracle.unattributed).sort(([a], [b]) => numeric(a, b)),
    ),
    splits: oracle.splits,
  };
}
// Per-target lookups for reasons, placements and candidate counts.
export const occurrenceOf = (scan: ScanResult, id: string) =>
  scan.rules
    .flatMap((result) => (result.state === "evaluated" ? result.occurrences : []))
    .find((entry) => entry.target.path.at(-1)?.selector === `#${id}`);
export function attributionFor(scan: ScanResult, evidence: ComponentEvidence, id: string) {
  const occurrence = occurrenceOf(scan, id);
  return occurrence
    ? evidence.attributions.find(
        (entry) => canonical(entry.target) === canonical(occurrence.target),
      )
    : undefined;
}
export function tokenOf(scan: ScanResult, evidence: ComponentEvidence, id: string) {
  const attribution = attributionFor(scan, evidence, id);
  const instance =
    attribution?.status === "supported"
      ? evidence.instances.find(({ key }) => key === attribution.instance)
      : undefined;
  return instance?.status === "supported" ? instance.instance : undefined;
}
// Uninstrumented pages must not leak bridge data, classes or manifest identifiers.
export function leaks(fixtureCase: ComponentCase, arm: Arm): string[] {
  const fixture = fixtureCase.render(arm);
  const html = [fixture.html, ...Object.values(fixture.frames ?? {})].join("\n");
  const secrets = fixtureCase.manifests.flatMap((manifest) => [
    manifest.application,
    ...manifest.definitions.flatMap(({ id, displayName, sourceRef }) => [
      id,
      displayName,
      ...(sourceRef ? [sourceRef] : []),
    ]),
    ...manifest.callsites.map(({ id }) => id),
  ]);
  return [
    ...(/data-propellr-/.test(html) ? ["bridge attribute"] : []),
    ...(/\sclass=/.test(html) ? ["class attribute"] : []),
    ...[...new Set(secrets)].filter((secret) => html.includes(secret)),
  ];
}

export interface ArmRun {
  readonly off: ScanResult;
  readonly scan: ScanResult;
  readonly evidence: ComponentEvidence;
  readonly view: ComponentRepairView;
}
// Capture off then on, on the same page and document generation.
export async function runArm(
  browser: Browser,
  fixtureCase: ComponentCase,
  arm: Arm,
): Promise<ArmRun> {
  const { context, page } = await fixturePage(browser, fixtureCase.render(arm));
  const target = new BrowserTarget(page, "borrowed");
  const registry = new ComponentRegistry(fixtureCase.manifests);
  try {
    registry.associate(target, fixtureCase.associate);
    const scanRequest = request(target, fixtureCase.rules);
    const signal = new AbortController().signal;
    const off = await scanTarget(target, scanRequest, scanContext, signal);
    const { scan, evidence } = await scanComponents(
      target,
      scanRequest,
      scanContext,
      signal,
      registry,
    );
    return { off, scan, evidence, view: buildRepairView(scan, evidence) };
  } finally {
    registry.release(target);
    await target.release();
    await context.close();
  }
}
