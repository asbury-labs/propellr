// Phase 2 evaluator: instrumented arm is the oracle only; the trial sees the uninstrumented arm.
import type { Browser } from "playwright";
import type { OccurrenceId, ScanResult } from "../../src/contracts.js";
import type { StructureCapture } from "../../src/components/contracts.js";
import { decisionCase, discoverTemplates } from "../../src/components/discovery.js";
import { defectSignature } from "../../src/components/grouping.js";
import type { DecisionResult } from "../../src/host/component-decisions.js";
import type { TemplateCandidate, TemplateDiscovery } from "../../src/components/discovery.js";
import { canonical } from "../../src/reporting/index.js";
import { BrowserTarget } from "../../src/host/browser.js";
import { ComponentRegistry, scanComponents } from "../../src/host/components.js";
import type { CorpusFamily } from "../fixtures/components/corpus.js";
import { raw, request, runArm, scanContext } from "./component-corpus.js";
import { fixturePage } from "./parity.js";

export interface CaseOutcome {
  readonly family: string;
  readonly target: string;
  readonly path: string;
  readonly rule: string;
  readonly defect: string;
  readonly truthRoots: readonly string[];
  readonly candidateHit: boolean;
  readonly decided: boolean;
  readonly correct: boolean;
  readonly truthScope: string;
  readonly group: string | null;
}
export interface FamilyRun {
  readonly family: string;
  readonly split: CorpusFamily["split"];
  readonly rawEqual: boolean;
  // Both arms complete and every violation has oracle truth; otherwise nothing is scored.
  readonly complete: boolean;
  readonly structure: StructureCapture;
  readonly discovery: TemplateDiscovery;
  readonly cases: readonly CaseOutcome[];
}
// Arms load separate pages; identity across them is the target path, never page/document IDs.
const pathKey = (target: { readonly path: unknown }) => canonical(target.path);
// One element can violate several rules; each (rule, path) is its own decision case.
const caseKey = (rule: string, target: { readonly path: unknown }) =>
  canonical([rule, target.path]);
const violationsByRule = (scan: ScanResult) =>
  scan.rules.flatMap((result) =>
    result.state === "evaluated"
      ? result.occurrences
          .filter(({ outcome }) => outcome === "violation")
          .map((occurrence) => ({ rule: result.rule.id, occurrence }))
      : [],
  );
const violations = (scan: ScanResult) =>
  scan.rules.flatMap((result) =>
    result.state === "evaluated"
      ? result.occurrences.filter(({ outcome }) => outcome === "violation")
      : [],
  );

// Oracle: target -> instance roots and supported repair scope, from the instrumented arm only.
export async function truthFor(browser: Browser, family: CorpusFamily) {
  const { scan, evidence, view } = await runArm(browser, family, "instrumented");
  const scopeOf = new Map<OccurrenceId, string>();
  for (const scope of view.scopes)
    for (const member of scope.members) scopeOf.set(member.occurrenceId, scope.id);
  const truth = new Map<string, { roots: readonly string[]; scope: string }>();
  for (const { rule, occurrence } of violationsByRule(scan)) {
    const attribution = evidence.attributions.find(
      (entry) => canonical(entry.target) === canonical(occurrence.target),
    );
    const instance =
      attribution?.status === "supported"
        ? evidence.instances.find(({ key }) => key === attribution.instance)
        : undefined;
    const scope = scopeOf.get(occurrence.id);
    if (instance?.status !== "supported" || !scope) continue;
    truth.set(caseKey(rule, occurrence.target), { roots: instance.roots.map(pathKey), scope });
  }
  return { scan, truth, violations: violations(scan).length };
}

