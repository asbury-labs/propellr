import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import type { JSHandle } from "playwright";
import type { BrowserAnalysis, BrowserScanInput, BrowserScanOutput } from "../analysis.js";
import { engineVersion } from "../analysis.js";
import type {
  ScanId,
  ScanRequest,
  ScanResult,
  VersionRef,
  NonEmpty,
  JsonObject,
} from "../contracts.js";
import catalog from "../catalog.json" with { type: "json" };
import type { BrowserTarget } from "./browser.js";

const bundle = () => readFile(new URL("../../dist/browser/propellr.js", import.meta.url), "utf8");
export function resolveRules(
  request: ScanRequest,
): NonEmpty<{ rule: VersionRef; options: JsonObject }> {
  const selected =
    request.rules.kind === "explicit"
      ? request.rules.rules
      : catalog.rules
          .filter((rule) => rule.defaultEnabled && !rule.experimental)
          .map((rule) => ({ id: rule.id, options: {} }));
  const rules = selected.map(({ id, options }) => ({
    rule: {
      id,
      version: catalog.rules.some((rule) => rule.id === id) ? catalog.version : "unknown",
    },
    options,
  }));
  const first = rules[0];
  if (!first) throw new Error("Empty resolved rule inventory");
  return [first, ...rules.slice(1)];
}

// Whole-document only. Never silently widen requested scope or turn defaults into three rules.
export async function scanTarget(
  target: BrowserTarget,
  request: ScanRequest,
  context: {
    readonly policy: VersionRef;
    readonly configuration: VersionRef;
    readonly origin: ScanResult["origin"];
  },
  signal: AbortSignal,
  expectedDocument = target.documentId,
): Promise<ScanResult> {
  const started = performance.now();
  const id = `scan_${randomUUID()}` as ScanId;
  const epoch = ++target.scanEpoch;
  const resolvedRules = resolveRules(request);
  const base = {
    id,
    epoch,
    ...context,
    engine: engineVersion,
    scope: request.scope,
    resolvedRules,
    execution:
      request.mode === "full"
        ? { requested: "full" as const, actual: "full" as const }
        : {
            requested: "incremental" as const,
            actual: "full" as const,
            fallback: {
              code: "full-scan-fallback",
              message: "No incremental algorithm; facts rebuilt at each epoch",
            },
          },
  };
  const guard = () => {
    if (signal.aborted) throw new Error("scan-cancelled");
    if (
      target.documentId !== expectedDocument ||
      [...request.scope.include, ...request.scope.exclude].some(
        (scope) => scope.pageId === target.pageId && scope.documentId !== expectedDocument,
      )
    )
      throw new Error("scan-document-changed");
  };
  guard();
  const root = request.scope.include[0];
  const whole =
    request.scope.include.length === 1 &&
    !request.scope.exclude.length &&
    !root.path.length &&
    root.pageId === target.pageId &&
    root.documentId === expectedDocument;
  if (!whole)
    return {
      ...base,
      durationMs: performance.now() - started,
      coverage: {
        state: "partial",
        gaps: [
          { code: "scope-unavailable", message: "Only one whole current document is supported" },
        ],
      },
      rules: resolvedRules.map(({ rule }) => ({
        rule,
        state: "not-evaluated",
        reason: { code: "scope-unavailable", message: "Requested scope was not evaluated" },
      })),
    };
  // Lexical injection returns a host-held handle, never a page-controlled global.
  // One runtime per scan keeps observer/handle lifetime bounded, including borrowed pages.
  let analysis: JSHandle<BrowserAnalysis> | undefined;
  let finished = false;
  try {
    const source = await bundle();
    guard();
    analysis = await target.page.evaluateHandle<BrowserAnalysis>(
      `(() => {\n${source}\nreturn PropellrBrowser;\n})()`,
    );
    guard();
    const input: BrowserScanInput = { target: root, rules: resolvedRules };
    const output = JSON.parse(
      await target.page.evaluate(
        ({ runtime, json }) => JSON.stringify(runtime.scan(JSON.parse(json) as BrowserScanInput)),
        { runtime: analysis, json: JSON.stringify(input) },
      ),
    ) as BrowserScanOutput;
    guard();
    const stable = await target.page.evaluate((runtime) => runtime.finish(), analysis);
    finished = true;
    guard();
    if (output.rules.length !== resolvedRules.length) throw new Error("scan-result-limit");
    const first = output.gaps[0];
    return {
      ...base,
      rules: output.rules,
      durationMs: performance.now() - started,
      coverage: !stable
        ? {
            state: "stale",
            gaps: [
              { code: "scan-stale", message: "DOM or viewport changed during scan transfer" },
              ...output.gaps.slice(0, 31),
            ],
          }
        : first
          ? { state: "partial", gaps: [first, ...output.gaps.slice(1)] }
          : { state: "complete" },
    };
  } catch (error) {
    // Context destruction can reject any browser await before its following guard runs.
    guard();
    throw error;
  } finally {
    if (analysis) {
      if (!finished)
        await target.page.evaluate((runtime) => runtime.finish(), analysis).catch(() => {});
      await analysis.dispose().catch(() => {});
    }
  }
}
