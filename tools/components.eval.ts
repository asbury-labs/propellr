// Evaluation lane, run only through tools/evaluate-components.ts. Never part of pnpm validate.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { expect, test } from "vitest";
import { browserTypes } from "../src/host/browser.js";
import {
  DecisionClient,
  decisionApprovalSchema,
  decisionEndpoint,
  decisionModel,
} from "../src/host/component-decisions.js";
import { decisionCase } from "../src/components/discovery.js";
import { corpusFamilies } from "../test/fixtures/components/corpus.js";
import { bootstrap, metrics, runFamily } from "../test/support/component-evaluation.js";
import { environment } from "../test/support/parity.js";

const provider = process.env["PROPELLR_EVAL_PROVIDER"];
const split = process.env["PROPELLR_EVAL_SPLIT"];
test("component attribution evaluation", { timeout: 600_000 }, async () => {
  if (!provider || split !== "dev") throw new Error("Run through pnpm eval:components");
  // Validate every approval gate before any browser work or client construction.
  let approval: ReturnType<typeof decisionApprovalSchema.parse> | undefined;
  if (provider === "jev") {
    const parsed = decisionApprovalSchema.safeParse(
      JSON.parse(await readFile(process.env["PROPELLR_DECISION_APPROVAL"]!, "utf8")),
    );
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
    expect(runs.every(({ rawEqual }) => rawEqual)).toBe(true);
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
      const decisions = [];
      // The client enforces request and spend ceilings; exhaustion stops the lane.
      lanes: for (const run of runs) {
        if (run.structure.state !== "available") continue;
        for (const entry of run.structure.targets) {
          const result = await client.decide(
            decisionCase(entry.chain),
            AbortSignal.timeout(10_000),
          );
          decisions.push(result);
          if (result.state === "failed" && result.code === "budget-exhausted") break lanes;
        }
      }
      report["jev"] = { model: decisionModel, approval, usage: client.usage, decisions };
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
