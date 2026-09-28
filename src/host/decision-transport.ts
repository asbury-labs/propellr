// Shared, bounded HTTPS transport for advisory decision providers. Host-only; never logs bodies.
import { z } from "zod";

const REQUEST_BYTES = 65_536;
const RESPONSE_BYTES = 262_144;

export type TransportFailure =
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
  | "redirect-refused";
// Provider-specific status handling: retry, fail terminally, or read the body.
export type StatusRule = (
  status: number,
) => { readonly retry: TransportFailure } | { readonly fail: TransportFailure } | undefined;
export interface Pricing {
  readonly inputPerMillionUsd: number;
  readonly outputPerMillionUsd: number;
  // Output ceiling the provider enforces per request; 0 when output is free.
  readonly maxOutputTokens: number;
}
export interface TransportOptions {
  readonly endpoint: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly deadlineMs?: number;
  readonly maxAttempts?: number;
  // Plain HTTP is accepted only for an explicit loopback test endpoint.
  readonly allowLoopback?: boolean;
  readonly fetch?: typeof fetch;
  readonly budget: { readonly maxRequests: number; readonly maxSpendUsd: number };
  readonly pricing: Pricing;
  readonly status: StatusRule;
  // Reported usage, if the body carries any; used to replace the pre-send reservation.
  readonly usage: (
    value: unknown,
  ) => { readonly input: number; readonly output: number } | undefined;
}
export type TransportResult =
  | { readonly ok: true; readonly value: unknown; readonly attempts: number }
  | { readonly ok: false; readonly code: TransportFailure; readonly attempts: number };

const budgetSchema = z.strictObject({
  maxRequests: z.number().int().min(1).max(1000),
  maxSpendUsd: z.number().positive().max(10),
});
const pricingSchema = z.strictObject({
  inputPerMillionUsd: z.number().positive().max(100),
  outputPerMillionUsd: z.number().min(0).max(500),
  maxOutputTokens: z.number().int().min(0).max(8192),
});

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

export class BoundedTransport {
  private readonly endpoint: URL;
  private readonly deadlineMs: number;
  private readonly maxAttempts: number;
  private readonly send: typeof fetch;
  private requests = 0;
  private spent = 0;

  constructor(private readonly options: TransportOptions) {
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
    budgetSchema.parse(options.budget);
    pricingSchema.parse(options.pricing);
  }

  get usage(): { readonly requests: number; readonly spentUsd: number } {
    return { requests: this.requests, spentUsd: this.spent };
  }

  async post(body: string, signal: AbortSignal): Promise<TransportResult> {
    const bytes = Buffer.byteLength(body, "utf8");
    if (bytes > REQUEST_BYTES) return { ok: false, code: "request-limit", attempts: 0 };
    const { inputPerMillionUsd, outputPerMillionUsd, maxOutputTokens } = this.options.pricing;
    const cost = (input: number, output: number) =>
      (input * inputPerMillionUsd + output * outputPerMillionUsd) / 1_000_000;
    // Upper bound: byte-level tokens never outnumber UTF-8 bytes; output is capped per request.
    const reservation = cost(bytes, maxOutputTokens);
    const deadline = AbortSignal.timeout(this.deadlineMs);
    const combined = AbortSignal.any([signal, deadline]);
    const stop = (): TransportFailure => (signal.aborted ? "cancelled" : "timeout");
    let attempts = 0;
    let last: TransportFailure = "unavailable";
    while (attempts < this.maxAttempts) {
      if (combined.aborted) return { ok: false, code: stop(), attempts };
      const { maxRequests, maxSpendUsd } = this.options.budget;
      if (this.requests >= maxRequests || this.spent + reservation > maxSpendUsd)
        return { ok: false, code: "budget-exhausted", attempts };
      this.requests++;
      this.spent += reservation;
      attempts++;
      let response: Response;
      try {
        response = await this.send(this.endpoint, {
          method: "POST",
          headers: { ...this.options.headers, "content-type": "application/json" },
          body,
          signal: combined,
          // Never follow redirects: a new location could drop HTTPS or change host.
          redirect: "manual",
        });
      } catch {
        if (combined.aborted) return { ok: false, code: stop(), attempts };
        last = "unavailable";
        if (!(await this.backoff(attempts, combined))) break;
        continue;
      }
      if (response.type === "opaqueredirect" || (response.status >= 300 && response.status < 400)) {
        await response.body?.cancel().catch(() => {});
        return { ok: false, code: "redirect-refused", attempts };
      }
      const rule = this.options.status(response.status);
      if (rule && "fail" in rule) {
        await response.body?.cancel().catch(() => {});
        return { ok: false, code: rule.fail, attempts };
      }
      if (rule && "retry" in rule) {
        last = rule.retry;
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
        if (combined.aborted) return { ok: false, code: stop(), attempts };
        value = undefined;
      }
      // Reported usage replaces the reservation, whether higher or lower, even for invalid answers.
      const reported = this.options.usage(value);
      if (reported) this.spent += cost(reported.input, reported.output) - reservation;
      return value === undefined
        ? { ok: false, code: "invalid-response", attempts }
        : { ok: true, value, attempts };
    }
    return { ok: false, code: combined.aborted ? stop() : last, attempts };
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
