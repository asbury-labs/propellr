import { createHash } from "node:crypto";
import { readFile, realpath } from "node:fs/promises";
import { isAbsolute, join, relative, sep } from "node:path";
import { homedir, cpus, platform, release, totalmem } from "node:os";
import { z } from "zod";
import type { Browser, Page } from "playwright";
import reference from "../../reference.json" with { type: "json" };
import type { BrowserAnalysis, BrowserScanInput, BrowserScanOutput } from "../../src/analysis.js";
import { sliceRules } from "../../src/analysis.js";
import type { Fixture } from "../fixtures/slice.js";
import { fixtureUrl } from "../fixtures/slice.js";
import type { JsonObject, ScanResult, Target } from "../../src/contracts.js";

const checkSchema = z.looseObject({
  id: z.string(),
  data: z.json().nullable(),
  relatedNodes: z
    .array(z.looseObject({ target: z.array(z.union([z.string(), z.array(z.string())])) }))
    .optional(),
});
const resultSchema = z.looseObject({
  id: z.string(),
  nodes: z.array(
    z.looseObject({
      target: z.array(z.union([z.string(), z.array(z.string())])),
      impact: z.string().nullable(),
      any: z.array(checkSchema),
      all: z.array(checkSchema),
      none: z.array(checkSchema),
    }),
  ),
});
export const axeSchema = z.looseObject({
  testEngine: z.looseObject({ version: z.string() }),
  violations: z.array(resultSchema),
  passes: z.array(resultSchema),
  incomplete: z.array(resultSchema),
  inapplicable: z.array(resultSchema),
});
export type AxeResult = z.infer<typeof axeSchema>;
interface ReferenceRuntime {
  run(context: string, options: object): Promise<unknown>;
  getRules(): readonly { ruleId: string }[];
  readonly _audit: {
    readonly rules: readonly {
      readonly id: string;
      readonly enabled: boolean;
      readonly tags: readonly string[];
    }[];
  };
}
export const hash = (input: string | Buffer) => createHash("sha256").update(input).digest("hex");
export async function referenceBundle(): Promise<string> {
  const cache =
    process.env["PROPELLR_REFERENCE_CACHE"] ??
    join(homedir(), ".cache/propellr-reference/axe-core-4.13.0");
  const location = relative(
    await realpath(new URL("../..", import.meta.url)),
    await realpath(cache),
  );
  if (!isAbsolute(location) && location !== ".." && !location.startsWith(`..${sep}`))
    throw new Error("Reference cache must be external");
  const bytes = await readFile(join(cache, "package/axe.min.js"));
  if (hash(bytes) !== reference.primary.bundleSha256)
    throw new Error("Reference bundle not integrity-pinned; run pnpm reference:prepare");
  return bytes.toString("utf8");
}
export async function environment(browser: Browser) {
  return {
    node: process.version,
    playwright: "1.63.0",
    browser: browser.version(),
    os: `${platform()} ${release()}`,
    architecture: process.arch,
    cpu: cpus()[0]?.model,
    logicalCpus: cpus().length,
    totalMemoryBytes: totalmem(),
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    fonts: "Arial/system fallback",
    readiness: "load plus document.fonts.ready",
    browserCpu: null,
    browserMemory: null,
    unavailableReason: "No comparable cross-engine CPU/memory collector",
    hostMemory: process.memoryUsage(),
  };
}
export async function fixturePage(browser: Browser, fixture: Fixture) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    serviceWorkers: "block",
  });
  await context.route("**/*", (route) => {
    const url = route.request().url();
    const html = url === fixtureUrl ? fixture.html : fixture.frames?.[url];
    return html === undefined
      ? route.abort()
      : route.fulfill({ contentType: "text/html", body: html });
  });
  const page = await context.newPage();
  await page.goto(fixtureUrl, { waitUntil: "load" });
  for (const frame of page.frames()) await frame.evaluate("document.fonts.ready.then(() => true)");
  return { context, page };
}
export async function injectReference(page: Page, bundle: string): Promise<void> {
  for (const frame of page.frames()) {
    if (new URL(frame.url()).origin !== new URL(fixtureUrl).origin) continue;
    await frame.addScriptTag({ content: bundle });
  }
}
export async function runReference(
  page: Page,
  rules: readonly string[] = sliceRules,
): Promise<AxeResult> {
  const raw = await page.evaluate(
    async (rules) =>
      (globalThis as unknown as { axe: ReferenceRuntime }).axe.run("html", {
        runOnly: { type: "rule", values: rules },
        iframes: true,
        frameWaitTime: 500,
      }),
    [...rules],
  );
  const result = axeSchema.parse(raw);
  if (result.testEngine.version !== reference.primary.version)
    throw new Error("Wrong reference version");
  return result;
}
export async function injectPropellr(page: Page) {
  const bundle = await readFile(new URL("../../dist/browser/propellr.js", import.meta.url), "utf8");
  await page.addScriptTag({ content: bundle });
}
export async function runPropellr(page: Page, input: BrowserScanInput): Promise<BrowserScanOutput> {
  const output = JSON.parse(
    await page.evaluate(
      (json) =>
        JSON.stringify(
          (globalThis as unknown as { PropellrBrowser: BrowserAnalysis }).PropellrBrowser.scan(
            JSON.parse(json) as BrowserScanInput,
          ),
        ),
      JSON.stringify(input),
    ),
  ) as BrowserScanOutput;
  const stable = await page.evaluate(() =>
    (globalThis as unknown as { PropellrBrowser: BrowserAnalysis }).PropellrBrowser.finish(),
  );
  if (!stable) throw new Error("Fixture changed during comparison");
  return output;
}
export interface SemanticOccurrence {
  readonly rule: string;
  readonly outcome: "pass" | "violation" | "incomplete";
  readonly target: string;
  readonly path: Target["path"];
  readonly impact: string | null;
}
const sort = (items: SemanticOccurrence[]) =>
  items.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
