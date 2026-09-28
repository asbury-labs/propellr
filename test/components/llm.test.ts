import { createServer } from "node:http";
import type { ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { DecisionCase } from "../../src/components/discovery.js";
import { readFile } from "node:fs/promises";
import {
  LlmDecisionClient,
  llmApprovalSchema,
  llmModel,
  llmRequest,
} from "../../src/host/component-llm.js";
import { decisionApprovalSchema } from "../../src/host/component-decisions.js";

// No-key integration behavior against a loopback server; says nothing about model quality.
const input: DecisionCase = {
  target: "button",
  chain: [
    { distance: 0, label: "button", shape: "00000001", repeats: 20 },
    { distance: 1, label: "article", shape: "00000002", repeats: 20 },
    { distance: 2, label: "main", shape: "00000003", repeats: 1 },
  ],
  candidates: ["ancestor-1", "ancestor-2"],
  parts: ["button", "article>button"],
};
const budget = {
  maxRequests: 100,
  maxSpendUsd: 1,
  pricePerMillionInputTokensUsd: 1,
  pricePerMillionOutputTokensUsd: 5,
};
const answer = {
  membership: { choice: "ancestor-1", confidence: 0.8 },
  part: { choice: "button", confidence: 0.7 },
  cause: { probability: 0.6 },
};
const message = (overrides: Record<string, unknown> = {}, text: unknown = answer) => ({
  id: "msg_test",
  type: "message",
  role: "assistant",
  model: llmModel,
  stop_reason: "end_turn",
  content: [{ type: "text", text: typeof text === "string" ? text : JSON.stringify(text) }],
  usage: { input_tokens: 900, output_tokens: 60 },
  ...overrides,
});
let server: ReturnType<typeof createServer> | undefined;
const requests: { headers: Record<string, unknown>; body: string }[] = [];
async function serve(handler: (response: ServerResponse, hit: number) => void) {
  let hits = 0;
  server = createServer((incoming, response) => {
    let body = "";
    incoming.on("data", (chunk: Buffer) => (body += chunk.toString("utf8")));
    incoming.on("end", () => {
      requests.push({ headers: incoming.headers, body });
      handler(response, ++hits);
    });
  });
  await new Promise<void>((resolve) => server!.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as AddressInfo).port;
  return {
    hits: () => hits,
    client: (options: { budget?: typeof budget; maxAttempts?: number; evidence?: string } = {}) =>
      new LlmDecisionClient({
        endpoint: `http://127.0.0.1:${port}/v1/messages`,
        apiKey: "test-key",
        policy: { id: "test", version: "1" },
        evidence: { id: "structure", version: options.evidence ?? "1" },
        allowLoopback: true,
        budget: options.budget ?? budget,
        ...(options.maxAttempts ? { maxAttempts: options.maxAttempts } : {}),
      }),
  };
}
const json = (response: ServerResponse, status: number, value: unknown) => {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(value));
};
const signal = () => new AbortController().signal;
afterEach(async () => {
  requests.length = 0;
  await new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve()));
  server = undefined;
  vi.restoreAllMocks();
});

