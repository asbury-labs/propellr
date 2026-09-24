// Host-only, advisory decision adapter for the TypeSafe System One API (Jev). Not wired into
// any operation. Phase 2 makes no live call: provider access, spend and terms are unapproved.
import { z } from "zod";
import type { VersionRef } from "../contracts.js";
import type { DecisionCase } from "../components/discovery.js";
import { canonical } from "../reporting/index.js";
import { isStructureLabel } from "../analysis.js";

export const decisionModel = "jev-1.13.0";
export const decisionRubric = { id: "component-attribution-questions", version: "1" } as const;
export const decisionEndpoint = "https://api.typesafe.ai/v1/systemone";
// Machine-checkable approval for a live lane. Every gate in the phase 2 protocol is a field:
// provider, exact model and client, disclosure, terms review, and numeric ceilings.
export const decisionApprovalSchema = z
  .strictObject({
    provider: z.literal("typesafe"),
    model: z.literal(decisionModel),
    client: z
      .strictObject({
        endpoint: z.literal(decisionEndpoint),
        adapter: z.literal("propellr-component-decisions/1"),
      })
      .readonly(),
    approvedBy: z.string().min(1).max(128),
    date: z.iso.date(),
    syntheticDisclosureOnly: z.literal(true),
    termsReview: z
      .strictObject({
        reference: z.string().min(1).max(256),
        reviewedBy: z.string().min(1).max(128),
        date: z.iso.date(),
        outputReuse: z.literal("evaluation-only"),
        distillation: z.literal("prohibited"),
        adversarialTesting: z.literal("not-permitted"),
      })
      .readonly(),
    maxRequests: z.number().int().min(1).max(1000),
    maxSpendUsd: z.number().positive().max(10),
    pricePerMillionInputTokensUsd: z.number().positive().max(100),
  })
  .readonly();
const sentinels = ["none", "insufficient-evidence"] as const;
const REQUEST_BYTES = 65_536;
const RESPONSE_BYTES = 262_144;
type Failure = Extract<DecisionResult, { state: "failed" }>["code"];
// Egress boundary: only text-free structural labels, opaque shapes and code-generated IDs.
const label = z.string().refine(isStructureLabel, "Unknown structural label");
const decisionCaseSchema = z
  .strictObject({
    target: label,
    chain: z
      .array(
        z
          .strictObject({
            distance: z.number().int().min(0).max(8),
            label,
            shape: z.string().regex(/^[0-9a-f]{8}$/),
            repeats: z.number().int().min(0).max(2000),
          })
          .readonly(),
      )
      .min(1)
      .max(9)
      .readonly(),
    candidates: z
      .array(z.string().regex(/^ancestor-[1-8]$/))
      .max(8)
      .readonly(),
    parts: z
      .array(
        z
          .string()
          .max(640)
          .refine(
            (path) => path === "" || path.split(">").every(isStructureLabel),
            "Unknown structural label in part path",
          ),
      )
      .max(8)
      .readonly(),
  })
  .readonly()
  // Candidates must be exactly the chain's ancestors, in order, each with its part path.
  .refine(
    (value) =>
      value.chain.every((link, index) => link.distance === index) &&
      value.candidates.length === value.parts.length &&
      value.candidates.length === value.chain.length - 1 &&
      value.candidates.every((candidate, index) => candidate === `ancestor-${index + 1}`) &&
      // Each part is the label path from that candidate down to the target.
      value.parts.every(
        (part, index) =>
          part ===
          value.chain
            .slice(0, index + 1)
            .map(({ label }) => label)
            .reverse()
            .join(">"),
      ),
    "Candidates must match the chain",
  );
const CACHE_ENTRIES = 256;

export interface DecisionClientOptions {
  readonly endpoint: string;
  readonly apiKey: string;
  readonly policy: VersionRef;
  readonly evidence: VersionRef;
  readonly deadlineMs?: number;
  readonly maxAttempts?: number;
  // Plain HTTP is accepted only for an explicit loopback test endpoint.
  readonly allowLoopback?: boolean;
  readonly fetch?: typeof fetch;
  // Approved ceilings. Every attempt counts; spend uses the approved price and reported usage.
  readonly budget: {
    readonly maxRequests: number;
    readonly maxSpendUsd: number;
    readonly pricePerMillionInputTokensUsd: number;
  };
}
const probability = z.number().finite().min(0).max(1);
const choiceAnswer = z
  .strictObject({
    type: z.literal("choice"),
    choice: z.string(),
    probabilities: z.record(z.string(), probability),
    confidence: probability,
  })
  .readonly();
const noulAnswer = z.strictObject({ type: z.literal("noul"), noul: probability }).readonly();
const responseSchema = z
  .strictObject({
    model: z.string(),
    answers: z
      .strictObject({ membership: choiceAnswer, part: choiceAnswer, cause: noulAnswer })
      .readonly(),
    usage: z
      .strictObject({
        input_tokens: z.number().int().min(0),
        output_tokens: z.number().int().min(0),
      })
      .readonly(),
  })
  .readonly();
