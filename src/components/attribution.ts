import type { Diagnostic, NonEmpty, ScanResult, Target } from "../contracts.js";
import { componentCollector } from "../analysis.js";
import { canonical } from "../reporting/index.js";
import type {
  BuildRef,
  ComponentAttribution,
  ComponentCapture,
  ComponentEvidence,
  ComponentInstance,
  ComponentManifest,
} from "./contracts.js";
import { componentByteLimit, utf8Bytes } from "./validation.js";

export const resolverVersion = { id: "propellr-component-resolver", version: "1" } as const;
type Declaration = ComponentCapture["instances"][number];
type Definition = ComponentManifest["definitions"][number];
const reason = (code: string, message: string): Diagnostic => ({ code, message });
const sameBuild = (a: BuildRef, b: BuildRef) =>
  a.application === b.application && a.build === b.build;
// Instance tokens are scoped to one frame document, including its open shadow roots.
const documentScope = (target: Target) =>
  canonical(target.path.slice(0, target.path.findLastIndex((step) => step.kind === "frame") + 1));
const declared = ({ target: _target, ...fields }: Declaration) => fields;

export interface ResolveInput {
  readonly scan: Pick<ScanResult, "id" | "epoch" | "coverage">;
  readonly documentId: string;
  readonly capture:
    | { readonly ok: true; readonly value: ComponentCapture }
    | { readonly ok: false; readonly reason: Diagnostic };
  readonly manifests: readonly ComponentManifest[];
  // Host-approved builds bound to this exact document generation.
  readonly associated: readonly BuildRef[];
}

