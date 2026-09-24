// Host-only, advisory decision adapter for the TypeSafe System One API (Jev). Not wired into
// any operation. Phase 2 makes no live call: provider access, spend and terms are unapproved.
import { z } from "zod";
import type { VersionRef } from "../contracts.js";
import type { DecisionCase } from "../components/discovery.js";
import { canonical } from "../reporting/index.js";

export const decisionModel = "jev-1.13.0";
export const decisionRubric = { id: "component-attribution-questions", version: "1" } as const;
const sentinels = ["none", "insufficient-evidence"] as const;
const REQUEST_BYTES = 65_536;
type Failure = Extract<DecisionResult, { state: "failed" }>["code"];
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
        | "request-limit";
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

export class DecisionClient {
  private readonly cache = new Map<string, Extract<DecisionResult, { state: "answered" }>>();
  private readonly endpoint: URL;
  private readonly deadlineMs: number;
  private readonly maxAttempts: number;
  private readonly send: typeof fetch;

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
  }

  async decide(input: DecisionCase, signal: AbortSignal): Promise<DecisionResult> {
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
    while (attempts < this.maxAttempts) {
      if (combined.aborted) return { state: "failed", code: stop(), attempts };
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
        });
      } catch {
        if (combined.aborted) return { state: "failed", code: stop(), attempts };
        last = "unavailable";
        if (!(await this.backoff(attempts, combined))) break;
        continue;
      }
      if (response.status === 401) return { state: "failed", code: "unauthorized", attempts };
      if (response.status === 422) return { state: "failed", code: "rejected", attempts };
      if (response.status === 429 || response.status === 529) {
        last = response.status === 429 ? "rate-limited" : "overloaded";
        await response.body?.cancel().catch(() => {});
        if (!(await this.backoff(attempts, combined))) break;
        continue;
      }
      let value: unknown;
      try {
        value = response.ok ? await response.json() : undefined;
      } catch {
        if (combined.aborted) return { state: "failed", code: stop(), attempts };
        value = undefined;
      }
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
