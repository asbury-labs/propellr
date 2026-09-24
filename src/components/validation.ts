import { z } from "zod";
import type { ScanId } from "../contracts.js";
import { targetSchema, versionRefSchema } from "../validation.js";

// Boundary schemas for component evidence. Browser analysis imports only inferred types.
export const bridgeToken = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/);
// Evidence diagnostics carry codes only; targets live on the attribution itself.
const diagnosticSchema = z
  .strictObject({ code: bridgeToken, message: z.string().max(512) })
  .readonly();
const nonEmpty = <T extends z.ZodType>(item: T, max: number) =>
  z
    .tuple([item], item)
    .refine((items) => items.length <= max, `At most ${max} entries`)
    .readonly();
const unique = (values: readonly string[]) => new Set(values).size === values.length;
export function utf8Bytes(text: string): number {
  let bytes = 0;
  for (const character of text) {
    const code = character.codePointAt(0)!;
    bytes += code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
  }
  return bytes;
}
export const componentByteLimit = 131_072;
const withinBytes = (value: unknown) => utf8Bytes(JSON.stringify(value)) <= componentByteLimit;

// Host-local source reference. Never read, resolved or exported by phase 1.
const sourceRefSchema = z
  .string()
  .min(1)
  .max(512)
  .refine(
    (path) =>
      !path.startsWith("/") &&
      !/[\\:\0]/.test(path) &&
      path.split("/").every((segment) => segment && segment !== "." && segment !== ".."),
    "Source reference must be a relative POSIX path without traversal",
  );
export const bindingSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("template") }).readonly(),
  z.strictObject({ kind: z.literal("callsite") }).readonly(),
  z.strictObject({ kind: z.literal("data-record"), field: bridgeToken }).readonly(),
  z.strictObject({ kind: z.literal("unreviewed") }).readonly(),
]);
const partSchema = z.strictObject({ key: bridgeToken, binding: bindingSchema }).readonly();
const definitionSchema = z
  .strictObject({
    id: bridgeToken,
    displayName: z.string().min(1).max(128),
    sourceRef: sourceRefSchema.optional(),
    variants: z.array(bridgeToken).max(32).readonly(),
    parts: z.array(partSchema).max(32).readonly(),
  })
  .readonly()
  .refine(
    (definition) => unique(definition.variants) && unique(definition.parts.map(({ key }) => key)),
    "Variants and part keys must be unique",
  );
export const buildRefSchema = z
  .strictObject({ application: bridgeToken, build: bridgeToken })
  .readonly();
export const manifestSchema = z
  .strictObject({
    schema: z.literal("propellr-component-manifest/1"),
    application: bridgeToken,
    build: bridgeToken,
    definitions: z.array(definitionSchema).min(1).max(256).readonly(),
    callsites: z
      .array(
        z
          .strictObject({
            id: bridgeToken,
            caller: bridgeToken,
            renders: bridgeToken,
            sourceRef: sourceRefSchema.optional(),
          })
          .readonly(),
      )
      .max(256)
      .readonly(),
  })
  .readonly()
  .superRefine((manifest, context) => {
    const definitions = manifest.definitions.map(({ id }) => id);
    if (!unique(definitions)) context.addIssue({ code: "custom", message: "Duplicate definition" });
    if (!unique(manifest.callsites.map(({ id }) => id)))
      context.addIssue({ code: "custom", message: "Duplicate callsite" });
    for (const callsite of manifest.callsites)
      if (!definitions.includes(callsite.caller) || !definitions.includes(callsite.renders))
        context.addIssue({
          code: "custom",
          message: `Callsite ${callsite.id} references unknown definition`,
        });
  });

// Raw page declarations from the browser collector. Untrusted until resolved.
const placementSchema = z.enum(["contained", "slotted", "detached", "unresolved"]);
export const captureSchema = z
  .strictObject({
    schema: z.literal("propellr-component-capture/1"),
    collector: versionRefSchema,
    visits: z.number().int().min(0).max(2000),
    instances: z
      .array(
        z
          .strictObject({
            target: targetSchema,
            application: bridgeToken,
            build: bridgeToken,
            definition: bridgeToken,
            instance: bridgeToken,
            variant: bridgeToken.optional(),
            callsite: bridgeToken.optional(),
            record: bridgeToken.optional(),
            parent: bridgeToken.optional(),
          })
          .readonly(),
      )
      .max(256)
      .readonly(),
    parts: z
      .array(
        z
          .strictObject({
            target: targetSchema,
            part: bridgeToken,
            owner: bridgeToken.optional(),
            placement: placementSchema.optional(),
          })
          .readonly()
          .refine(
            (part) => (part.owner === undefined) === (part.placement === undefined),
            "Placement is recorded exactly for explicitly owned parts",
          ),
      )
      .max(2000)
      .readonly(),
    containment: z
      .array(
        z
          .strictObject({
            target: targetSchema,
            candidates: z.array(bridgeToken).min(1).max(32).readonly(),
            truncated: z.boolean(),
          })
          .readonly(),
      )
      .max(96)
      .readonly(),
    malformed: z
      .array(
        z
          .strictObject({
            target: targetSchema,
            attributes: z.array(z.string().max(64)).min(1).max(16).readonly(),
          })
          .readonly(),
      )
      .max(2000)
      .readonly(),
    omitted: z
      .array(
        z
          .strictObject({
            target: targetSchema,
            code: z.enum(["instance-limit", "relation-limit"]),
          })
          .readonly(),
      )
      .max(2000)
      .readonly(),
    gaps: z.array(diagnosticSchema).max(32).readonly(),
  })
  .readonly()
  .refine(withinBytes, "Component capture exceeds 128 KiB");

