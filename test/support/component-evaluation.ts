// Phase 2 evaluator: instrumented arm is the oracle only; the trial sees the uninstrumented arm.
import type { Browser } from "playwright";
import type { OccurrenceId, ScanResult } from "../../src/contracts.js";
import type { StructureCapture } from "../../src/components/contracts.js";
import { discoverTemplates } from "../../src/components/discovery.js";
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
  readonly structure: StructureCapture;
  readonly discovery: TemplateDiscovery;
  readonly cases: readonly CaseOutcome[];
}
// Arms load separate pages; identity across them is the target path, never page/document IDs.
const pathKey = (target: { readonly path: unknown }) => canonical(target.path);
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
  for (const occurrence of violations(scan)) {
    const attribution = evidence.attributions.find(
      (entry) => canonical(entry.target) === canonical(occurrence.target),
    );
    const instance =
      attribution?.status === "supported"
        ? evidence.instances.find(({ key }) => key === attribution.instance)
        : undefined;
    const scope = scopeOf.get(occurrence.id);
    if (instance?.status !== "supported" || !scope) continue;
    truth.set(pathKey(occurrence.target), { roots: instance.roots.map(pathKey), scope });
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
      discovery.groups.forEach((group, index) =>
        group.members.forEach((member) => groupOf.set(member, `${group.id}#${index}`)),
      );
    const cases = violations(scan).map((occurrence): CaseOutcome => {
      const key = pathKey(occurrence.target);
      const truth = oracle.truth.get(key);
      const decision = decisions.get(occurrence.id);
      const hit = (candidate?: TemplateCandidate | null) =>
        candidate?.target !== undefined &&
        (truth?.roots.includes(pathKey(candidate.target)) ?? false);
      return {
        family: family.id,
        target: key,
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
