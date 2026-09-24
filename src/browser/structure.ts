// Text-free structural fingerprints for uninstrumented attribution (propellr-structure-capture/1).
// Labels carry only element names and allowlisted roles; page strings never leave the page.
import type { Target } from "../contracts.js";
import type { StructureCapture } from "../components/contracts.js";
import { structureCollector, structureElement, structureRoles } from "../analysis.js";
import { parent } from "./naming.js";

type Chain = Extract<StructureCapture, { state: "available" }>["targets"][number]["chain"];
const roles = new Set<string>(structureRoles);
function fnv(text: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
export function structureLabel(node: Element): string {
  const role = node.getAttribute("role")?.trim().toLowerCase();
  // Page-controlled names (custom elements) never become labels verbatim.
  const name = structureElement(node.localName);
  return role === undefined || role === "" ? name : `${name}|${roles.has(role) ? role : "other"}`;
}

export function captureStructure(
  facts: readonly { readonly node: Element; readonly target: Target }[],
  violations: readonly Target[],
): StructureCapture {
  const unavailable = (): StructureCapture => ({
    schema: "propellr-structure-capture/1",
    collector: structureCollector,
    state: "unavailable",
    reason: { code: "component-structure-limit", message: "Structural budget exceeded" },
  });
  let steps = 0;
  const memo = [new Map<Element, string>(), new Map<Element, string>(), new Map<Element, string>()];
  const children = (node: Element) =>
    [...(node.shadowRoot?.children ?? []), ...node.children].slice(0, 16);
  // One step per element and depth; exhaustion abandons the whole capture.
  const shape = (node: Element, depth: 0 | 1 | 2): string | undefined => {
    const known = memo[depth]!.get(node);
    if (known !== undefined) return known;
    if (++steps > 8000) return undefined;
    let text = structureLabel(node);
    if (depth > 0) {
      const inner: string[] = [];
      for (const child of children(node)) {
        const value = shape(child, (depth - 1) as 0 | 1);
        if (value === undefined) return undefined;
        inner.push(value);
      }
      text += `(${inner.join(",")})`;
    }
    const value = fnv(text);
    memo[depth]!.set(node, value);
    return value;
  };
  const repeats = new Map<string, number>();
  for (const { node } of facts) {
    const value = shape(node, 2);
    if (value === undefined) return unavailable();
    repeats.set(value, (repeats.get(value) ?? 0) + 1);
  }
  const nodes = new Map(facts.map(({ node, target }) => [JSON.stringify(target.path), node]));
  const targets = new Map(facts.map(({ node, target }) => [node, target]));
  const seen = new Set<string>();
  const entries: { target: Target; chain: Chain }[] = [];
  for (const target of violations) {
    const key = JSON.stringify(target.path);
    const node = nodes.get(key);
    if (!node || seen.has(key) || entries.length >= 96) continue;
    seen.add(key);
    const chain: { -readonly [K in keyof Chain[number]]: Chain[number][K] }[] = [];
    let current: Element | null = node;
    for (let distance = 0; current && distance <= 8; distance++, current = parent(current)) {
      const value = shape(current, 2);
      if (value === undefined) return unavailable();
      const at = targets.get(current);
      chain.push({
        distance,
        label: structureLabel(current),
        shape: value,
        repeats: repeats.get(value) ?? 0,
        ...(at ? { target: at } : {}),
      });
    }
    entries.push({ target, chain });
  }
  const capture: StructureCapture = {
    schema: "propellr-structure-capture/1",
    collector: structureCollector,
    state: "available",
    targets: entries,
  };
  return new TextEncoder().encode(JSON.stringify(capture)).byteLength <= 65_536
    ? capture
    : unavailable();
}
