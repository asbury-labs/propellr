// Host-only, advisory decision adapter for the TypeSafe System One API (Jev). Not wired into
// any operation. Live use requires the approval record below (protocol amendment 2026-09-28).
import { z } from "zod";
import type { VersionRef } from "../contracts.js";
import type { DecisionCase } from "../components/discovery.js";
import { canonical } from "../reporting/index.js";
import { isStructureLabel } from "../analysis.js";
import { BoundedTransport } from "./decision-transport.js";
import type { TransportFailure } from "./decision-transport.js";

export const decisionModel = "jev-1.13.0";
// Version 2 (amendment 2026-09-29): the part question names each option's candidate and excludes
// the root's own label.
export const decisionRubric = { id: "component-attribution-questions", version: "2" } as const;
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
export const sentinels = ["none", "insufficient-evidence"] as const;
// Egress boundary: only text-free structural labels, opaque shapes and code-generated IDs.
const label = z.string().refine(isStructureLabel, "Unknown structural label");
export const decisionCaseSchema = z
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
export const CACHE_ENTRIES = 256;

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
      readonly usage: { readonly inputTokens: number; readonly outputTokens: number };
      readonly attempts: number;
      readonly cached: boolean;
    }
  | {
      readonly state: "failed";
      readonly code: TransportFailure | "invalid-request";
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
          "Which part of the component instance chosen in the membership question is the target element? Each option is a label path joined by '>': it starts at the element directly below that instance's root and ends at the target. The root's own label is never part of the path. Choose the option paired with your membership choice; if membership is none or insufficient-evidence, give the same answer here.",
        criteria: options(input.parts, (value, index) => {
          const { distance, label } = link(index);
          return `Use when the root is ${input.candidates[index]} (distance ${distance}, label ${label}): path ${value}, excluding ${label} itself.`;
        }),
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
  private readonly transport: BoundedTransport;

  constructor(private readonly options: DecisionClientOptions) {
    const { maxRequests, maxSpendUsd, pricePerMillionInputTokensUsd } = z
      .strictObject({
        maxRequests: z.number().int().min(1).max(1000),
        maxSpendUsd: z.number().positive().max(10),
        pricePerMillionInputTokensUsd: z.number().positive().max(100),
      })
      .parse(options.budget);
    this.transport = new BoundedTransport({
      endpoint: options.endpoint,
      headers: { authorization: `Bearer ${options.apiKey}` },
      ...(options.deadlineMs === undefined ? {} : { deadlineMs: options.deadlineMs }),
      ...(options.maxAttempts === undefined ? {} : { maxAttempts: options.maxAttempts }),
      ...(options.allowLoopback === undefined ? {} : { allowLoopback: options.allowLoopback }),
      ...(options.fetch === undefined ? {} : { fetch: options.fetch }),
      budget: { maxRequests, maxSpendUsd },
      // Jev output tokens are free.
      pricing: {
        inputPerMillionUsd: pricePerMillionInputTokensUsd,
        outputPerMillionUsd: 0,
        maxOutputTokens: 0,
      },
      status: (status) =>
        status === 401
          ? { fail: "unauthorized" }
          : status === 422
            ? { fail: "rejected" }
            : status === 429
              ? { retry: "rate-limited" }
              : status === 529
                ? { retry: "overloaded" }
                : undefined,
      usage: (value) => {
        const reported = z
          .object({ usage: z.object({ input_tokens: z.number().int().min(0) }) })
          .safeParse(value);
        return reported.success
          ? { input: reported.data.usage.input_tokens, output: 0 }
          : undefined;
      },
    });
  }

  get usage(): { readonly requests: number; readonly spentUsd: number } {
    return this.transport.usage;
  }

  async decide(untrusted: DecisionCase, signal: AbortSignal): Promise<DecisionResult> {
    const parsed = decisionCaseSchema.safeParse(untrusted);
    if (!parsed.success) return { state: "failed", code: "invalid-request", attempts: 0 };
    const input: DecisionCase = parsed.data;
    const request = decisionRequest(input);
    // Closed-set questions are capped at 255 options, sentinels included.
    if (Math.max(input.candidates.length, input.parts.length) + sentinels.length > 255)
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
    // A cache hit made no attempt; only the original answer carried attempts.
    if (hit) return { ...hit, cached: true, attempts: 0 };
    const sent = await this.transport.post(JSON.stringify(request), signal);
    if (!sent.ok) return { state: "failed", code: sent.code, attempts: sent.attempts };
    const valid = validateAnswers(input, sent.value);
    if (!valid) return { state: "failed", code: "invalid-response", attempts: sent.attempts };
    const answered = {
      state: "answered",
      model: valid.model,
      answers: valid.answers,
      usage: { inputTokens: valid.usage.input_tokens, outputTokens: valid.usage.output_tokens },
      attempts: sent.attempts,
      cached: false,
    } as const;
    this.cache.set(key, answered);
    if (this.cache.size > CACHE_ENTRIES) this.cache.delete(this.cache.keys().next().value!);
    return answered;
  }
}