// Page declarations become evidence only through host manifests and association.
export function resolveEvidence(input: ResolveInput): ComponentEvidence {
  const { scan, capture } = input;
  const base = {
    schema: "propellr-component-evidence/1",
    scanId: scan.id,
    documentId: input.documentId,
    epoch: scan.epoch,
    collector: capture.ok ? capture.value.collector : componentCollector,
    resolver: resolverVersion,
    textCapture: "disabled",
  } as const;
  const empty = (availability: ComponentEvidence["availability"]): ComponentEvidence => ({
    ...base,
    availability,
    definitions: [],
    callsites: [],
    instances: [],
    attributions: [],
  });
  if (!capture.ok) return empty({ state: "unavailable", reason: capture.reason });
  const value = capture.value;
  const targets = [
    ...value.instances,
    ...value.parts,
    ...value.containment,
    ...value.malformed,
    ...value.omitted,
  ].map(({ target }) => target);
  if (targets.some((target) => target.documentId !== input.documentId))
    return empty({
      state: "unavailable",
      reason: reason("component-capture-invalid", "Capture target outside the scanned document"),
    });
  const gaps = value.gaps.map(({ code, message }) => reason(code, message));
  // An oversized capture retained no declarations; nothing can be attributed from it.
  const dropped = gaps.find(({ code }) => code === "component-evidence-limit");
  if (dropped) return empty({ state: "unavailable", reason: dropped });
  if (scan.coverage.state === "stale")
    return empty({
      state: "stale",
      gaps: [
        reason("scan-stale", "DOM or viewport changed during transfer; no identity retained"),
        ...gaps.slice(0, 31),
      ],
    });

  // Group roots by document-scoped token. Identical declarations form one multi-root instance.
  const groups = new Map<string, { key: string; roots: NonEmpty<Declaration> }>();
  for (const root of value.instances) {
    const id = canonical([documentScope(root.target), root.instance]);
    const group = groups.get(id);
    groups.set(id, {
      key: group?.key ?? `i${groups.size}`,
      roots: group ? [...group.roots, root] : [root],
    });
  }
  const lookup = (target: Target, token: string) =>
    groups.get(canonical([documentScope(target), token]));
  const manifestFor = (build: BuildRef) => input.manifests.find((entry) => sameBuild(entry, build));
  const local = new Map<string, { definition?: Definition; reasons: Diagnostic[] }>();
  for (const group of groups.values()) {
    const [first, ...rest] = group.roots;
    const reasons: Diagnostic[] = [];
    const manifest = manifestFor(first);
    const definition = manifest?.definitions.find(({ id }) => id === first.definition);
    const callsite = manifest?.callsites.find(({ id }) => id === first.callsite);
    if (rest.some((root) => canonical(declared(root)) !== canonical(declared(first))))
      reasons.push(reason("instance-declaration-conflict", "Roots declare different identities"));
    if (!manifest) reasons.push(reason("unapproved-build", "Application/build is not approved"));
    else if (!input.associated.some((build) => sameBuild(build, first)))
      reasons.push(reason("unassociated-build", "Build is not associated with this document"));
    if (manifest && !definition)
      reasons.push(reason("unknown-definition", "Definition is not in the approved manifest"));
    if (first.variant !== undefined && definition && !definition.variants.includes(first.variant))
      reasons.push(reason("unknown-variant", "Variant is not declared by the definition"));
    if (first.callsite !== undefined && callsite?.renders !== first.definition)
      reasons.push(reason("callsite-mismatch", "Callsite does not render this definition"));
    if (
      first.parent !== undefined &&
      (first.parent === first.instance || !lookup(first.target, first.parent))
    )
      reasons.push(reason("parent-missing", "Parent token is not another declared instance"));
    local.set(group.key, { ...(definition ? { definition } : {}), reasons });
  }
  // Second pass: a callsite caller must match a parent that passed local checks.
  const locallyValid = new Set(
    [...local].filter(([, state]) => !state.reasons.length).map(([key]) => key),
  );
  for (const group of groups.values()) {
    const first = group.roots[0];
    const state = local.get(group.key)!;
    if (state.reasons.length || first.parent === undefined) continue;
    const parent = lookup(first.target, first.parent)!;
    const parentRoot = parent.roots[0];
    if (
      locallyValid.has(parent.key) &&
      first.callsite !== undefined &&
      (!sameBuild(parentRoot, first) ||
        manifestFor(first)?.callsites.find(({ id }) => id === first.callsite)?.caller !==
          parentRoot.definition)
    )
      state.reasons.push(reason("callsite-mismatch", "Callsite caller differs from the parent"));
  }
  // Propagate unsupported parents to a fixed point so declaration order never matters.
  for (let changed = true; changed;) {
    changed = false;
    for (const group of groups.values()) {
      const first = group.roots[0];
      const state = local.get(group.key)!;
      if (state.reasons.length || first.parent === undefined) continue;
      if (local.get(lookup(first.target, first.parent)!.key)!.reasons.length) {
        state.reasons.push(reason("parent-conflicting", "Declared parent is not supported"));
        changed = true;
      }
    }
  }

  const definitions: ComponentEvidence["definitions"][number][] = [];
  const callsites: ComponentEvidence["callsites"][number][] = [];
  const definitionKey = (build: BuildRef, definition: Definition) => {
    const found = definitions.find(
      (entry) => sameBuild(entry, build) && entry.definition === definition.id,
    );
    if (found) return found.key;
    const key = `d${definitions.length}`;
    definitions.push({
      key,
      ...build,
      definition: definition.id,
      variants: definition.variants,
      parts: definition.parts,
    });
    return key;
  };
  const callsiteKey = (build: BuildRef, id: string) => {
    const found = callsites.find((entry) => sameBuild(entry, build) && entry.callsite === id);
    if (found) return found.key;
    const callsite = manifestFor(build)!.callsites.find((entry) => entry.id === id)!;
    const key = `c${callsites.length}`;
    callsites.push({
      key,
      ...build,
      callsite: id,
      caller: callsite.caller,
      renders: callsite.renders,
    });
    return key;
  };
  const instances: ComponentInstance[] = [];
  const supported = new Map<
    string,
    { definition: Definition; provenance: "declared" | "source-linked" }
  >();
  for (const group of groups.values()) {
    const first = group.roots[0];
    const state = local.get(group.key)!;
    const [firstRoot, ...otherRoots] = group.roots;
    const roots: NonEmpty<Target> = [firstRoot.target, ...otherRoots.map(({ target }) => target)];
    const [firstReason, ...otherReasons] = state.reasons;
    if (firstReason) {
      instances.push({
        key: group.key,
        status: "conflicting",
        declared: declared(first),
        roots,
        reasons: [firstReason, ...otherReasons.slice(0, 15)],
      });
      continue;
    }
    const build = { application: first.application, build: first.build };
    const definition = state.definition!;
    const provenance = definition.sourceRef === undefined ? "declared" : "source-linked";
    supported.set(group.key, { definition, provenance });
    instances.push({
      key: group.key,
      status: "supported",
      definition: definitionKey(build, definition),
      instance: first.instance,
      roots,
      ...(first.variant === undefined ? {} : { variant: first.variant }),
      ...(first.callsite === undefined ? {} : { callsite: callsiteKey(build, first.callsite) }),
      ...(first.record === undefined ? {} : { record: first.record }),
      ...(first.parent === undefined ? {} : { parent: lookup(first.target, first.parent)!.key }),
      provenance,
    });
  }

  // One attribution per target. Unknowns merge candidates; any other collision conflicts.
  const attributions = new Map<string, ComponentAttribution>();
  const add = (attribution: ComponentAttribution) => {
    const id = canonical(attribution.target);
    const prior = attributions.get(id);
    if (!prior) return void attributions.set(id, attribution);
    const entries = [prior, attribution];
    const candidates = [
      ...new Set(
        entries.flatMap((entry) =>
          entry.status === "supported" ? [entry.instance] : entry.candidates,
        ),
      ),
    ].slice(0, 32);
    if (prior.status === "unknown" && attribution.status === "unknown")
      return void attributions.set(id, { ...prior, candidates });
    const [first, ...rest] = entries.flatMap((entry) =>
      entry.status === "conflicting"
        ? entry.reasons
        : entry.status === "unknown"
          ? [entry.reason]
          : [reason("attribution-collision", "Target has more than one declaration")],
    );
    attributions.set(id, {
      target: prior.target,
      status: "conflicting",
      reasons: [first!, ...rest.slice(0, 15)],
      candidates,
    });
  };
  for (const part of value.parts) {
    const owner = part.owner === undefined ? undefined : lookup(part.target, part.owner);
    const resolved = owner && supported.get(owner.key);
    if (part.owner === undefined)
      add({
        target: part.target,
        status: "unknown",
        reason: reason("ownership-uncertain", "Part has no explicit owner"),
        candidates: [],
      });
    else if (!owner)
      add({
        target: part.target,
        status: "conflicting",
        reasons: [reason("owner-missing", "Owner token is not declared in this document")],
        candidates: [],
      });
    else if (!resolved)
      add({
        target: part.target,
        status: "conflicting",
        reasons: [reason("owner-conflicting", "Owner instance is not supported")],
        candidates: [owner.key],
      });
    else if (!resolved.definition.parts.some(({ key }) => key === part.part))
      add({
        target: part.target,
        status: "conflicting",
        reasons: [reason("unknown-part", "Part is not in the owner's definition")],
        candidates: [owner.key],
      });
    else
      add({
        target: part.target,
        status: "supported",
        instance: owner.key,
        part: part.part,
        provenance: resolved.provenance,
        placement: part.placement ?? "unresolved",
      });
  }
  for (const entry of value.containment)
    add({
      target: entry.target,
      status: "unknown",
      reason: reason(
        "ownership-uncertain",
        "Contained in declared roots; containment is not ownership",
      ),
      candidates: entry.candidates.flatMap((token) => {
        const group = lookup(entry.target, token);
        return group ? [group.key] : [];
      }),
    });
  for (const entry of value.malformed)
    add({
      target: entry.target,
      status: "conflicting",
      reasons: [reason("malformed-declaration", `Invalid: ${entry.attributes.join(", ")}`)],
      candidates: [],
    });
  for (const entry of value.omitted)
    add({
      target: entry.target,
      status: "unknown",
      reason: reason(`component-${entry.code}`, "Declaration exceeded a capture bound"),
      candidates: [],
    });
  const [firstGap, ...otherGaps] = gaps;
  const evidence: ComponentEvidence = {
    ...base,
    availability: firstGap
      ? { state: "partial", gaps: [firstGap, ...otherGaps] }
      : { state: "complete" },
    definitions,
    callsites,
    instances,
    attributions: [...attributions.values()],
  };
  return utf8Bytes(JSON.stringify(evidence)) <= componentByteLimit
    ? evidence
    : empty({
        state: "unavailable",
        reason: reason("component-evidence-limit", "Resolved evidence exceeds 128 KiB"),
      });
}