describe("Claude Haiku 4.5 comparison arm without keys", () => {
  test("pinned request shape, mapped answers, exact cache and no logging", async () => {
    const logs = ["log", "info", "warn", "error", "debug"].map((method) =>
      vi.spyOn(console, method as "log"),
    );
    const { client, hits } = await serve((response) => json(response, 200, message()));
    const decisions = client();
    expect(await decisions.decide(input, signal())).toMatchObject({
      state: "answered",
      model: llmModel,
      attempts: 1,
      cached: false,
      usage: { inputTokens: 900, outputTokens: 60 },
      answers: {
        membership: { type: "choice", choice: "ancestor-1", confidence: 0.8 },
        part: { type: "choice", choice: "button", confidence: 0.7 },
        cause: { type: "noul", noul: 0.6 },
      },
    });
    expect(await decisions.decide(input, signal())).toMatchObject({ cached: true, attempts: 0 });
    expect(hits()).toBe(1);
    await client({ evidence: "2" }).decide(input, signal());
    expect(hits()).toBe(2);
    const [first] = requests;
    expect(first?.headers["x-api-key"]).toBe("test-key");
    expect(first?.headers["anthropic-version"]).toBe("2023-06-01");
    const body = JSON.parse(first!.body) as ReturnType<typeof llmRequest>;
    expect(body).toMatchObject({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      temperature: 0,
    });
    expect(body.output_config.format.type).toBe("json_schema");
    expect(body.output_config.format.schema.properties.membership.properties.choice.enum).toEqual([
      "ancestor-1",
      "ancestor-2",
      "none",
      "insufficient-evidence",
    ]);
    expect(JSON.stringify(body)).not.toMatch(/thinking|budget_tokens/);
    for (const spy of logs) expect(spy).not.toHaveBeenCalled();
  });

  test.each([
    ["wrong model", message({ model: "claude-haiku-4-5" })],
    ["refusal", message({ stop_reason: "refusal" })],
    ["truncated", message({ stop_reason: "max_tokens" })],
    ["non-JSON text", message({}, "not json")],
    [
      "unoffered choice",
      message({}, { ...answer, membership: { choice: "ancestor-9", confidence: 0.8 } }),
    ],
    [
      "confidence out of range",
      message({}, { ...answer, part: { choice: "button", confidence: 1.5 } }),
    ],
    ["probability out of range", message({}, { ...answer, cause: { probability: -0.1 } })],
    ["extra field", message({}, { ...answer, extra: 1 })],
    ["missing cause", message({}, { membership: answer.membership, part: answer.part })],
    ["no text block", message({ content: [] })],
  ])("rejects invalid responses: %s", async (_, response) => {
    const { client } = await serve((reply) => json(reply, 200, response));
    expect(await client().decide(input, signal())).toMatchObject({
      state: "failed",
      code: "invalid-response",
    });
  });

  test("status handling: terminal statuses never retry, overload and rate limits retry", async () => {
    for (const [status, code] of [
      [401, "unauthorized"],
      [403, "unauthorized"],
      [400, "rejected"],
      [404, "rejected"],
    ] as const) {
      const once = await serve((reply) => json(reply, status, { type: "error" }));
      expect(await once.client().decide(input, signal())).toMatchObject({
        state: "failed",
        code,
        attempts: 1,
      });
      expect(once.hits()).toBe(1);
      await new Promise<void>((resolve) => server!.close(() => resolve()));
      server = undefined;
    }
    const retry = await serve((reply, hit) =>
      hit === 1
        ? json(reply, 529, {})
        : hit === 2
          ? json(reply, 500, {})
          : json(reply, 200, message()),
    );
    expect(await retry.client().decide(input, signal())).toMatchObject({
      state: "answered",
      attempts: 3,
    });
    await new Promise<void>((resolve) => server!.close(() => resolve()));
    server = undefined;
    const limited = await serve((reply) => json(reply, 429, {}));
    expect(await limited.client({ maxAttempts: 2 }).decide(input, signal())).toMatchObject({
      state: "failed",
      code: "rate-limited",
      attempts: 2,
    });
  });

  test("the reservation includes the output ceiling and reported usage replaces it", async () => {
    const { client, hits } = await serve((reply) => json(reply, 200, message()));
    const bytes = Buffer.byteLength(JSON.stringify(llmRequest(input)), "utf8");
    const reservation = (bytes * 1 + 512 * 5) / 1_000_000;
    // Input alone would fit; input plus the 512-token output ceiling does not.
    const tight = client({ budget: { ...budget, maxSpendUsd: reservation * 0.9 } });
    expect(await tight.decide(input, signal())).toMatchObject({
      code: "budget-exhausted",
      attempts: 0,
    });
    expect(hits()).toBe(0);
    const decisions = client({ budget: { ...budget, maxSpendUsd: reservation * 1.01 } });
    expect(await decisions.decide(input, signal())).toMatchObject({ state: "answered" });
    // 900 input and 60 output tokens replace the reservation.
    expect(decisions.usage.spentUsd).toBeCloseTo((900 * 1 + 60 * 5) / 1_000_000, 12);
  });

  test("inputs outside the text-free grammar are refused before sending", async () => {
    const { client, hits } = await serve((reply) => json(reply, 200, message()));
    expect(await client().decide({ ...input, target: "Buy now for $5" }, signal())).toMatchObject({
      state: "failed",
      code: "invalid-request",
      attempts: 0,
    });
    expect(hits()).toBe(0);
  });

  test("HTTPS only and redirects refused", async () => {
    expect(
      () =>
        new LlmDecisionClient({
          endpoint: "http://api.anthropic.com/v1/messages",
          apiKey: "k",
          policy: { id: "p", version: "1" },
          evidence: { id: "e", version: "1" },
          budget,
        }),
    ).toThrow("HTTPS");
    const { client } = await serve((reply) => {
      reply.writeHead(307, { location: "http://127.0.0.1:1/elsewhere" });
      reply.end();
    });
    expect(await client().decide(input, signal())).toMatchObject({
      code: "redirect-refused",
      attempts: 1,
    });
  });
});

test("the committed approval records satisfy both live-lane schemas", async () => {
  const load = async (name: string) =>
    JSON.parse(
      await readFile(`specs/component-inference-evidence/approvals/${name}`, "utf8"),
    ) as unknown;
  expect(decisionApprovalSchema.parse(await load("jev-2026-09-28.json"))).toMatchObject({
    model: "jev-1.13.0",
    maxRequests: 300,
    maxSpendUsd: 1,
  });
  expect(llmApprovalSchema.parse(await load("llm-2026-09-28.json"))).toMatchObject({
    model: "claude-haiku-4-5-20251001",
    maxRequests: 300,
    maxSpendUsd: 1,
  });
});
