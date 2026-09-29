// Evaluation lane, run only through tools/evaluate-components.ts. Never part of pnpm validate.
import { createHash } from "node:crypto";
import frozen from "./frozen-protocol.json" with { type: "json" };
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { test } from "vitest";
import { browserTypes } from "../src/host/browser.js";
import {
  DecisionClient,
  decisionApprovalSchema,
  decisionEndpoint,
  decisionModel,
  decisionRubric,
} from "../src/host/component-decisions.js";
import {
  LlmDecisionClient,
  llmApprovalSchema,
  llmEndpoint,
  llmModel,
} from "../src/host/component-llm.js";
import { decisionCase } from "../src/components/discovery.js";
import { corpusFamilies } from "../test/fixtures/components/corpus.js";
import {
  adoption,
  bootstrap,
  confidenceGates,
  metrics,
  providerReport,
  runFamily,
} from "../test/support/component-evaluation.js";
import type { ProviderDecision } from "../test/support/component-evaluation.js";
import { canonical } from "../src/reporting/index.js";
import { environment } from "../test/support/parity.js";

const provider = process.env["PROPELLR_EVAL_PROVIDER"];
const split = process.env["PROPELLR_EVAL_SPLIT"];
test("component attribution evaluation", { timeout: 600_000 }, async () => {
  // Enforced here too, so running this entry point directly cannot bypass the wrapper.
  if (provider !== "heuristic" && provider !== "jev" && provider !== "llm")
    throw new Error(`blocked: provider ${provider ?? "(none)"} is not approved for phase 2`);
  if (split !== "dev") throw new Error("blocked: only the dev split may run; holdout is sealed");
  const keyName = provider === "jev" ? "TYPESAFE_API_KEY" : "ANTHROPIC_API_KEY";
  if (provider !== "heuristic" && !process.env[keyName])
    throw new Error(`blocked: provider key missing (${keyName})`);
  // The pinned digest is the authority; caller-supplied hashes are only cross-checked.
  const protocol = process.env["PROPELLR_EVAL_PROTOCOL"];
  const protocolSha256 = process.env["PROPELLR_EVAL_PROTOCOL_SHA256"];
  const actual = createHash("sha256")
    .update(await readFile(frozen.path).catch(() => ""))
    .digest("hex");
  if (protocol !== frozen.path || protocolSha256 !== frozen.sha256 || actual !== frozen.sha256)
    throw new Error("blocked: frozen protocol path and hash are required and must match");
  // Validate every approval gate before any browser work or client construction.
  const record = async (name: string) => {
    try {
      return JSON.parse(await readFile(process.env[name]!, "utf8")) as unknown;
    } catch {
      throw new Error("blocked: approval record invalid (unreadable JSON)");
    }
  };
  const invalid = (issues: readonly { readonly path: readonly PropertyKey[] }[]) =>
    new Error(
      `blocked: approval record invalid (${issues.map(({ path }) => path.join(".")).join(", ")})`,
    );
  let client: DecisionClient | LlmDecisionClient | undefined;
  let approval: unknown;
  const evidenceRef = { id: "propellr-structure-capture", version: "1" };
  const policy = { id: "component-eval", version: "1" };
  if (provider === "jev") {
    const parsed = decisionApprovalSchema.safeParse(await record("PROPELLR_DECISION_APPROVAL"));
    if (!parsed.success) throw invalid(parsed.error.issues);
    approval = parsed.data;
    client = new DecisionClient({
      endpoint: decisionEndpoint,
      apiKey: process.env[keyName]!,
      policy,
      evidence: evidenceRef,
      budget: {
        maxRequests: parsed.data.maxRequests,
        maxSpendUsd: parsed.data.maxSpendUsd,
        pricePerMillionInputTokensUsd: parsed.data.pricePerMillionInputTokensUsd,
      },
    });
  } else if (provider === "llm") {
    const parsed = llmApprovalSchema.safeParse(await record("PROPELLR_LLM_APPROVAL"));
    if (!parsed.success) throw invalid(parsed.error.issues);
    approval = parsed.data;
    client = new LlmDecisionClient({
      endpoint: llmEndpoint,
      apiKey: process.env[keyName]!,
      policy,
      evidence: evidenceRef,
      budget: {
        maxRequests: parsed.data.maxRequests,
        maxSpendUsd: parsed.data.maxSpendUsd,
        pricePerMillionInputTokensUsd: parsed.data.pricePerMillionInputTokensUsd,
        pricePerMillionOutputTokensUsd: parsed.data.pricePerMillionOutputTokensUsd,
      },
    });
  }
  // The frozen confidence gate is rubric-specific (amendment 2026-09-29).
  const gate =
    provider === "heuristic" ? 0 : confidenceGates[provider === "jev" ? decisionModel : llmModel];
  if (gate === undefined || decisionRubric.version !== "2")
    throw new Error("blocked: no frozen confidence gate for this model and rubric");
  const browser = await browserTypes.chromium.launch();
  try {
    const families = corpusFamilies.filter((family) => family.split === split);
    const runs = [];
    for (const family of families) runs.push(await runFamily(browser, family));
    // Partial scans, missing structure or missing truth are never scored as results.
    const incomplete = runs.filter(
      (run) => !run.rawEqual || !run.complete || run.cases.length !== 20,
    );
    if (incomplete.length)
      throw new Error(
        `blocked: incomplete evaluation (${incomplete.map(({ family }) => family).join(", ")})`,
      );
    const cases = runs.flatMap(({ cases }) => cases);
    const report: Record<string, unknown> = {
      protocol: process.env["PROPELLR_EVAL_PROTOCOL"],
      protocolSha256: process.env["PROPELLR_EVAL_PROTOCOL_SHA256"],
      split,
      environment: await environment(browser),
      labels: "instrumented-oracle; not two-reviewer adjudicated",
      heuristic: {
        version: "structural-template/1",
        pooled: metrics(cases),
        perFamily: Object.fromEntries(runs.map((run) => [run.family, metrics(run.cases)])),
        intervals: {
          decisionPrecision: bootstrap(runs, (value) => value.decisionPrecision),
          pairwisePrecision: bootstrap(runs, (value) => value.pairwisePrecision),
        },
      },
    };
    if (client) {
      // Live lane: only reachable with a complete approval record and key; HTTPS only.
      const decisions: ProviderDecision[] = [];
      // The client enforces request and spend ceilings; exhaustion stops the lane.
      lanes: for (const run of runs) {
        if (run.structure.state !== "available") continue;
        for (const entry of run.structure.targets) {
          const started = performance.now();
          const result = await client.decide(
            decisionCase(entry.chain),
            AbortSignal.timeout(10_000),
          );
          decisions.push({
            family: run.family,
            path: canonical(entry.target.path),
            result,
            latencyMs: performance.now() - started,
          });
          if (result.state === "failed" && result.code === "budget-exhausted") break lanes;
        }
      }
      const model = provider === "jev" ? decisionModel : llmModel;
      const scored = providerReport(runs, decisions, gate);
      report[provider] = {
        model,
        rubric: decisionRubric,
        approval,
        usage: client.usage,
        report: scored,
        adoption: adoption(split, scored.pooled, metrics(cases), scored.causePromotions),
        decisions,
      };
    }
    await mkdir(new URL("../artifacts/components/", import.meta.url), { recursive: true });
    await writeFile(
      new URL(`../artifacts/components/eval-${provider}-${split}.json`, import.meta.url),
      `${JSON.stringify({ ...report, runs }, null, 2)}\n`,
    );
    console.log(JSON.stringify(report.heuristic, null, 2));
  } finally {
    await browser.close();
  }
});
