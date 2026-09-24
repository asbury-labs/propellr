// Evaluation lane, run only through tools/evaluate-components.ts. Never part of pnpm validate.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { test } from "vitest";
import { browserTypes } from "../src/host/browser.js";
import {
  DecisionClient,
  decisionApprovalSchema,
  decisionEndpoint,
  decisionModel,
} from "../src/host/component-decisions.js";
import { decisionCase } from "../src/components/discovery.js";
import { corpusFamilies } from "../test/fixtures/components/corpus.js";
import {
  adoption,
  bootstrap,
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
  if (provider !== "heuristic" && provider !== "jev")
    throw new Error(`blocked: provider ${provider ?? "(none)"} is not approved for phase 2`);
  if (split !== "dev") throw new Error("blocked: only the dev split may run; holdout is sealed");
  if (provider === "jev" && !process.env["TYPESAFE_API_KEY"])
    throw new Error("blocked: provider key missing (TYPESAFE_API_KEY)");
  // Validate every approval gate before any browser work or client construction.
  let approval: ReturnType<typeof decisionApprovalSchema.parse> | undefined;
  if (provider === "jev") {
    let record: unknown;
    try {
      record = JSON.parse(await readFile(process.env["PROPELLR_DECISION_APPROVAL"]!, "utf8"));
    } catch {
      throw new Error("blocked: approval record invalid (unreadable JSON)");
    }
    const parsed = decisionApprovalSchema.safeParse(record);
    if (!parsed.success)
      throw new Error(
        `blocked: approval record invalid (${parsed.error.issues.map(({ path }) => path.join(".")).join(", ")})`,
      );
    approval = parsed.data;
  }
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
    if (approval) {
      // Live lane: only reachable with a complete approval record and key; HTTPS only.
      const client = new DecisionClient({
        endpoint: decisionEndpoint,
        apiKey: process.env["TYPESAFE_API_KEY"]!,
        policy: { id: "component-eval", version: "1" },
        evidence: { id: "propellr-structure-capture", version: "1" },
        budget: {
          maxRequests: approval.maxRequests,
          maxSpendUsd: approval.maxSpendUsd,
          pricePerMillionInputTokensUsd: approval.pricePerMillionInputTokensUsd,
        },
      });
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
      const scored = providerReport(runs, decisions);
      report["jev"] = {
        model: decisionModel,
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
