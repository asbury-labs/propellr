// Host-only propellr-redaction/1 and capture binding (specs/semantic-text-capture-protocol.md).
// Runs after boundary validation and before any adapter, cache, log, archive or provider sees
// text. Only the redacted sidecar is returned; raw captured strings are discarded here.
import type { Evidence, ScanResult } from "../contracts.js";
import type {
  RedactedField,
  RedactedTextCapture,
  RedactedTextTarget,
  TextTarget,
} from "../review/contracts.js";
import {
  redactedTextCaptureSchema,
  textCaptureByteLimit,
  textCaptureSchema,
  textStringLimit,
  textTargetByteLimit,
} from "../review/validation.js";
import { utf8Bytes } from "../components/validation.js";
import { redactionVersion, textCollector, textDiagnostics, textRules } from "../analysis.js";

// Fixed order. Character classes are disjoint around each quantifier, so matching stays linear
// per start position on bounded (160-unit) strings. Conservative heuristics, not PII detection.
// No word boundary: a later rule can change the preceding character, never the URL itself.
const url = /https?:\/\/[^\s?#]*(\?[^\s#]*)?(#\S*)?/gi;
// Unicode letters in local part and labels; the suffix must end before another letter.
const email = /[\p{L}\p{N}._%+-]+@(?:[\p{L}\p{N}-]+\.)+\p{L}{2,}(?!\p{L})/gu;
const phone = /(?<![A-Za-z0-9+])\+?[0-9(][0-9 ().-]*[0-9](?![A-Za-z0-9])/g;
const digits = /[0-9]{7,}/g;
const token = /(?<![A-Za-z0-9_\-/+=])[A-Za-z0-9_\-/+=]{24,}(?![A-Za-z0-9_\-/+=])/g;

// One pass of the five rules in their fixed order.
function redactOnce(value: string): string {
  return value
    .replace(url, (match, query?: string, fragment?: string) => {
      if (query === undefined && fragment === undefined) return match;
      const kept = match.slice(0, match.length - (query?.length ?? 0) - (fragment?.length ?? 0));
      return `${kept}${query === undefined ? "" : "[query]"}${fragment === undefined ? "" : "[fragment]"}`;
    })
    .replace(email, "[email]")
    .replace(phone, (match) =>
      (match.match(/[0-9]/g)?.length ?? 0) >= 7 && (match.startsWith("+") || /[ ().-]/.test(match))
        ? "[phone]"
        : match,
    )
    .replace(digits, "[digits]")
    .replace(token, (match) =>
      /^[0-9a-f]+$/i.test(match) || (/[A-Za-z]/.test(match) && /[0-9]/.test(match))
        ? "[token]"
        : match,
    );
}
// A replacement can join tokens (a phone match spans spaces), exposing text to an earlier rule.
// Repeating the fixed order to a fixed point keeps the result deterministic and idempotent.
// Generated mixtures converge within two changing passes; the cap only bounds work.
export function redactText(value: string): { readonly value: string; readonly changed: boolean } {
  let current = value;
  for (let pass = 0; pass < 16; pass++) {
    const next = redactOnce(current);
    if (next === current) break;
    current = next;
  }
  return { value: current, changed: current !== value };
}

class Limit extends Error {}
type Named = Extract<TextTarget, { name: { state: "available" } }>;
type RedactedNamed = Extract<RedactedTextTarget, { name: { state: "available" } }>;
const isNamed = (record: RedactedTextTarget): record is RedactedNamed =>
  record.name.state === "available";
const key = (rule: ScanResult["rules"][number]["rule"], target: TextTarget["target"]) =>
  JSON.stringify([
    rule.id,
    rule.version,
    target.pageId,
    target.documentId,
    target.path.map(({ kind, selector }) => [kind, selector]),
  ]);

// The successful check the raw scan retained: the name source for button-name, else the first
// true ANY check. A capture record must name exactly this check.
function passedCheck(rule: string, evidence: readonly Evidence[]): string | undefined {
  const observed = evidence[0]?.observed;
  if (observed === null || typeof observed !== "object" || Array.isArray(observed)) return;
  const record = observed as { readonly [key: string]: unknown };
  if (rule === "button-name")
    return typeof record["source"] === "string" ? record["source"] : undefined;
  if (!Array.isArray(record["any"])) return;
  const first = (record["any"] as readonly unknown[]).find(
    (entry) => (entry as { result?: unknown } | null)?.result === true,
  ) as { id?: unknown } | undefined;
  return typeof first?.id === "string" ? first.id : undefined;
}

// Binds the page-derived capture to its completed raw scan, then redacts it.
export function bindTextCapture(scan: ScanResult, raw: unknown): RedactedTextCapture {
  const root = scan.scope.include[0];
  const header = {
    schema: "propellr-text-capture/1",
    collector: textCollector,
    scan: { id: scan.id, epoch: scan.epoch, pageId: root.pageId, documentId: root.documentId },
  } as const;
  const unavailable = (code: keyof typeof textDiagnostics): RedactedTextCapture => ({
    ...header,
    state: "unavailable",
    reason: { code, message: textDiagnostics[code] },
  });
  if (raw === undefined) return unavailable("text-capture-unavailable");
  const parsed = textCaptureSchema.safeParse(raw);
  // Validation messages can quote page strings; only a fixed code leaves this function.
  if (!parsed.success) return unavailable("text-capture-invalid");
  const capture = parsed.data;
  // Matching targets alone cannot tell two scans of an unchanged population apart.
  if (capture.scan.id !== scan.id || capture.scan.epoch !== scan.epoch)
    return unavailable("text-capture-invalid");
  if (scan.coverage.state === "stale") return unavailable("text-capture-stale");
  if (capture.state === "unavailable") return unavailable(capture.reason.code);
  // Exactly one record per retained pass of a captured rule, at the same version, target and
  // successful check.
  const passes = new Map(
    scan.rules.flatMap((result) =>
      result.state === "evaluated" && (textRules as readonly string[]).includes(result.rule.id)
        ? result.occurrences
            .filter(({ outcome }) => outcome === "pass")
            .map(
              ({ target, evidence }) =>
                [key(result.rule, target), passedCheck(result.rule.id, evidence)] as const,
            )
        : [],
    ),
  );
  const records = new Set(capture.targets.map(({ rule, target }) => key(rule, target)));
  if (
    records.size !== passes.size ||
    capture.targets.some(({ rule, target, check }) => {
      const passed = passes.get(key(rule, target));
      return passed === undefined || passed !== check;
    })
  )
    return unavailable("text-capture-invalid");
  try {
    const redacted = capture.targets.map(redactTarget);
    // Placeholders cannot establish equivalence: a redacted counted name disables duplicates.
    const nameRedacted = redacted.some(({ redacted }) =>
      (redacted as readonly RedactedField[]).includes("name"),
    );
    const targets = redacted.map((record): RedactedTextTarget => {
      if (!isNamed(record)) return record;
      const sameName =
        nameRedacted && record.sameName.state === "available"
          ? ({ state: "unavailable", reason: "name-redacted" } as const)
          : record.sameName;
      const next: RedactedNamed = {
        ...record,
        sameName,
        review:
          record.review.state === "available"
            ? {
                ...record.review,
                distinguishable: sameName.state === "available" ? "available" : "unavailable",
              }
            : record.review,
      };
      if (utf8Bytes(JSON.stringify(next)) > textTargetByteLimit) throw new Limit();
      return next;
    });
    const result: RedactedTextCapture = {
      ...header,
      state: "available",
      redaction: { version: redactionVersion },
      targets,
      gaps: capture.gaps,
    };
    if (utf8Bytes(JSON.stringify(result)) > textCaptureByteLimit) throw new Limit();
    return redactedTextCaptureSchema.safeParse(result).success
      ? result
      : unavailable("text-capture-invalid");
  } catch (error) {
    if (error instanceof Limit) return unavailable("text-capture-limit");
    throw error;
  }
}

function redactTarget(record: TextTarget): RedactedTextTarget {
  if (record.name.state !== "available")
    return {
      ...record,
      name: record.name,
      redacted: [],
      review: { state: "unavailable", reason: "name-unavailable" },
    };
  const named = record as Named;
  const changed: RedactedField[] = [];
  // A replacement that expands a string beyond its bound abandons the sidecar, never truncates.
  const apply = <T extends { readonly state: string }>(field: RedactedField, value: T): T => {
    if (value.state !== "available" || !("value" in value) || typeof value.value !== "string")
      return value;
    const result = redactText(value.value);
    if (result.value.length > textStringLimit) throw new Limit();
    if (result.changed) changed.push(field);
    return { ...value, value: result.value };
  };
  const name = apply("name", named.name);
  const heading = apply("heading", named.heading);
  const container = apply("container", named.container);
  const image = named.image && {
    alt: apply("alt", named.image.alt),
    basename: apply("basename", named.image.basename),
  };
  const essential = changed.some((field) => field !== "basename");
  const filename =
    image === undefined
      ? "not-applicable"
      : image.basename.state === "available" && !changed.includes("basename")
        ? "available"
        : "unavailable";
  const next: RedactedTextTarget = {
    ...named,
    name,
    heading,
    container,
    ...(image ? { image } : {}),
    redacted: changed,
    review: essential
      ? { state: "redacted-unavailable", reason: "essential-text-redacted" }
      : {
          state: "available",
          filename,
          distinguishable: named.sameName.state === "available" ? "available" : "unavailable",
        },
  };
  if (utf8Bytes(JSON.stringify(next)) > textTargetByteLimit) throw new Limit();
  return next;
}