export type DecisionAnswers = z.infer<typeof responseSchema>["answers"];
export type DecisionResult =
  | {
      readonly state: "answered";
      readonly model: string;
      readonly answers: DecisionAnswers;
      readonly usage: { readonly inputTokens: number };
      readonly attempts: number;
      readonly cached: boolean;
    }
  | {
      readonly state: "failed";
      readonly code:
        | "unauthorized"
        | "rejected"
        | "rate-limited"
        | "overloaded"
        | "timeout"
        | "cancelled"
        | "unavailable"
        | "invalid-response"
        | "request-limit"
        | "budget-exhausted"
        | "redirect-refused"
        | "invalid-request";
      readonly attempts: number;
    };

// Complete per-question instructions: question IDs are invisible to the model.
export function decisionRequest(input: DecisionCase) {
  const options = (values: readonly string[], describe: (value: string, index: number) => string) =>
    Object.fromEntries([
      ...values.map((value, index) => [value, describe(value, index)] as const),
      ["none", "No listed option applies to the target element."],
      ["insufficient-evidence", "The structural state is not enough to decide."],
    ]);
  const link = (index: number) => input.chain[index + 1]!;
  return {
    model: decisionModel,
    state: {
      description:
        "Structural fingerprint of one element with an accessibility violation and its ancestor chain. Labels are element names with an optional ARIA role; shapes are opaque hashes; repeats counts identical shapes on the page. No page text is included.",
      target: input.target,
      chain: input.chain,
    },
    questions: {
      membership: {
        type: "choice",
        instructions:
          "Which ancestor in the chain is the root of the reusable component instance that renders the target element? Choose by chain distance.",
        criteria: options(input.candidates, (_, index) => {
          const { distance, label, repeats } = link(index);
          return `Ancestor at distance ${distance}, label ${label}, shape repeated ${repeats} times.`;
        }),
      },
      part: {
        type: "choice",
        instructions:
          "Within the chosen component instance, which label path from the component root to the target element describes the target's part?",
        criteria: options(input.parts, (value) => `Label path ${value || "(root)"}.`),
      },
      cause: {
        type: "noul",
        instructions:
          "Is the same structural defect likely shared by every repeated instance of that component, rather than caused by one instance's data?",
        criteria: {
          true: "The defect is likely in the shared component template.",
          false: "The defect is likely instance-specific or cannot be attributed to the template.",
        },
      },
    },
  } as const;
}

function validateAnswers(
  input: DecisionCase,
  value: unknown,
): z.infer<typeof responseSchema> | undefined {
  const parsed = responseSchema.safeParse(value);
  if (!parsed.success || parsed.data.model !== decisionModel) return undefined;
  const choiceValid = (
    answer: z.infer<typeof choiceAnswer>,
    offered: readonly string[],
  ): boolean => {
    const keys = Object.keys(answer.probabilities).sort();
    const expected = [...offered, ...sentinels].sort();
    const total = Object.values(answer.probabilities).reduce((sum, entry) => sum + entry, 0);
    return (
      expected.includes(answer.choice) &&
      canonical(keys) === canonical(expected) &&
      Math.abs(total - 1) <= 0.02
    );
  };
  return choiceValid(parsed.data.answers.membership, input.candidates) &&
    choiceValid(parsed.data.answers.part, input.parts)
    ? parsed.data
    : undefined;
}

function reportedTokens(value: unknown): number | undefined {
  const tokens = z
    .object({ usage: z.object({ input_tokens: z.number().int().min(0) }) })
    .safeParse(value);
  return tokens.success ? tokens.data.usage.input_tokens : undefined;
}