// Text-free structural fingerprints for the uninstrumented heuristic and inference arms.
const shapeSchema = z.string().regex(/^[0-9a-f]{8}$/);
export const structureSchema = z
  .discriminatedUnion("state", [
    z
      .strictObject({
        schema: z.literal("propellr-structure-capture/1"),
        collector: versionRefSchema,
        state: z.literal("available"),
        targets: z
          .array(
            z
              .strictObject({
                target: targetSchema,
                chain: z
                  .array(
                    z
                      .strictObject({
                        distance: z.number().int().min(0).max(8),
                        label: z
                          .string()
                          .max(64)
                          .regex(/^[A-Za-z][A-Za-z0-9._-]*(\|[a-z]+)?$/),
                        shape: shapeSchema,
                        repeats: z.number().int().min(0).max(2000),
                        target: targetSchema.optional(),
                      })
                      .readonly(),
                  )
                  .min(1)
                  .max(9)
                  .readonly(),
              })
              .readonly(),
          )
          .max(96)
          .readonly(),
      })
      .readonly(),
    z
      .strictObject({
        schema: z.literal("propellr-structure-capture/1"),
        collector: versionRefSchema,
        state: z.literal("unavailable"),
        reason: diagnosticSchema,
      })
      .readonly(),
  ])
  .refine(
    (value) => utf8Bytes(JSON.stringify(value)) <= 65_536,
    "Structure capture exceeds 64 KiB",
  );

// Host-resolved evidence. Keys are evidence-local; no page token is identity by itself.
const key = (prefix: string) => z.string().regex(new RegExp(`^${prefix}[0-9]{1,4}$`));
const provenanceSchema = z.enum(["declared", "source-linked"]);
const declaredSchema = z
  .strictObject({
    application: bridgeToken,
    build: bridgeToken,
    definition: bridgeToken,
    instance: bridgeToken,
    variant: bridgeToken.optional(),
    callsite: bridgeToken.optional(),
    record: bridgeToken.optional(),
    parent: bridgeToken.optional(),
  })
  .readonly();
