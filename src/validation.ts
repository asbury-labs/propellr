import { z } from "zod";
import type { OperationId, PageId, SessionId } from "./contracts.js";

// Wire identities are opaque, bounded tokens. Prefixes prevent cross-kind reuse.
const token = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/);
export const sessionIdSchema = z
  .string()
  .max(128)
  .regex(/^session_[A-Za-z0-9-]+$/)
  .transform((id) => id as SessionId);
export const operationIdSchema = z
  .string()
  .max(128)
  .regex(/^operation_[A-Za-z0-9-]+$/)
  .transform((id) => id as OperationId);
export const pageIdSchema = z
  .string()
  .max(128)
  .regex(/^page_[A-Za-z0-9-]+$/)
  .transform((id) => id as PageId);
export const versionRefSchema = z.strictObject({ id: token, version: token }).readonly();
const jsonObjectSchema = z.record(z.string().max(256), z.json()).readonly();

export const targetSchema = z
  .strictObject({
    pageId: pageIdSchema,
    documentId: token,
    path: z
      .array(
        z
          .strictObject({
            kind: z.enum(["frame", "shadow", "element"]),
            selector: z.string().min(1).max(4096),
          })
          .readonly(),
      )
      .max(64)
      .readonly(),
  })
  .readonly();

export const scopeSchema = z
  .strictObject({
    include: z
      .tuple([targetSchema], targetSchema)
      .refine((targets) => targets.length <= 256, "Too many included targets")
      .readonly(),
    exclude: z.array(targetSchema).max(256).readonly(),
  })
  .readonly();
export const ruleSelectionSchema = z
  .strictObject({ id: token, options: jsonObjectSchema })
  .readonly();
export const scanRequestSchema = z
  .strictObject({
    mode: z.enum(["full", "incremental"]),
    scope: scopeSchema,
    rules: z.discriminatedUnion("kind", [
      z.strictObject({ kind: z.literal("defaults") }).readonly(),
      z
        .strictObject({
          kind: z.literal("explicit"),
          rules: z
            .tuple([ruleSelectionSchema], ruleSelectionSchema)
            .refine(
              (rules) =>
                rules.length <= 1024 && new Set(rules.map((rule) => rule.id)).size === rules.length,
              "Rule IDs must be unique and bounded",
            )
            .readonly(),
        })
        .readonly(),
    ]),
  })
  .readonly();

const meta = { protocol: z.literal("propellr/0.1"), requestId: token };
const sessionMeta = { ...meta, sessionId: sessionIdSchema };

// One schema map owns all command inputs. Unknown keys cannot self-grant authority.
export const commandSchemas = {
  open: z
    .strictObject({
      ...meta,
      policy: versionRefSchema,
      target: z.discriminatedUnion("kind", [
        z
          .strictObject({
            kind: z.literal("managed"),
            browser: z.enum(["chromium", "firefox", "webkit"]),
          })
          .readonly(),
        z.strictObject({ kind: z.literal("attached"), targetId: token }).readonly(),
      ]),
    })
    .readonly(),
  inspect: z.strictObject({ ...sessionMeta, operationId: operationIdSchema.optional() }).readonly(),
  scan: z.strictObject({ ...sessionMeta, scan: scanRequestSchema }).readonly(),
  // Opt-in capability component-analysis@1; same input shape and admission as scan.
  analyzeComponents: z.strictObject({ ...sessionMeta, scan: scanRequestSchema }).readonly(),
  runPlaybook: z
    .strictObject({
      ...sessionMeta,
      playbook: versionRefSchema,
      inputs: jsonObjectSchema,
      bindings: z.record(token, targetSchema).readonly(),
      secretRefs: z.record(token, token).readonly(),
    })
    .readonly(),
  subscribe: z.strictObject({ ...sessionMeta, after: token.optional() }).readonly(),
  cancel: z.strictObject({ ...sessionMeta, operationId: operationIdSchema }).readonly(),
  end: z.strictObject(sessionMeta).readonly(),
};

export type CommandInputs = {
  readonly [Name in keyof typeof commandSchemas]: z.infer<(typeof commandSchemas)[Name]>;
};
export type CommandName = keyof CommandInputs;
export const requestSchema = z.discriminatedUnion("command", [
  z.strictObject({ command: z.literal("open"), input: commandSchemas.open }).readonly(),
  z.strictObject({ command: z.literal("inspect"), input: commandSchemas.inspect }).readonly(),
  z.strictObject({ command: z.literal("scan"), input: commandSchemas.scan }).readonly(),
  z
    .strictObject({
      command: z.literal("analyzeComponents"),
      input: commandSchemas.analyzeComponents,
    })
    .readonly(),
  z
    .strictObject({ command: z.literal("runPlaybook"), input: commandSchemas.runPlaybook })
    .readonly(),
  z.strictObject({ command: z.literal("subscribe"), input: commandSchemas.subscribe }).readonly(),
  z.strictObject({ command: z.literal("cancel"), input: commandSchemas.cancel }).readonly(),
  z.strictObject({ command: z.literal("end"), input: commandSchemas.end }).readonly(),
]);
export type Request = z.infer<typeof requestSchema>;
export type ValidatedTarget = z.infer<typeof targetSchema>;
export type ValidatedScope = z.infer<typeof scopeSchema>;
export type ValidatedRuleSelection = z.infer<typeof ruleSelectionSchema>;
export type ValidatedScanRequest = z.infer<typeof scanRequestSchema>;
export type ValidatedVersionRef = z.infer<typeof versionRefSchema>;
