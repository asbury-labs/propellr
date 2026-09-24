// Evaluation lane, run only through tools/evaluate-components.ts. Never part of pnpm validate.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { expect, test } from "vitest";
import { z } from "zod";
import { browserTypes } from "../src/host/browser.js";
import { DecisionClient, decisionModel } from "../src/host/component-decisions.js";
import { decisionCase } from "../src/components/discovery.js";
import { corpusFamilies } from "../test/fixtures/components/corpus.js";
import { bootstrap, metrics, runFamily } from "../test/support/component-evaluation.js";
import { environment } from "../test/support/parity.js";

const provider = process.env["PROPELLR_EVAL_PROVIDER"];
const split = process.env["PROPELLR_EVAL_SPLIT"];
const approvalSchema = z.strictObject({
  provider: z.literal("typesafe"),
  model: z.literal(decisionModel),
  approvedBy: z.string().min(1),
  date: z.iso.date(),
  syntheticDisclosureOnly: z.literal(true),
  maxRequests: z.number().int().min(1).max(1000),
  maxSpendUsd: z.number().positive().max(10),
  pricePerMillionInputTokensUsd: z.number().positive().max(100),
});

test("component attribution evaluation", { timeout: 600_000 }, async () => {
  if (!provider || split !== "dev") throw new Error("Run through pnpm eval:components");
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
    if (provider === "jev") {
      // Live lane: only reachable with an approval record and key; HTTPS only, bounded requests.
      const approval = approvalSchema.parse(
        JSON.parse(await readFile(process.env["PROPELLR_DECISION_APPROVAL"]!, "utf8")),
      );
      const client = new DecisionClient({
        endpoint: "https://api.typesafe.ai/v1/systemone",
        apiKey: process.env["TYPESAFE_API_KEY"]!,
        policy: { id: "component-eval", version: "1" },
        evidence: { id: "propellr-structure-capture", version: "1" },
        budget: approval,
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