const rootsSchema = nonEmpty(targetSchema, 256);
const availabilitySchema = z.discriminatedUnion("state", [
  z.strictObject({ state: z.literal("complete") }).readonly(),
  z.strictObject({ state: z.literal("partial"), gaps: nonEmpty(diagnosticSchema, 32) }).readonly(),
  z.strictObject({ state: z.literal("stale"), gaps: nonEmpty(diagnosticSchema, 32) }).readonly(),
  z.strictObject({ state: z.literal("unavailable"), reason: diagnosticSchema }).readonly(),
]);
const candidatesSchema = z.array(key("i")).max(32).readonly();
export const evidenceSchema = z
  .strictObject({
    schema: z.literal("propellr-component-evidence/1"),
    scanId: z
      .string()
      .max(128)
      .regex(/^scan_[A-Za-z0-9-]+$/)
      .transform((id) => id as ScanId),
    documentId: bridgeToken,
    epoch: z.number().int().min(1),
    collector: versionRefSchema,
    resolver: versionRefSchema,
    textCapture: z.literal("disabled"),
    availability: availabilitySchema,
    definitions: z
      .array(
        z
          .strictObject({
            key: key("d"),
            application: bridgeToken,
            build: bridgeToken,
            definition: bridgeToken,
            variants: z.array(bridgeToken).max(32).readonly(),
            parts: z.array(partSchema).max(32).readonly(),
          })
          .readonly(),
      )
      .max(256)
      .readonly(),
    callsites: z
      .array(
        z
          .strictObject({
            key: key("c"),
            application: bridgeToken,
            build: bridgeToken,
            callsite: bridgeToken,
            caller: bridgeToken,
            renders: bridgeToken,
          })
          .readonly(),
      )
      .max(256)
      .readonly(),
    instances: z
      .array(
        z.discriminatedUnion("status", [
          z
            .strictObject({
              key: key("i"),
              status: z.literal("supported"),
              definition: key("d"),
              instance: bridgeToken,
              roots: rootsSchema,
              variant: bridgeToken.optional(),
              callsite: key("c").optional(),
              record: bridgeToken.optional(),
              parent: key("i").optional(),
              provenance: provenanceSchema,
            })
            .readonly(),
          z
            .strictObject({
              key: key("i"),
              status: z.literal("conflicting"),
              declared: declaredSchema,
              roots: rootsSchema,
              reasons: nonEmpty(diagnosticSchema, 16),
            })
            .readonly(),
        ]),
      )
      .max(256)
      .readonly(),
    attributions: z
      .array(
        z.discriminatedUnion("status", [
          z
            .strictObject({
              target: targetSchema,
              status: z.literal("supported"),
              instance: key("i"),
              part: bridgeToken,
              provenance: provenanceSchema,
              placement: placementSchema,
            })
            .readonly(),
          z
            .strictObject({
              target: targetSchema,
              status: z.literal("unknown"),
              reason: diagnosticSchema,
              candidates: candidatesSchema,
            })
            .readonly(),
          z
            .strictObject({
              target: targetSchema,
              status: z.literal("conflicting"),
              reasons: nonEmpty(diagnosticSchema, 16),
              candidates: candidatesSchema,
            })
            .readonly(),
        ]),
      )
      .max(4096)
      .readonly(),
  })
  .readonly()
  .superRefine((evidence, context) => {
    const issue = (message: string) => context.addIssue({ code: "custom", message });
    const definitions = new Map(evidence.definitions.map((entry) => [entry.key, entry]));
    const callsites = new Map(evidence.callsites.map((entry) => [entry.key, entry]));
    const instances = new Map(evidence.instances.map((entry) => [entry.key, entry]));
    if (definitions.size !== evidence.definitions.length) issue("Duplicate definition key");
    if (callsites.size !== evidence.callsites.length) issue("Duplicate callsite key");
    if (instances.size !== evidence.instances.length) issue("Duplicate instance key");
    const targets = evidence.attributions.map(({ target }) => JSON.stringify(target));
    if (!unique(targets)) issue("Duplicate attribution target");
    const documents = [
      ...evidence.instances.flatMap(({ roots }) => roots),
      ...evidence.attributions.map(({ target }) => target),
    ];
    if (documents.some((target) => target.documentId !== evidence.documentId))
      issue("Evidence target outside its document");
    if (
      evidence.availability.state !== "complete" &&
      evidence.availability.state !== "partial" &&
      (evidence.instances.length || evidence.attributions.length)
    )
      issue("Stale or unavailable evidence cannot retain attributions");
    for (const instance of evidence.instances) {
      if (instance.status !== "supported") continue;
      const definition = definitions.get(instance.definition);
      if (!definition) issue(`${instance.key}: unknown definition key`);
      if (instance.variant && !definition?.variants.includes(instance.variant))
        issue(`${instance.key}: undeclared variant`);
      if (instance.callsite !== undefined) {
        const callsite = callsites.get(instance.callsite);
        if (
          !callsite ||
          callsite.renders !== definition?.definition ||
          callsite.application !== definition.application ||
          callsite.build !== definition.build
        )
          issue(`${instance.key}: callsite does not render this definition`);
      }
      const parent = instance.parent === undefined ? undefined : instances.get(instance.parent);
      if (
        instance.parent !== undefined &&
        (instance.parent === instance.key || parent?.status !== "supported")
      )
        issue(`${instance.key}: parent is not another supported instance`);
      // A declared parent must be the callsite's caller in the same build.
      if (instance.callsite !== undefined && parent?.status === "supported") {
        const caller = definitions.get(parent.definition);
        const callsite = callsites.get(instance.callsite);
        if (
          caller?.definition !== callsite?.caller ||
          caller?.application !== callsite?.application ||
          caller?.build !== callsite?.build
        )
          issue(`${instance.key}: callsite caller differs from the parent`);
      }
      // Parent chains of supported instances must terminate.
      let ancestor = parent;
      for (
        let steps = 0;
        ancestor?.status === "supported" && ancestor.parent !== undefined;
        steps++
      ) {
        if (steps >= evidence.instances.length) {
          issue(`${instance.key}: parent chain forms a cycle`);
          break;
        }
        ancestor = instances.get(ancestor.parent);
      }
    }
    for (const attribution of evidence.attributions) {
      if (attribution.status === "supported") {
        const instance = instances.get(attribution.instance);
        const definition =
          instance?.status === "supported" ? definitions.get(instance.definition) : undefined;
        if (!definition?.parts.some(({ key }) => key === attribution.part))
          issue("Supported attribution needs a supported instance and declared part");
      } else if (attribution.candidates.some((candidate) => !instances.has(candidate)))
        issue("Attribution candidate references unknown instance");
    }
  })
  .refine(withinBytes, "Component evidence exceeds 128 KiB");

export type ValidatedManifest = z.infer<typeof manifestSchema>;
export type ManifestInput = z.input<typeof manifestSchema>;
export type ValidatedBuildRef = z.infer<typeof buildRefSchema>;
export type ValidatedCapture = z.infer<typeof captureSchema>;
export type ValidatedEvidence = z.infer<typeof evidenceSchema>;
export type ValidatedBinding = z.infer<typeof bindingSchema>;
export type ValidatedStructure = z.infer<typeof structureSchema>;