const normalizeSelector = (selector: string) => selector.replace(/^html:nth-of-type\(1\)$/, "html");
const normalizePath = (path: Target["path"]) =>
  path.map((step) => ({ ...step, selector: normalizeSelector(step.selector) }));
// Each outer axe segment is a frame traversal; arrays encode shadow traversal within that document.
export function axeTargetPath(target: readonly (string | readonly string[])[]): Target["path"] {
  return target.flatMap((segment, index) => {
    const selectors = typeof segment === "string" ? [segment] : segment;
    return selectors.map((selector, inner): Target["path"][number] => ({
      kind:
        inner < selectors.length - 1 ? "shadow" : index < target.length - 1 ? "frame" : "element",
      selector: normalizeSelector(selector),
    }));
  });
}
// Display labels serve fixture diagnostics; comparisons also retain the lossless typed path.
export function propellrSemantic(output: BrowserScanOutput | ScanResult): SemanticOccurrence[] {
  return sort(
    output.rules.flatMap((rule) =>
      rule.state === "evaluated"
        ? rule.occurrences.map((node) => ({
            rule: rule.rule.id,
            outcome: node.outcome,
            target: normalizePath(node.target.path)
              .map((step) => step.selector)
              .join(" / "),
            path: normalizePath(node.target.path),
            impact: node.impact,
          }))
        : [],
    ),
  );
}
export function axeSemantic(output: AxeResult): SemanticOccurrence[] {
  return sort(
    (
      [
        ["passes", "pass"],
        ["violations", "violation"],
        ["incomplete", "incomplete"],
      ] as const
    ).flatMap(([bucket, outcome]) =>
      output[bucket].flatMap((rule) =>
        rule.nodes.map((node) => ({
          rule: rule.id,
          outcome,
          target: axeTargetPath(node.target)
            .map((step) => step.selector)
            .join(" / "),
          path: axeTargetPath(node.target),
          impact: node.impact,
        })),
      ),
    ),
  );
}
// Compare relevant evidence without erasing raw check data, related nodes or unsupported branches.
export function evidenceDifferences(own: BrowserScanOutput | ScanResult, axe: AxeResult): string[] {
  const differences: string[] = [];
  for (const rule of own.rules) {
    if (rule.state !== "evaluated") continue;
    for (const node of rule.occurrences) {
      const path = normalizePath(node.target.path);
      const target = path.map((step) => step.selector).join(" / ");
      const key = `${rule.rule.id}:${target}`;
      const reference = [...axe.passes, ...axe.violations, ...axe.incomplete]
        .filter((entry) => entry.id === rule.rule.id)
        .flatMap((entry) => entry.nodes)
        .find((entry) => JSON.stringify(axeTargetPath(entry.target)) === JSON.stringify(path));
      if (!reference) continue; // Occurrence-level mismatch is checked separately.
      const observed = node.evidence[0]?.observed as JsonObject | undefined;
      const expected = node.evidence[0]?.expected as JsonObject | undefined;
      const checks = [...reference.any, ...reference.all, ...reference.none];
      if (rule.rule.id === "target-size") {
        for (const check of checks) {
          if (!check.data || typeof check.data !== "object" || Array.isArray(check.data)) continue;
          const data = check.data as JsonObject;
          for (const field of ["width", "height", "closestOffset"])
            if (typeof data[field] === "number" && data[field] !== observed?.[field])
              differences.push(`${key}:${field}`);
          for (const field of ["minSize", "minOffset"])
            if (typeof data[field] === "number" && data[field] !== expected?.[field])
              differences.push(`${key}:${field}`);
          if (check.id === "target-offset" && check.relatedNodes?.length) {
            const related = check.relatedNodes.map((node) => node.target.flat().join(" / ")).sort();
            // Reference related selectors are local to that frame; prefix inherited scope.
            const prefix = target.includes(" / ")
              ? target.slice(0, target.lastIndexOf(" / ") + 3)
              : "";
            const peers = related.map((value) => `${prefix}${value}`);
            if (
              JSON.stringify(peers) !==
              JSON.stringify([...((observed?.["neighbors"] as readonly string[]) ?? [])].sort())
            )
              differences.push(`${key}:neighbors`);
          }
        }
      }
      if (rule.rule.id === "landmark-one-main") {
        const present = axe.passes.some(
          (entry) => entry.id === rule.rule.id && entry.nodes.includes(reference),
        );
        if (observed?.["present"] !== present || expected?.["present"] !== true)
          differences.push(`${key}:main-presence`);
        if (!checks.some((check) => check.id === "page-has-main"))
          differences.push(`${key}:main-check`);
        // Canonical check data does not expose its modal boolean; fixtures assert that independently.
      }
      if (rule.rule.id === "button-name") {
        const passed = axe.passes.some(
          (entry) => entry.id === rule.rule.id && entry.nodes.includes(reference),
        );
        const failed = axe.violations.some(
          (entry) => entry.id === rule.rule.id && entry.nodes.includes(reference),
        );
        if (node.outcome === "incomplete" || (!passed && !failed))
          differences.push(`${key}:name-evidence-unvalidated`);
        else if (observed?.["hasName"] !== passed) differences.push(`${key}:hasName`);
      }
      if (rule.rule.id === "button-name" && node.outcome === "pass") {
        const source = observed?.["source"];
        const ids =
          source === "contents"
            ? ["button-has-visible-text"]
            : source === "label"
              ? ["explicit-label", "implicit-label"]
              : source === "title"
                ? ["non-empty-title"]
                : [source];
        if (!checks.some((check) => ids.includes(check.id))) differences.push(`${key}:name-source`);
      }
    }
  }
  return differences;
}

// Test-only metadata inspection of the integrity-pinned reference version, not a product dependency.
export async function referenceActivation(page: Page) {
  return page.evaluate(() =>
    (globalThis as unknown as { axe: ReferenceRuntime }).axe._audit.rules.map((rule) => ({
      id: rule.id,
      defaultEnabled: rule.enabled,
      experimental: rule.tags.includes("experimental"),
    })),
  );
}

export async function referenceInventory(page: Page): Promise<readonly string[]> {
  return page.evaluate(() =>
    (globalThis as unknown as { axe: ReferenceRuntime }).axe.getRules().map((rule) => rule.ruleId),
  );
}