// Bounded body read: an oversized response is abandoned before parsing, never buffered whole.
async function readLimited(response: Response): Promise<string | undefined> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > RESPONSE_BYTES) {
      await reader.cancel().catch(() => {});
      return undefined;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export class DecisionClient {
  private readonly cache = new Map<string, Extract<DecisionResult, { state: "answered" }>>();
  private readonly endpoint: URL;
  private readonly deadlineMs: number;
  private readonly maxAttempts: number;
  private readonly send: typeof fetch;
  private requests = 0;
  private spent = 0;

  constructor(private readonly options: DecisionClientOptions) {
    const endpoint = new URL(options.endpoint);
    const loopback = ["127.0.0.1", "[::1]", "localhost"].includes(endpoint.hostname);
    if (
      endpoint.protocol !== "https:" &&
      !(options.allowLoopback && loopback && endpoint.protocol === "http:")
    )
      throw new Error("Decision endpoint must be HTTPS");
    this.endpoint = endpoint;
    this.deadlineMs = z
      .number()
      .int()
      .min(100)
      .max(10_000)
      .parse(options.deadlineMs ?? 8000);
    this.maxAttempts = z
      .number()
      .int()
      .min(1)
      .max(3)
      .parse(options.maxAttempts ?? 3);
    this.send = options.fetch ?? fetch;
    z.strictObject({
      maxRequests: z.number().int().min(1).max(1000),
      maxSpendUsd: z.number().positive().max(10),
      pricePerMillionInputTokensUsd: z.number().positive().max(100),
    }).parse(options.budget);
  }

  get usage(): { readonly requests: number; readonly spentUsd: number } {
    return { requests: this.requests, spentUsd: this.spent };
  }

  async decide(untrusted: DecisionCase, signal: AbortSignal): Promise<DecisionResult> {
    const parsed = decisionCaseSchema.safeParse(untrusted);
    if (!parsed.success) return { state: "failed", code: "invalid-request", attempts: 0 };
    const input: DecisionCase = parsed.data;
    const request = decisionRequest(input);
    // Closed-set questions are capped at 255 options, sentinels included.
    if (Math.max(input.candidates.length, input.parts.length) + sentinels.length > 255)
      return { state: "failed", code: "request-limit", attempts: 0 };
    const body = JSON.stringify(request);
    if (Buffer.byteLength(body, "utf8") > REQUEST_BYTES)
      return { state: "failed", code: "request-limit", attempts: 0 };
    // Exact permitted input plus every version that could change the answer.
    const key = canonical([
      decisionModel,
      decisionRubric,
      this.options.policy,
      this.options.evidence,
      request,
    ]);
    const hit = this.cache.get(key);
    if (hit) return { ...hit, cached: true };
    const deadline = AbortSignal.timeout(this.deadlineMs);
    const combined = AbortSignal.any([signal, deadline]);
    const stop = (): Failure => (signal.aborted ? "cancelled" : "timeout");
    let attempts = 0;
    let last: Failure = "unavailable";
    // Pre-send upper bound: byte-level tokens never outnumber the request's UTF-8 bytes, so a
    // call that passes this check cannot push spend past the cap unless usage is over-reported.
    const { maxRequests, maxSpendUsd, pricePerMillionInputTokensUsd: price } = this.options.budget;
    const estimate = (Buffer.byteLength(body, "utf8") * price) / 1_000_000;
    while (attempts < this.maxAttempts) {
      if (combined.aborted) return { state: "failed", code: stop(), attempts };
      if (this.requests >= maxRequests || this.spent + estimate > maxSpendUsd)
        return { state: "failed", code: "budget-exhausted", attempts };
      this.requests++;
      this.spent += estimate;
      attempts++;
      let response: Response;
      try {
        response = await this.send(this.endpoint, {
          method: "POST",
          headers: {
            authorization: `Bearer ${this.options.apiKey}`,
            "content-type": "application/json",
          },
          body,
          signal: combined,
          // Never follow redirects: a new location could drop HTTPS or change host.
          redirect: "manual",
        });
      } catch {
        if (combined.aborted) return { state: "failed", code: stop(), attempts };
        last = "unavailable";
        if (!(await this.backoff(attempts, combined))) break;
        continue;
      }
      if (response.type === "opaqueredirect" || (response.status >= 300 && response.status < 400)) {
        await response.body?.cancel().catch(() => {});
        return { state: "failed", code: "redirect-refused", attempts };
      }
      // Terminal statuses release their bodies before returning.
      if (response.status === 401 || response.status === 422) {
        await response.body?.cancel().catch(() => {});
        return {
          state: "failed",
          code: response.status === 401 ? "unauthorized" : "rejected",
          attempts,
        };
      }
      if (response.status === 429 || response.status === 529) {
        last = response.status === 429 ? "rate-limited" : "overloaded";
        await response.body?.cancel().catch(() => {});
        if (!(await this.backoff(attempts, combined))) break;
        continue;
      }
      let value: unknown;
      try {
        if (!response.ok) await response.body?.cancel().catch(() => {});
        const text = response.ok ? await readLimited(response) : undefined;
        value = text === undefined ? undefined : JSON.parse(text);
      } catch {
        if (combined.aborted) return { state: "failed", code: stop(), attempts };
        value = undefined;
      }
      // Reported usage is charged even when the answers are invalid; over-reporting stops later calls.
      const tokens = reportedTokens(value);
      if (tokens !== undefined) this.spent += Math.max(0, (tokens * price) / 1_000_000 - estimate);
      const valid = validateAnswers(input, value);
      if (!valid) return { state: "failed", code: "invalid-response", attempts };
      const answered = {
        state: "answered",
        model: valid.model,
        answers: valid.answers,
        usage: { inputTokens: valid.usage.input_tokens },
        attempts,
        cached: false,
      } as const;
      this.cache.set(key, answered);
      if (this.cache.size > CACHE_ENTRIES) this.cache.delete(this.cache.keys().next().value!);
      return answered;
    }
    return { state: "failed", code: combined.aborted ? stop() : last, attempts };
  }

  // Backoff stays inside the total deadline; it never extends it.
  private async backoff(attempt: number, signal: AbortSignal): Promise<boolean> {
    if (attempt >= this.maxAttempts || signal.aborted) return false;
    const delay = 100 * 2 ** (attempt - 1);
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        signal.removeEventListener("abort", abort);
        resolve(!signal.aborted);
      }, delay);
      const abort = () => {
        clearTimeout(timer);
        resolve(false);
      };
      signal.addEventListener("abort", abort, { once: true });
    });
  }
}
