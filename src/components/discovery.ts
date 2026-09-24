import type { OccurrenceId, ScanResult, Target } from "../contracts.js";
import { canonical } from "../reporting/index.js";
import type { StructureCapture } from "./contracts.js";
import { defectSignature } from "./grouping.js";
import { structureSchema } from "./validation.js";

export const discoveryVersion = "structural-template/1";
type Link = Extract<StructureCapture, { state: "available" }>["targets"][number]["chain"][number];
export interface TemplateCandidate {
  readonly shape: string;
  readonly distance: number;
  readonly repeats: number;
  readonly target?: Target;
}
export interface TemplateDecision {
  readonly occurrenceId: OccurrenceId;
  readonly candidates: readonly TemplateCandidate[];
  // Nearest repeated container; null is an explicit abstention.
  readonly decision: TemplateCandidate | null;
  // Other repeated containers, retained rather than normalized away.
  readonly alternatives: readonly TemplateCandidate[];
}
export interface TemplateGroup {
  readonly id: string;
  readonly part: string;
  readonly rule: string;
  readonly members: readonly OccurrenceId[];
}
export type TemplateDiscovery =
  | {
      readonly version: typeof discoveryVersion;
      readonly state: "available";
      readonly decisions: readonly TemplateDecision[];
      readonly groups: readonly TemplateGroup[];
    }
  | {
      readonly version: typeof discoveryVersion;
      readonly state: "unavailable";
      readonly reason: string;
    };

const candidate = ({ shape, distance, repeats, target }: Link): TemplateCandidate => ({
  shape,
  distance,
  repeats,
  ...(target ? { target } : {}),
});

// Deterministic structural baseline. Suggestions only: never supported scopes or definition names.
export function discoverTemplates(scan: ScanResult, input: StructureCapture): TemplateDiscovery {
  const structure = structureSchema.parse(input);
  if (structure.state !== "available")
    return { version: discoveryVersion, state: "unavailable", reason: structure.reason.code };
  // Index chains by exact target once; candidates come from repeat counts, not pairwise comparison.
  const chains = new Map(structure.targets.map(({ target, chain }) => [canonical(target), chain]));
  const decisions: TemplateDecision[] = [];
  const groups = new Map<
    string,
    { id: string; part: string; rule: string; members: OccurrenceId[] }
  >();
  for (const result of scan.rules) {
    if (result.state !== "evaluated") continue;
    for (const occurrence of result.occurrences) {
      if (occurrence.outcome !== "violation") continue;
      const chain = chains.get(canonical(occurrence.target)) ?? [];
      const candidates = chain
        .filter(({ distance, repeats }) => distance >= 1 && repeats >= 2)
        .map(candidate);
      const [decision = null, ...alternatives] = candidates;
      decisions.push({ occurrenceId: occurrence.id, candidates, decision, alternatives });
      if (!decision) continue;
      const part = chain
        .filter(({ distance }) => distance < decision.distance)
        .map(({ label }) => label)
        .reverse()
        .join(">");
      const key = canonical([decision.shape, part, defectSignature(result.rule, occurrence)]);
      const group = groups.get(key) ?? {
        id: `shape:${decision.shape}`,
        part,
        rule: result.rule.id,
        members: [],
      };
      group.members.push(occurrence.id);
      groups.set(key, group);
    }
  }
  return { version: discoveryVersion, state: "available", decisions, groups: [...groups.values()] };
}

// Minimal, text-free decision input for an optional provider arm. Candidates are code-generated.
export interface DecisionCase {
  readonly target: string;
  readonly chain: readonly {
    readonly distance: number;
    readonly label: string;
    readonly shape: string;
    readonly repeats: number;
  }[];
  readonly candidates: readonly string[];
  readonly parts: readonly string[];
}
export function decisionCase(chain: readonly Link[]): DecisionCase {
  const [self, ...ancestors] = chain;
  return {
    target: self?.label ?? "unknown",
    chain: chain.map(({ distance, label, shape, repeats }) => ({
      distance,
      label,
      shape,
      repeats,
    })),
    candidates: ancestors.map(({ distance }) => `ancestor-${distance}`),
    parts: ancestors.map(({ distance }) =>
      chain
        .filter((link) => link.distance < distance)
        .map(({ label }) => label)
        .reverse()
        .join(">"),
    ),
  };
}
