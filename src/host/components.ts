import type { ScanRequest, ScanResult, VersionRef } from "../contracts.js";
import type {
  BuildRef,
  ComponentEvidence,
  ComponentManifest,
  StructureCapture,
} from "../components/contracts.js";
import { structureCollector } from "../analysis.js";
import {
  buildRefSchema,
  captureSchema,
  manifestSchema,
  structureSchema,
} from "../components/validation.js";
import { resolveEvidence } from "../components/attribution.js";
import type { BrowserTarget } from "./browser.js";
import { collectScan } from "./scan.js";

// Host-owned manifests and document associations. Nothing here is supplied by the page or wire.
export class ComponentRegistry {
  readonly manifests: readonly ComponentManifest[];
  private readonly associations = new WeakMap<
    BrowserTarget,
    { readonly documentId: string; readonly builds: readonly BuildRef[] }
  >();

  constructor(manifests: readonly unknown[]) {
    if (manifests.length > 16) throw new Error("At most 16 component manifests may be approved");
    this.manifests = manifests.map((manifest) => manifestSchema.parse(manifest));
    const builds = this.manifests.map(({ application, build }) => `${application}\0${build}`);
    if (new Set(builds).size !== builds.length) throw new Error("Duplicate application/build");
  }

  // Binds approved builds to the target's current document generation only.
  associate(target: BrowserTarget, input: readonly unknown[]): void {
    const builds = input.map((build) => buildRefSchema.parse(build));
    if (builds.length > 16) throw new Error("At most 16 associated builds");
    for (const build of builds)
      if (
        !this.manifests.some(
          (manifest) =>
            manifest.application === build.application && manifest.build === build.build,
        )
      )
        throw new Error("Associated build is not approved");
    this.associations.set(target, { documentId: target.documentId, builds });
  }

  associated(target: BrowserTarget, documentId: string): readonly BuildRef[] {
    const association = this.associations.get(target);
    if (association?.documentId === documentId && target.documentId === documentId)
      return association.builds;
    // Navigation replaced the document; the old association never carries forward.
    if (association && association.documentId !== target.documentId) this.release(target);
    return [];
  }

  release(target: BrowserTarget): void {
    this.associations.delete(target);
  }
}

// Raw scan and component evidence stay separate results from one guarded browser call.
export async function scanComponents(
  target: BrowserTarget,
  request: ScanRequest,
  context: {
    readonly policy: VersionRef;
    readonly configuration: VersionRef;
    readonly origin: ScanResult["origin"];
  },
  signal: AbortSignal,
  registry: ComponentRegistry,
  expectedDocument = target.documentId,
  options: { readonly structure?: boolean } = {},
): Promise<{
  readonly scan: ScanResult;
  readonly evidence: ComponentEvidence;
  readonly structure?: StructureCapture;
}> {
  const { result, capture, structure } = await collectScan(
    target,
    request,
    context,
    signal,
    expectedDocument,
    {
      bridge: "propellr-bridge/1",
      ...(options.structure ? { structure: "propellr-structure/1" as const } : {}),
    },
  );
  const parsed = capture === undefined ? undefined : captureSchema.safeParse(capture);
  const evidence = resolveEvidence({
    scan: result,
    documentId: expectedDocument,
    capture: parsed?.success
      ? { ok: true, value: parsed.data }
      : {
          ok: false,
          reason: parsed
            ? { code: "component-capture-invalid", message: "Capture failed boundary validation" }
            : { code: "component-capture-unavailable", message: "No capture for this scan scope" },
        },
    manifests: registry.manifests,
    associated: registry.associated(target, expectedDocument),
  });
  if (!options.structure) return { scan: result, evidence };
  // Page-derived structure is validated like the bridge capture; invalid means unavailable.
  const parsedStructure =
    structure === undefined ? undefined : structureSchema.safeParse(structure);
  return {
    scan: result,
    evidence,
    structure: parsedStructure?.success
      ? parsedStructure.data
      : {
          schema: "propellr-structure-capture/1",
          collector: structureCollector,
          state: "unavailable",
          reason: parsedStructure
            ? { code: "component-structure-invalid", message: "Structure failed validation" }
            : { code: "component-structure-unavailable", message: "No structure for this scope" },
        },
  };
}
