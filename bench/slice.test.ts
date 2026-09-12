import { mkdir, readFile, writeFile } from "node:fs/promises";
import { expect, test } from "vitest";
import { browserTypes } from "../src/host/browser.js";
import { selectedRequest, engineVersion } from "../src/analysis.js";
import { resolveRules } from "../src/host/scan.js";
import { applyGate, reportScan } from "../src/reporting/index.js";
import { LOCAL_GATE } from "../src/host/runtime.js";
import type { PageId, ScanId, ScanResult } from "../src/contracts.js";
import { benchmarkFixtures } from "../test/fixtures/slice.js";
import {
  axeSemantic,
  environment,
  evidenceDifferences,
  fixturePage,
  hash,
  injectPropellr,
  injectReference,
  propellrSemantic,
  referenceBundle,
  runPropellr,
  runReference,
} from "../test/support/parity.js";
import { meta, playbookInput, terminal, unwrap, withHost } from "../test/support/host.js";
import reference from "../reference.json" with { type: "json" };

const root = { pageId: "page_benchmark" as PageId, documentId: "benchmark-document", path: [] };
const request = selectedRequest(root);
const rules = resolveRules(request);
const protocol = {
  warmupPairs: 1,
  measuredPairsPerLane: 5,
  lanes: ["cold", "warm", "changed-full-fallback"],
  order: "alternate by trial",
  exclusions: "none",
  idleMs: 100,
  longLivedTrials: 5,
  noSpeedClaim: true,
};
const distribution = (values: readonly number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    count: sorted.length,
    min: sorted[0],
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
    max: sorted.at(-1),
    uncertainty: "Five exploratory samples; no precise confidence interval",
  };
};
for (const engine of ["chromium", "firefox", "webkit"] as const)
  test(`${engine} equivalent-work exploratory samples`, async () => {
    const launchStart = performance.now();
    const browser = await browserTypes[engine].launch();
    const browserLaunchMs = performance.now() - launchStart;
    const bundle = await referenceBundle();
    const samples: {
      fixture: string;
      lane: string;
      trial: number;
      implementation: string;
      usableMs: number;
      scanTransferMs: number;
      data: object;
    }[] = [];
    const failures: object[] = [];
    const retained: object[] = [];
    const warm = new Map<string, Awaited<ReturnType<typeof fixturePage>>>();
    const warmSetup: object[] = [];
    const fixtureDensities: object[] = [];
    try {
      for (const benchmarkFixture of benchmarkFixtures) {
        for (const implementation of ["propellr", "reference"]) {
          const start = performance.now();
          const loaded = await fixturePage(browser, benchmarkFixture);
          const loadMs = performance.now() - start;
          const density = JSON.parse(
            await loaded.page.evaluate<string>(`(() => {
        const counts = { elements: 0, buttons: 0, frames: 0, openShadowRoots: 0, styleRules: 0 };
        function walk(root) {
          for (const node of root.querySelectorAll('*')) {
            counts.elements++;
            if (node.localName === 'button') counts.buttons++;
            if (node.localName === 'style') counts.styleRules += node.sheet.cssRules.length;
            if (node.shadowRoot) { counts.openShadowRoots++; walk(node.shadowRoot); }
            if (node.localName === 'iframe') { counts.frames++; walk(node.contentDocument); }
          }
        }
        walk(document); return JSON.stringify(counts);
      })()`),
          ) as unknown;
          fixtureDensities.push({ fixture: benchmarkFixture.id, implementation, density });
          const inject = performance.now();
          if (implementation === "propellr") await injectPropellr(loaded.page);
          else await injectReference(loaded.page, bundle);
          warmSetup.push({
            fixture: benchmarkFixture.id,
            implementation,
            contextAndLoadMs: loadMs,
            injectionMs: performance.now() - inject,
          });
          warm.set(implementation, loaded);
        }
        for (const lane of ["warmup", ...protocol.lanes])
          for (let trial = 0; trial < (lane === "warmup" ? 1 : 5); trial++) {
            const order = trial % 2 ? ["reference", "propellr"] : ["propellr", "reference"];
            let ownRaw: Awaited<ReturnType<typeof runPropellr>> | undefined;
            let axeRaw: Awaited<ReturnType<typeof runReference>> | undefined;
            const pair: typeof samples = [];
            for (const implementation of order) {
              const start = performance.now();
              const memoryBefore = process.memoryUsage();
              const cpuBefore = process.cpuUsage();
              const cold = lane === "cold";
              const loaded = cold
                ? await fixturePage(browser, benchmarkFixture)
                : warm.get(implementation)!;
              const contextAndLoadMs = cold ? performance.now() - start : 0;
              const injectionStart = performance.now();
              if (cold) {
                if (implementation === "propellr") await injectPropellr(loaded.page);
                else await injectReference(loaded.page, bundle);
              }
              const injectionMs = cold ? performance.now() - injectionStart : 0;
              const mutationStart = performance.now();
              if (lane === "changed-full-fallback")
                await loaded.page.evaluate(
                  benchmarkFixture.id === "geometry"
                    ? `document.querySelector('#close-a').style.width='${trial % 2 ? 20 : 24}px';document.querySelector('#close-a').style.height='${trial % 2 ? 20 : 24}px'`
                    : `document.documentElement.setAttribute('data-benchmark-mutation', '${trial}')`,
                );
              const mutationMs =
                lane === "changed-full-fallback" ? performance.now() - mutationStart : 0;
              let raw: unknown;
              let reportMs: number | null = null;
              let gateMs: number | null = null;
              try {
                const scanStart = performance.now();
                let scanTransferMs: number;
                if (implementation === "propellr") {
                  ownRaw = await runPropellr(loaded.page, { target: root, rules });
                  scanTransferMs = performance.now() - scanStart;
                  const firstGap = ownRaw.gaps[0];
                  const scan: ScanResult = {
                    id: `bench-${engine}-${benchmarkFixture.id}-${lane}-${trial}` as ScanId,
                    epoch: trial + 1,
                    origin: { kind: "direct" },
                    engine: engineVersion,
                    policy: { id: "benchmark", version: "1" },
                    configuration: { id: "three-rule-default-options", version: "1" },
                    scope: request.scope,
                    resolvedRules: rules,
                    execution:
                      lane === "changed-full-fallback"
                        ? {
                            requested: "incremental",
                            actual: "full",
                            fallback: {
                              code: "full-scan-fallback",
                              message: "No incremental algorithm",
                            },
                          }
                        : { requested: "full", actual: "full" },
                    coverage: firstGap
                      ? { state: "partial", gaps: [firstGap, ...ownRaw.gaps.slice(1)] }
                      : { state: "complete" },
                    rules: ownRaw.rules,
                    durationMs: scanTransferMs,
                  };
                  const reportStart = performance.now();
                  const report = reportScan(scan);
                  reportMs = performance.now() - reportStart;
                  const gateStart = performance.now();
                  const gated = applyGate(
                    scan,
                    report,
                    { ...LOCAL_GATE, exceptions: [] },
                    "2026-09-12T18:00:00Z",
                  );
                  gateMs = performance.now() - gateStart;
                  raw = { ...scan, report: gated };
                } else {
                  axeRaw = await runReference(loaded.page);
                  scanTransferMs = performance.now() - scanStart;
                  raw = axeRaw;
                }
                const serializationStart = performance.now();
                const serializedBytes = Buffer.byteLength(JSON.stringify(raw));
                const serializationMs = performance.now() - serializationStart;
                const usableMs = performance.now() - start;
                pair.push({
                  fixture: benchmarkFixture.id,
                  lane,
                  trial,
                  implementation,
                  usableMs,
                  scanTransferMs,
                  data: {
                    contextAndLoadMs,
                    injectionMs,
                    mutationMs,
                    reportMs,
                    gateMs,
                    serializationMs,
                    serializedBytes,
                    browserLaunchMs,
                    withBrowserLaunchMs: usableMs + browserLaunchMs,
                    setupReused: !cold,
                    hostMemoryBefore: memoryBefore,
                    hostMemoryAfter: process.memoryUsage(),
                    hostCpuMicroseconds: process.cpuUsage(cpuBefore),
                    browserCpu: null,
                    browserMemory: null,
                    raw,
                  },
                });
              } catch (error) {
                failures.push({
                  fixture: benchmarkFixture.id,
                  lane,
                  trial,
                  implementation,
                  error: error instanceof Error ? error.message : "Unknown error",
                });
              } finally {
                if (cold) await loaded.context.close();
              }
            }
            const correctnessStart = performance.now();
            const controlsMatch =
              ownRaw !== undefined &&
              (lane === "changed-full-fallback" ||
                ["button-name", "target-size", "landmark-one-main"].every(
                  (rule) =>
                    JSON.stringify(
                      propellrSemantic(ownRaw!)
                        .filter((node) => node.rule === rule && node.outcome === "violation")
                        .map((node) => node.target)
                        .sort(),
                    ) === JSON.stringify([...(benchmarkFixture.expected[rule] ?? [])].sort()),
                ));
            const correct =
              controlsMatch &&
              ownRaw !== undefined &&
              axeRaw !== undefined &&
              ownRaw.gaps.length === 0 &&
              JSON.stringify(propellrSemantic(ownRaw)) === JSON.stringify(axeSemantic(axeRaw)) &&
              evidenceDifferences(ownRaw, axeRaw).length === 0;
            if (!correct)
              failures.push({
                fixture: benchmarkFixture.id,
                lane,
                trial,
                reason: "Equivalent-work correctness failed",
                own: ownRaw,
                reference: axeRaw,
              });
            retained.push({
              fixture: benchmarkFixture.id,
              lane,
              trial,
              order,
              correct,
              correctnessMs: performance.now() - correctnessStart,
            });
            if (lane !== "warmup") samples.push(...pair);
          }
        for (const loaded of warm.values()) await loaded.context.close();
        warm.clear();
      }
      // Separate host/transport/journey lane; no canonical-equivalent reporting claim.
      await withHost(async ({ client, open, reconnect }) => {
        const sessionStart = performance.now();
        const session = await open(engine);
        retained.push({ lane: "host-session", openMs: performance.now() - sessionStart });
        let active = client;
        const before = process.memoryUsage();
        for (let trial = 0; trial < 5; trial++) {
          const start = performance.now();
          const operation = unwrap(await active.runPlaybook(playbookInput(session)));
          const result = await terminal(active, operation);
          const playbookMs = performance.now() - start;
          expect(result.state).toBe("completed");
          if (result.state !== "completed" || result.kind !== "playbook")
            throw new Error("Benchmark journey did not complete");
          expect(
            result.result.checkpoints.every((checkpoint) => checkpoint.state === "reached"),
          ).toBe(true);
          const scans = result.result.checkpoints.flatMap((checkpoint) =>
            checkpoint.state === "reached" ? checkpoint.scans : [],
          );
          const scanMs = scans.reduce((sum, scan) => sum + scan.durationMs, 0);
          const reconnectStart = performance.now();
          active.close();
          active = await reconnect(active.lease);
          const inspected = unwrap(
            await active.inspect({ ...meta(), sessionId: session.id, operationId: operation.id }),
          );
          expect(inspected.selectedOperation?.state).toBe("completed");
          const reconnectInspectMs = performance.now() - reconnectStart;
          const idleStart = performance.now();
          await new Promise((resolve) => setTimeout(resolve, 100));
          retained.push({
            lane: "long-lived-host",
            trial,
            playbookMs,
            scanMs,
            hostTransportInteractionReportingMs: playbookMs - scanMs,
            reconnectInspectMs,
            idleMs: performance.now() - idleStart,
            endToEndMs: performance.now() - start,
            memory: process.memoryUsage(),
            raw: result,
          });
        }
        retained.push({
          lane: "host-memory",
          before,
          after: process.memoryUsage(),
          retention: "8 raw reporting scans, 32 operations, 64 events; no durable history",
        });
      });
    } finally {
      const summaries = benchmarkFixtures.flatMap((fixture) =>
        protocol.lanes.flatMap((lane) =>
          ["propellr", "reference"].map((implementation) => ({
            fixture: fixture.id,
            lane,
            implementation,
            usable: distribution(
              samples
                .filter(
                  (sample) =>
                    sample.fixture === fixture.id &&
                    sample.lane === lane &&
                    sample.implementation === implementation,
                )
                .map((sample) => sample.usableMs),
            ),
            scanTransfer: distribution(
              samples
                .filter(
                  (sample) =>
                    sample.fixture === fixture.id &&
                    sample.lane === lane &&
                    sample.implementation === implementation,
                )
                .map((sample) => sample.scanTransferMs),
            ),
          })),
        ),
      );
      await mkdir("artifacts/bench", { recursive: true });
      await writeFile(
        `artifacts/bench/${engine}.json`,
        JSON.stringify(
          {
            protocol,
            environment: await environment(browser),
            fixtureHashes: benchmarkFixtures.map((fixture) => ({
              id: fixture.id,
              hash: hash(JSON.stringify(fixture)),
            })),
            fixtureDensities,
            propellrBundleHash: hash(await readFile("dist/browser/propellr.js")),
            reference: reference.primary,
            request,
            warmSetup,
            samples,
            retained,
            failures,
            summaries,
          },
          null,
          2,
        ),
      );
      for (const loaded of warm.values()) await loaded.context.close();
      await browser.close();
    }
    expect(failures).toEqual([]);
    expect(samples).toHaveLength(30 * benchmarkFixtures.length);
  });
