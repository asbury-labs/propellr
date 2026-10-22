import { z } from "zod";
import type { ScanId } from "../contracts.js";
import { pageIdSchema, targetSchema, versionRefSchema } from "../validation.js";
import { utf8Bytes } from "../components/validation.js";
import {
  redactionVersion,
  structureRoles,
  textChecks,
  textCollector,
  textDiagnostics,
  textForcedReasons,
  textRules,
} from "../analysis.js";

// Boundary schemas for propellr-text-capture/1. Browser analysis imports only inferred types.
// Every string is page-derived and untrusted until validated and redacted on the host.
export const textStringLimit = 160;
export const textTargetByteLimit = 1024;
export const textCaptureByteLimit = 65_536;
export const textTargetLimit = 96;

const text = z.string().max(textStringLimit);
const available = z.strictObject({ state: z.literal("available"), value: text }).readonly();
const absent = z.strictObject({ state: z.literal("absent") }).readonly();
const unavailable = <const T extends readonly [string, ...string[]]>(reasons: T) =>
  z.strictObject({ state: z.literal("unavailable"), reason: z.enum(reasons) }).readonly();

export const nameReasons = [
  "control-value",
  "native-default",
  "non-text-check",
  "hidden-source",
  "excluded-target",
  "excluded-source",
  "truncated",
] as const;
const contextReasons = ["too-long", "unsupported", "excluded-source", "empty"] as const;
const contextSchema = z.discriminatedUnion("state", [
  available,
  absent,
  unavailable(contextReasons),
]);
export const sameNameReasons = [
  "selection-incomplete",
  "population-incomplete",
  "name-unavailable",
  "name-redacted",
] as const;
const sameNameSchema = z.discriminatedUnion("state", [
  z
    .strictObject({
      state: z.literal("available"),
      count: z.number().int().min(1).max(textTargetLimit),
    })
    .readonly(),
  unavailable(sameNameReasons),
]);
const imageSchema = z
  .strictObject({
    alt: z.discriminatedUnion("state", [available, absent, unavailable(["too-long"])]),
    basename: z.discriminatedUnion("state", [
      available,
      unavailable(["no-src", "invalid-url", "unsupported-url", "no-basename", "too-long"]),
    ]),
  })
  .readonly();
const roleSchema = z.enum([...structureRoles, "unknown"]);
const ruleSchema = versionRefSchema.refine(
  ({ id }) => (textRules as readonly string[]).includes(id),
  "Not a captured naming rule",
);
const base = {
  target: targetSchema,
  rule: ruleSchema,
  check: z.string().max(64),
  role: roleSchema,
};
const namedShape = {
  ...base,
  name: available,
  heading: contextSchema,
  container: contextSchema,
  sameName: sameNameSchema,
  image: imageSchema.optional(),
};
// Unavailable-name records carry identity and check metadata only, never page strings.
const unnamedShape = { ...base, name: unavailable(nameReasons) };
const namedRecord = z.strictObject(namedShape).readonly();
const unnamedRecord = z.strictObject(unnamedShape).readonly();
type Record = z.infer<typeof namedRecord> | z.infer<typeof unnamedRecord>;

const imageRules = new Set<string>(["image-alt", "input-image-alt"]);
const forced = new Map<string, string>(Object.entries(textForcedReasons));
function recordIssues(record: Record): string[] {
  const issues: string[] = [];
  const rule = record.rule.id as keyof typeof textChecks;
  if (!(textChecks[rule] as readonly string[]).includes(record.check))
    issues.push("Check is not allowlisted for this rule");
  const reason = forced.get(record.check);
  if (reason !== undefined && record.name.state === "available")
    issues.push("Check never yields capturable text");
  if (
    reason !== undefined &&
    record.name.state === "unavailable" &&
    record.name.reason !== reason &&
    record.name.reason !== "excluded-target"
  )
    issues.push("Unavailable reason contradicts the check");
  if (record.name.state === "available") {
    // Only an authored empty alt is an available empty name.
    if (!record.name.value && record.check !== "has-alt") issues.push("Empty available name");
    if (record.name.value !== record.name.value.replace(/\s+/g, " ").trim())
      issues.push("Name is not compacted");
    // Required exactly for image rules: an absent property is as malformed as a stray one.
    const image = "image" in record ? record.image : undefined;
    if ((image !== undefined) !== imageRules.has(record.rule.id))
      issues.push("Image fields belong to exactly the image rules");
  }
  if (utf8Bytes(JSON.stringify(record)) > textTargetByteLimit) issues.push("Target exceeds 1 KiB");
  return issues;
}
const recordSchema = z.union([namedRecord, unnamedRecord]).superRefine((record, context) => {
  for (const message of recordIssues(record)) context.addIssue({ code: "custom", message });
});