// Trial: uninstrumented arm with structural capture; raw results must equal the truth arm.
export async function runFamily(browser: Browser, family: CorpusFamily): Promise<FamilyRun> {
  const oracle = await truthFor(browser, family);
  const { context, page } = await fixturePage(browser, family.render("uninstrumented"));
  const target = new BrowserTarget(page, "borrowed");
  try {
    const { scan, structure } = await scanComponents(
      target,
      request(target, family.rules),
      scanContext,
      new AbortController().signal,
      new ComponentRegistry([]),
      target.documentId,
      { structure: true },
    );
    const capture = structure!;
    const discovery = discoverTemplates(scan, capture);
    const decisions =
      discovery.state === "available"
        ? new Map(discovery.decisions.map((decision) => [decision.occurrenceId, decision]))
        : new Map();
    const groupOf = new Map<OccurrenceId, string>();
    if (discovery.state === "available")
      for (const group of discovery.groups)
        for (const member of group.members) groupOf.set(member, group.id);
    const cases = violationsByRule(scan).map(({ rule, occurrence }): CaseOutcome => {
      const key = caseKey(rule, occurrence.target);
      const truth = oracle.truth.get(key);
      const decision = decisions.get(occurrence.id);
      const hit = (candidate?: TemplateCandidate | null) =>
        candidate?.target !== undefined &&
        (truth?.roots.includes(pathKey(candidate.target)) ?? false);
      return {
        family: family.id,
        target: key,
        path: pathKey(occurrence.target),
        rule,
        defect: defectSignature(
          scan.rules.find(({ rule: entry }) => entry.id === rule)!.rule,
          occurrence,
        ),
        truthRoots: truth?.roots ?? [],
        candidateHit: decision?.candidates.some(hit) ?? false,
        decided: Boolean(decision?.decision),
        correct: hit(decision?.decision),
        truthScope: truth?.scope ?? `missing:${key}`,
        group: groupOf.get(occurrence.id) ?? null,
      };
    });
    return {
      family: family.id,
      split: family.split,
      rawEqual: canonical(raw(scan)) === canonical(raw(oracle.scan)),
      complete:
        scan.coverage.state === "complete" &&
        oracle.scan.coverage.state === "complete" &&
        capture.state === "available" &&
        oracle.truth.size === oracle.violations &&
        cases.length === oracle.violations,
      structure: capture,
      discovery,
      cases,
    };
  } finally {
    await target.release();
    await context.close();
  }
}

export interface Metrics {
  readonly cases: number;
  readonly candidateRecall: number;
  readonly coverage: number;
  readonly decisionPrecision: number | null;
  readonly decisionRecall: number;
  readonly pairwisePrecision: number | null;
  readonly pairwiseRecall: number | null;
  readonly overmerge: number;
  readonly oversplit: number;
}
export function metrics(cases: readonly CaseOutcome[]): Metrics {
  const decided = cases.filter(({ decided }) => decided);
  let truePairs = 0;
  let falsePairs = 0;
  let missedPairs = 0;
  // Pairs only within one family page; related pages never share scopes.
  for (let a = 0; a < cases.length; a++)
    for (let b = a + 1; b < cases.length; b++) {
      const left = cases[a]!;
      const right = cases[b]!;
      if (left.family !== right.family) continue;
      const truthSame = left.truthScope === right.truthScope;
      const predicted = left.group !== null && left.group === right.group;
      if (predicted && truthSame) truePairs++;
      else if (predicted) falsePairs++;
      else if (truthSame) missedPairs++;
    }
  const ratio = (numerator: number, denominator: number) =>
    denominator ? numerator / denominator : null;
  return {
    cases: cases.length,
    candidateRecall: cases.filter(({ candidateHit }) => candidateHit).length / cases.length,
    coverage: decided.length / cases.length,
    decisionPrecision: ratio(decided.filter(({ correct }) => correct).length, decided.length),
    decisionRecall: cases.filter(({ correct }) => correct).length / cases.length,
    pairwisePrecision: ratio(truePairs, truePairs + falsePairs),
    pairwiseRecall: ratio(truePairs, truePairs + missedPairs),
    overmerge: falsePairs,
    oversplit: missedPairs,
  };
}

// Percentile bootstrap resampling whole families, never DOM nodes. Fixed seed.
export function bootstrap(
  runs: readonly { readonly cases: readonly CaseOutcome[] }[],
  pick: (value: Metrics) => number | null,
  resamples = 2000,
  seed = 20_260_924,
): { readonly low: number; readonly high: number } | null {
  let state = seed >>> 0;
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
  const values: number[] = [];
  for (let index = 0; index < resamples; index++) {
    // Each resampled copy is its own family, so duplicates never pair with each other.
    const sample = runs.flatMap((_, copy) =>
      runs[Math.floor(random() * runs.length)]!.cases.map((entry) => ({
        ...entry,
        family: `${entry.family}#${copy}`,
      })),
    );
    const value = pick(metrics(sample));
    if (value !== null) values.push(value);
  }
  if (!values.length) return null;
  values.sort((a, b) => a - b);
  return {
    low: values[Math.floor(values.length * 0.025)]!,
    high: values[Math.min(values.length - 1, Math.floor(values.length * 0.975))]!,
  };
}

