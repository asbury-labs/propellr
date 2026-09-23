// Reads propellr-bridge/1 declarations from reader-visited elements. Declarations are
// untrusted page claims; the host resolves them against approved manifests.
import type { Diagnostic, Target } from "../contracts.js";
import type { ComponentCapture } from "../components/contracts.js";
import { componentCollector } from "../analysis.js";
import { parent } from "./naming.js";

type Entry<K extends keyof ComponentCapture> = ComponentCapture[K] extends readonly (infer T)[]
  ? T
  : never;
// Host re-validates every token with the boundary schema.
const token = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const valid = (value: string) => value.length <= 128 && token.test(value);
const rootAttributes = ["app", "build", "definition", "variant", "callsite", "record", "parent"];
const required = ["app", "build", "definition"];

export function captureComponents(
  facts: readonly { readonly node: Element; readonly target: Target }[],
  violations: readonly Target[],
  unreadScope: boolean,
): ComponentCapture {
  const instances: Entry<"instances">[] = [];
  const parts: Entry<"parts">[] = [];
  const containment: Entry<"containment">[] = [];
  const malformed: Entry<"malformed">[] = [];
  const omitted: Entry<"omitted">[] = [];
  const gaps = new Map<string, Diagnostic>();
  const gap = (code: string, message: string) => {
    if (!gaps.has(code) && gaps.size < 32) gaps.set(code, { code, message });
  };
  if (unreadScope)
    gap(
      "component-scope-partial",
      "Reader scope is partial; unread elements carry no declarations",
    );
  let visits = 0;
  // Ancestor steps beyond the reader's own traversal. Attribute reads on facts are free.
  const visit = () => {
    if (visits >= 2000) {
      gap("component-visit-limit", "Additional element visit budget exceeded");
      return false;
    }
    visits++;
    return true;
  };
  const read = (node: Element, name: string) => node.getAttribute(`data-propellr-${name}`);
  const roots = new Map<Document, Map<string, Set<Element>>>();
  const rootTokens = new Map<Element, string>();
  const overflow = new Map<Document, Set<string>>();
  const owned: { node: Element; target: Target; part: string; owner: string | null }[] = [];
  for (const { node, target } of facts) {
    const instance = read(node, "instance");
    const part = read(node, "part");
    const owner = read(node, "owner");
    const bad = rootAttributes.filter((name) => {
      const value = read(node, name);
      if (instance === null) return value !== null;
      return value === null ? required.includes(name) : !valid(value);
    });
    if (instance !== null && !valid(instance)) bad.push("instance");
    if (part !== null && !valid(part)) bad.push("part");
    if (owner !== null && (part === null || !valid(owner))) bad.push("owner");
    if (bad.length) {
      malformed.push({ target, attributes: bad.map((name) => `data-propellr-${name}`) });
      gap("component-declaration-malformed", "Malformed bridge declarations are not resolved");
      continue;
    }
    if (instance !== null) {
      const document = node.ownerDocument;
      const tokens = roots.get(document) ?? new Map<string, Set<Element>>();
      roots.set(document, tokens);
      if (instances.length < 256) {
        const variant = read(node, "variant");
        const callsite = read(node, "callsite");
        const record = read(node, "record");
        const parentToken = read(node, "parent");
        instances.push({
          target,
          application: read(node, "app")!,
          build: read(node, "build")!,
          definition: read(node, "definition")!,
          instance,
          ...(variant === null ? {} : { variant }),
          ...(callsite === null ? {} : { callsite }),
          ...(record === null ? {} : { record }),
          ...(parentToken === null ? {} : { parent: parentToken }),
        });
        tokens.set(instance, (tokens.get(instance) ?? new Set()).add(node));
        rootTokens.set(node, instance);
      } else {
        gap("component-instance-limit", "More than 256 instance roots; later roots not recorded");
        if (!tokens.has(instance))
          overflow.set(document, (overflow.get(document) ?? new Set()).add(instance));
      }
    }
    if (part !== null) owned.push({ node, target, part, owner });
  }
  // Ownership comes from the explicit owner token; placement only describes DOM position.
  const placement = (node: Element, owners: Set<Element>) => {
    let slotted = false;
    for (let current: Element | null = node; current; current = parent(current)) {
      if (owners.has(current)) return slotted ? "slotted" : "contained";
      if (!visit()) return "unresolved";
      if (current.assignedSlot) slotted = true;
    }
    return "detached";
  };
  const relations = new Map<Set<Element>, number>();
  for (const { node, target, part, owner } of owned) {
    if (owner === null) {
      parts.push({ target, part });
      continue;
    }
    if (overflow.get(node.ownerDocument)?.has(owner)) {
      omitted.push({ target, code: "instance-limit" });
      continue;
    }
    const owners = roots.get(node.ownerDocument)?.get(owner);
    if (owners) {
      const count = (relations.get(owners) ?? 0) + 1;
      relations.set(owners, count);
      if (count > 64) {
        omitted.push({ target, code: "relation-limit" });
        gap("component-relation-limit", "More than 64 relations for one instance");
        continue;
      }
    }
    parts.push({ target, part, owner, placement: owners ? placement(node, owners) : "unresolved" });
  }
  // Containing roots are candidates for review, never inferred ownership.
  const nodes = new Map(facts.map(({ node, target }) => [JSON.stringify(target.path), node]));
  const explicit = new Set(owned.filter(({ owner }) => owner !== null).map(({ node }) => node));
  const considered = new Set<string>();
  for (const target of violations) {
    const key = JSON.stringify(target.path);
    const node = nodes.get(key);
    if (considered.has(key) || !node || explicit.has(node)) continue;
    considered.add(key);
    const candidates: string[] = [];
    let truncated = false;
    for (let current: Element | null = node; current; current = parent(current)) {
      const found = rootTokens.get(current);
      if (found !== undefined && !candidates.includes(found)) {
        if (candidates.length === 32) {
          truncated = true;
          gap("component-candidate-limit", "More than 32 containing roots for one target");
          break;
        }
        candidates.push(found);
      }
      if (!visit()) break;
    }
    if (candidates.length) containment.push({ target, candidates, truncated });
  }
  const capture: ComponentCapture = {
    schema: "propellr-component-capture/1",
    collector: componentCollector,
    visits,
    instances,
    parts,
    containment,
    malformed,
    omitted,
    gaps: [...gaps.values()],
  };
  if (new TextEncoder().encode(JSON.stringify(capture)).byteLength <= 131_072) return capture;
  return {
    ...capture,
    instances: [],
    parts: [],
    containment: [],
    malformed: [],
    omitted: [],
    gaps: [
      {
        code: "component-evidence-limit",
        message: "Capture exceeds 128 KiB; no declarations retained",
      },
      ...[...gaps.values()].slice(0, 31),
    ],
  };
}