const codes = Object.keys(textDiagnostics) as [keyof typeof textDiagnostics];
const diagnosticSchema = z
  .strictObject({ code: z.enum(codes), message: z.string().max(512) })
  .readonly()
  .refine(({ code, message }) => textDiagnostics[code] === message, "Unexpected diagnostic text");
const scanShape = {
  id: z
    .string()
    .max(128)
    .regex(/^scan_[A-Za-z0-9-]+$/)
    .transform((id) => id as ScanId),
  epoch: z.number().int().min(1),
};
const envelope = {
  schema: z.literal("propellr-text-capture/1"),
  collector: versionRefSchema.refine(
    ({ id, version }) => id === textCollector.id && version === textCollector.version,
    "Unknown text collector",
  ),
};
const unique = (records: readonly Record[]) =>
  new Set(records.map(({ rule, target }) => JSON.stringify([rule.id, target]))).size ===
  records.length;
const withinBytes = (value: unknown) => utf8Bytes(JSON.stringify(value)) <= textCaptureByteLimit;

// Browser collector output, before host binding and redaction. The echoed scan identity is
// checked against the completed scan before anything else is trusted.
const provenance = { scan: z.strictObject(scanShape).readonly() };
export const textCaptureSchema = z
  .discriminatedUnion("state", [
    z
      .strictObject({
        ...envelope,
        ...provenance,
        state: z.literal("available"),
        targets: z.array(recordSchema).max(textTargetLimit).readonly(),
        gaps: z.array(diagnosticSchema).max(32).readonly(),
      })
      .readonly()
      .refine(({ targets }) => unique(targets), "Duplicate rule and target records"),
    z
      .strictObject({
        ...envelope,
        ...provenance,
        state: z.literal("unavailable"),
        reason: diagnosticSchema,
      })
      .readonly(),
  ])
  .refine(withinBytes, "Text capture exceeds 64 KiB");

const fields = ["name", "heading", "container", "alt", "basename"] as const;
const reviewSchema = z.discriminatedUnion("state", [
  z
    .strictObject({
      state: z.literal("available"),
      // Image targets compare name and basename; other targets have no filename question.
      filename: z.enum(["available", "unavailable", "not-applicable"]),
      distinguishable: z.enum(["available", "unavailable"]),
    })
    .readonly(),
  z
    .strictObject({
      state: z.literal("redacted-unavailable"),
      reason: z.literal("essential-text-redacted"),
    })
    .readonly(),
  z
    .strictObject({ state: z.literal("unavailable"), reason: z.literal("name-unavailable") })
    .readonly(),
]);
const scanBindingSchema = z
  .strictObject({
    ...scanShape,
    pageId: pageIdSchema,
    documentId: z
      .string()
      .min(1)
      .max(128)
      .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/),
  })
  .readonly();
// Host output after binding and propellr-redaction/1. Raw captured strings never reach it.
const redactedRecordSchema = z
  .union([
    z
      .strictObject({
        ...namedShape,
        redacted: z.array(z.enum(fields)).max(fields.length).readonly(),
        review: reviewSchema,
      })
      .readonly(),
    z
      .strictObject({ ...unnamedShape, redacted: z.tuple([]).readonly(), review: reviewSchema })
      .readonly(),
  ])
  .refine(
    (record) => utf8Bytes(JSON.stringify(record)) <= textTargetByteLimit,
    "Target exceeds 1 KiB",
  )
  .refine(
    (record) => (record.name.state === "available") === (record.review.state !== "unavailable"),
    "Review state contradicts the name",
  );
export const redactedTextCaptureSchema = z
  .discriminatedUnion("state", [
    z
      .strictObject({
        ...envelope,
        state: z.literal("available"),
        scan: scanBindingSchema,
        redaction: z.strictObject({ version: z.literal(redactionVersion) }).readonly(),
        targets: z.array(redactedRecordSchema).max(textTargetLimit).readonly(),
        gaps: z.array(diagnosticSchema).max(32).readonly(),
      })
      .readonly()
      .refine(({ targets }) => unique(targets), "Duplicate rule and target records"),
    z
      .strictObject({
        ...envelope,
        state: z.literal("unavailable"),
        scan: scanBindingSchema,
        reason: diagnosticSchema,
      })
      .readonly(),
  ])
  .refine(withinBytes, "Text capture exceeds 64 KiB");

export type ValidatedTextCapture = z.infer<typeof textCaptureSchema>;
export type ValidatedRedactedTextCapture = z.infer<typeof redactedTextCaptureSchema>;
export type TextField = (typeof redactedFields)[number];
export const redactedFields = fields;