// Provider arm scoring: each decision maps back to its case through the same chain the heuristic
// used. "none" and "insufficient-evidence" are abstentions; failed calls are undecided.
export interface ProviderDecision {
  readonly family: string;
  readonly path: string;
  readonly result: DecisionResult;
  readonly latencyMs: number;
}
export function providerCases(
  runs: readonly FamilyRun[],
  decisions: readonly ProviderDecision[],
): { cases: CaseOutcome[]; calibration: { confidence: number; correct: boolean }[] } {
  const byCase = new Map(decisions.map((entry) => [canonical([entry.family, entry.path]), entry]));
  const cases: CaseOutcome[] = [];
  const calibration: { confidence: number; correct: boolean }[] = [];
  for (const run of runs) {
    if (run.structure.state !== "available") continue;
    const chains = new Map(
      run.structure.targets.map(({ target, chain }) => [pathKey(target), chain]),
    );
    for (const entry of run.cases) {
      const chain = chains.get(entry.path) ?? [];
      const inRoots = (distance: number) => {
        const link = chain[distance];
        return link?.target !== undefined && entry.truthRoots.includes(pathKey(link.target));
      };
      // Decisions are target-level: every (rule, path) case on one target shares its decision.
      const decision = byCase.get(canonical([run.family, entry.path]))?.result;
      const choice =
        decision?.state === "answered" ? decision.answers.membership.choice : undefined;
      const distance = choice ? /^ancestor-([1-8])$/.exec(choice)?.[1] : undefined;
      const correct = distance !== undefined && inRoots(Number(distance));
      if (decision?.state === "answered" && distance !== undefined)
        calibration.push({ confidence: decision.answers.membership.confidence, correct });
      // A part abstention keeps membership but never forms a repair group.
      const part = decision?.state === "answered" ? decision.answers.part.choice : undefined;
      const partDecided = part !== undefined && part !== "none" && part !== "insufficient-evidence";
      cases.push({
        ...entry,
        candidateHit: decisionCase(chain).candidates.some((_, index) => inRoots(index + 1)),
        decided: distance !== undefined,
        correct,
        group:
          decision?.state === "answered" && distance !== undefined && partDecided
            ? canonical([
                "provider",
                chain[Number(distance)]?.shape,
                decision.answers.part.choice,
                entry.rule,
                entry.defect,
              ])
            : null,
      });
    }
  }
  return { cases, calibration };
}
const percentile = (values: readonly number[], fraction: number) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length
    ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))]!
    : null;
};
export function providerReport(runs: readonly FamilyRun[], decisions: readonly ProviderDecision[]) {
  const { cases, calibration } = providerCases(runs, decisions);
  const failures: Record<string, number> = {};
  for (const { result } of decisions)
    if (result.state === "failed") failures[result.code] = (failures[result.code] ?? 0) + 1;
  const scored = runs.map((run) => ({
    cases: cases.filter(({ family }) => family === run.family),
  }));
  return {
    // Requests, latency and attempts are per target; scored cases are per (rule, path).
    decisionUnit: "target" as const,
    pooled: metrics(cases),
    perFamily: Object.fromEntries(
      scored.map((entry, index) => [runs[index]!.family, metrics(entry.cases)]),
    ),
    intervals: {
      decisionPrecision: bootstrap(scored, (value) => value.decisionPrecision),
      pairwisePrecision: bootstrap(scored, (value) => value.pairwisePrecision),
    },
    // Brier score of membership confidence against correctness, over emitted decisions.
    calibration: {
      decided: calibration.length,
      brier: calibration.length
        ? calibration.reduce(
            (sum, { confidence, correct }) => sum + (confidence - (correct ? 1 : 0)) ** 2,
            0,
          ) / calibration.length
        : null,
    },
    latencyMs: {
      p50: percentile(
        decisions.map(({ latencyMs }) => latencyMs),
        0.5,
      ),
      p95: percentile(
        decisions.map(({ latencyMs }) => latencyMs),
        0.95,
      ),
    },
    attempts: decisions.reduce((sum, { result }) => sum + result.attempts, 0),
    cached: decisions.filter(({ result }) => result.state === "answered" && result.cached).length,
    failures,
    // Advisory arm: no cause answer is ever promoted to a supported scope.
    causePromotions: 0,
  };
}
// Frozen adoption bar. Only a holdout run is eligible; dev results are never an adoption test.
export function adoption(
  split: string,
  provider: Metrics,
  heuristic: Metrics,
  causePromotions: number,
) {
  const precision = provider.decisionPrecision ?? 0;
  const checks = {
    precision: precision >= 0.98,
    coverage: provider.coverage >= 0.6,
    pairwisePrecision: (provider.pairwisePrecision ?? 0) >= 0.99,
    causePromotions: causePromotions === 0,
    incrementalCoverage:
      provider.coverage - heuristic.coverage >= 0.1 &&
      precision >= (heuristic.decisionPrecision ?? 0),
  };
  return {
    eligible: split === "holdout",
    checks,
    adopted: split === "holdout" && Object.values(checks).every(Boolean),
  };
}
