import { mkdir, writeFile } from "node:fs/promises";
import { expect, test, vi } from "vitest";
import { implementedRules } from "../../src/analysis.js";
import { buildRepairView } from "../../src/components/grouping.js";
import { BrowserTarget, browserTypes } from "../../src/host/browser.js";
import { ComponentRegistry, scanComponents } from "../../src/host/components.js";
import { scanTarget } from "../../src/host/scan.js";
import { componentCases, exhaustionCases, lifecycleCase } from "../fixtures/components/cases.js";
import { exhaustionOracle, oracle } from "../fixtures/components/oracle.js";
import { fixtures } from "../fixtures/slice.js";
import { namingFixtures } from "../fixtures/naming.js";
import { nativeFormFixtures } from "../fixtures/native-form-naming.js";
import {
  attributionFor,
  exact,
  expected,
  leaks,
  occurrenceOf,
  raw,
  request,
  runArm,
  scanContext,
  summarize,
  tokenOf,
} from "../support/component-corpus.js";
import { environment, fixturePage, hash } from "../support/parity.js";

const engines = ["chromium", "firefox", "webkit"] as const;
const artifacts = new URL("../../artifacts/components/", import.meta.url);
async function archive(name: string, value: unknown) {
  await mkdir(artifacts, { recursive: true });
  await writeFile(new URL(name, artifacts), `${JSON.stringify(value, null, 2)}\n`);
}

test("uninstrumented arms carry no bridge data, classes or manifest identifiers", () => {
  for (const fixtureCase of [...componentCases, lifecycleCase, ...exhaustionCases]) {
    expect(leaks(fixtureCase, "uninstrumented"), fixtureCase.id).toEqual([]);
    expect(leaks(fixtureCase, "instrumented"), fixtureCase.id).toContain("bridge attribute");
  }
  expect(Object.keys(oracle).sort()).toEqual(componentCases.map(({ id }) => id).sort());
});

for (const engine of engines)
  test(`${engine}: owned components match the independent oracle without changing raw results`, async () => {
    const browser = await browserTypes[engine].launch();
    const records: object[] = [];
    try {
      for (const fixtureCase of componentCases) {
        const instrumented = await runArm(browser, fixtureCase, "instrumented");
        const uninstrumented = await runArm(browser, fixtureCase, "uninstrumented");
        const truth = oracle[fixtureCase.id]!;
        const actual = summarize(instrumented.scan, instrumented.view);
        records.push({
          case: fixtureCase.id,
          fixtureHash: hash(JSON.stringify(fixtureCase.render("instrumented"))),
          manifests: fixtureCase.manifests,
          instrumented,
          uninstrumented,
          summary: actual,
          oracle: truth,
        });
        // Capture on/off and bridge on/off leave raw verdicts, reports and gates identical.
        for (const run of [instrumented, uninstrumented]) {
          expect(raw(run.scan), fixtureCase.id).toEqual(raw(run.off));
          expect(exact(run.scan), fixtureCase.id).toEqual(exact(run.off));
        }
        expect(raw(uninstrumented.scan), fixtureCase.id).toEqual(raw(instrumented.scan));
        expect(instrumented.scan.coverage, fixtureCase.id).toEqual({ state: "complete" });
        expect(actual, fixtureCase.id).toEqual(expected(truth));
        const { counts } = instrumented.view;
        expect(counts.exactViolationIssues, fixtureCase.id).toBe(counts.violationOccurrences);
        expect(
          counts.supportedOccurrences +
            counts.suggestedOccurrences +
            counts.unattributedOccurrences,
        ).toBe(counts.violationOccurrences);
        for (const [id, code] of Object.entries(truth.targetReasons ?? {})) {
          const occurrence = occurrenceOf(instrumented.scan, id);
          const entry = instrumented.view.unattributed.find(
            ({ occurrenceId }) => occurrenceId === occurrence?.id,
          );
          expect(
            entry?.reasons.map((reason) => reason.code),
            `${fixtureCase.id}:${id}`,
          ).toContain(code);
        }
        for (const [token, code] of Object.entries(truth.instanceReasons ?? {})) {
          const instance = instrumented.evidence.instances.find(
            (entry) => entry.status === "conflicting" && entry.declared.instance === token,
          );
          expect(
            instance?.status === "conflicting" ? instance.reasons.map(({ code }) => code) : [],
            `${fixtureCase.id}:${token}`,
          ).toContain(code);
        }
        for (const [id, placement] of Object.entries(truth.placements ?? {})) {
          const attribution = attributionFor(instrumented.scan, instrumented.evidence, id);
          expect(attribution?.status === "supported" && attribution.placement, id).toBe(placement);
        }
        for (const [id, count] of Object.entries(truth.candidates ?? {})) {
          const attribution = attributionFor(instrumented.scan, instrumented.evidence, id);
          expect(
            attribution && attribution.status !== "supported" ? attribution.candidates.length : -1,
            id,
          ).toBe(count);
        }
        // Without the bridge nothing is attributed, grouped or inferred.
        expect(uninstrumented.view.scopes, fixtureCase.id).toEqual([]);
        expect(uninstrumented.evidence.instances, fixtureCase.id).toEqual([]);
        expect(uninstrumented.view.counts.unattributedOccurrences).toBe(
          instrumented.view.counts.violationOccurrences,
        );
        // Source references stay in the host manifest; free text is never captured.
        expect(JSON.stringify(instrumented.evidence)).not.toContain("src/cards/");
        expect(JSON.stringify(instrumented.view)).not.toContain("src/cards/");
        expect(instrumented.evidence.textCapture).toBe("disabled");
      }
    } finally {
      await archive(`${engine}-oracle.json`, {
        environment: await environment(browser),
        records,
      });
      await browser.close();
    }
  });

for (const engine of engines)
  test(`${engine}: fragments keep one instance with several roots`, async () => {
    const browser = await browserTypes[engine].launch();
    try {
      const run = await runArm(
        browser,
        componentCases.find(({ id }) => id === "boundaries")!,
        "instrumented",
      );
      const fragment = run.evidence.instances.find(
        (entry) => entry.status === "supported" && entry.instance === "f0",
      );
      expect(fragment?.roots).toHaveLength(2);
      // The closed root's control is never observed or represented.
      const paths = run.scan.rules.flatMap((result) =>
        result.state === "evaluated" ? result.occurrences.map(({ target }) => target.path) : [],
      );
      expect(paths.some((path) => path.some(({ selector }) => selector === "#host-c"))).toBe(false);
    } finally {
      await browser.close();
    }
  });

for (const engine of engines)
  test(`${engine}: exhausted capture bounds report gaps and keep raw findings`, async () => {
    const browser = await browserTypes[engine].launch();
    const records: object[] = [];
    try {
      for (const fixtureCase of exhaustionCases) {
        const run = await runArm(browser, fixtureCase, "instrumented");
        const truth = exhaustionOracle[fixtureCase.id]!;
        records.push({ case: fixtureCase.id, ...run });
        expect(raw(run.scan), fixtureCase.id).toEqual(raw(run.off));
        expect(exact(run.scan), fixtureCase.id).toEqual(exact(run.off));
        const availability = run.evidence.availability;
        expect(availability.state, fixtureCase.id).toBe(truth.availability);
        const codes =
          availability.state === "unavailable"
            ? [availability.reason.code]
            : availability.state === "partial"
              ? availability.gaps.map(({ code }) => code)
              : [];
        expect(codes, fixtureCase.id).toContain(truth.gap);
        expect(run.view.counts.supportedOccurrences, fixtureCase.id).toBe(truth.supported);
        expect(run.view.counts.unattributedOccurrences, fixtureCase.id).toBe(truth.unattributed);
        expect(run.view.counts.violationOccurrences, fixtureCase.id).toBe(
          truth.supported + truth.unattributed,
        );
      }
    } finally {
      await archive(`${engine}-exhaustion.json`, { records });
      await browser.close();
    }
  });

// First two fixtures per source file and DOM boundary class keep frame, shadow, slot and
// dialog coverage without rescanning every parity case three times over.
const boundaryClass = (fixture: (typeof fixtures)[number]) =>
  [
    fixture.frames ? "frame" : "",
    /attachShadow/.test(fixture.html) ? "shadow" : "",
    /<slot/.test(fixture.html) ? "slot" : "",
    /showModal|<dialog/.test(fixture.html) ? "dialog" : "",
  ].join("+");
const representative = [fixtures, namingFixtures, nativeFormFixtures].flatMap((source) => {
  const seen = new Map<string, number>();
  return source.filter((fixture) => {
    const count = seen.get(boundaryClass(fixture)) ?? 0;
    seen.set(boundaryClass(fixture), count + 1);
    return count < 2;
  });
});
test("capture-inert subset keeps every parity boundary class", () => {
  const classes = (list: readonly (typeof fixtures)[number][]) => new Set(list.map(boundaryClass));
  expect(classes(representative)).toEqual(
    classes([...fixtures, ...namingFixtures, ...nativeFormFixtures]),
  );
  expect(representative).toHaveLength(25);
});

// Existing parity fixtures have no bridge: enrichment must be inert on raw results.
for (const engine of engines)
  test(`${engine}: capture leaves existing parity fixtures' raw results unchanged`, async () => {
    const browser = await browserTypes[engine].launch();
    const registry = new ComponentRegistry([]);
    const records: object[] = [];
    try {
      for (const fixture of representative) {
        const { context, page } = await fixturePage(browser, fixture);
        const target = new BrowserTarget(page, "borrowed");
        try {
          const scanRequest = request(target, implementedRules);
          const signal = new AbortController().signal;
          const off = await scanTarget(target, scanRequest, scanContext, signal);
          const on = await scanComponents(target, scanRequest, scanContext, signal, registry);
          records.push({ fixture: fixture.id, off: raw(off), on: raw(on.scan) });
          expect(raw(on.scan), fixture.id).toEqual(raw(off));
          expect(exact(on.scan), fixture.id).toEqual(exact(off));
          expect(on.evidence.instances, fixture.id).toEqual([]);
          const view = buildRepairView(on.scan, on.evidence);
          expect(view.scopes, fixture.id).toEqual([]);
          expect(view.counts.unattributedOccurrences).toBe(view.counts.violationOccurrences);
        } finally {
          await target.release();
          await context.close();
        }
      }
    } finally {
      await archive(`${engine}-parity-inert.json`, { records });
      await browser.close();
    }
  });

for (const engine of engines)
  test(`${engine}: identity never outlives its scan, document or DOM binding`, async () => {
    const browser = await browserTypes[engine].launch();
    const { context, page } = await fixturePage(browser, lifecycleCase.render("instrumented"));
    const target = new BrowserTarget(page, "borrowed");
    const registry = new ComponentRegistry(lifecycleCase.manifests);
    const steps: object[] = [];
    const run = async (step: string, signal = new AbortController().signal) => {
      const result = await scanComponents(
        target,
        request(target, lifecycleCase.rules),
        scanContext,
        signal,
        registry,
      );
      const view = buildRepairView(result.scan, result.evidence);
      steps.push({ step, ...result, view });
      return { ...result, view, summary: summarize(result.scan, view) };
    };
    const members = (summary: ReturnType<typeof summarize>, definition: string) =>
      summary.scopes.find((scope) => scope.definition === definition)?.members ?? [];
    const mutate = (script: string) => page.evaluate(script);
    try {
      registry.associate(target, lifecycleCase.associate);
      const initial = await run("initial");
      expect(members(initial.summary, "ProductCard")).toEqual(["n0", "n1", "n2", "n20"]);
      expect(members(initial.summary, "PageShell")).toEqual(["n10"]);
      expect(tokenOf(initial.scan, initial.evidence, "n2")).toBe("p2");
      expect(attributionFor(initial.scan, initial.evidence, "n10")).toMatchObject({
        status: "supported",
        placement: "slotted",
      });

      await mutate("document.getElementById('list').prepend(document.getElementById('card-2'))");
      const reordered = await run("reorder");
      expect(members(reordered.summary, "ProductCard")).toEqual(["n0", "n1", "n2", "n20"]);
      expect(tokenOf(reordered.scan, reordered.evidence, "n2")).toBe("p2");
      // Earlier evidence never attaches to a newer scan's occurrences.
      expect(() => buildRepairView(reordered.scan, initial.evidence)).toThrow("does not match");

      await mutate("document.getElementById('card-1').remove()");
      const removed = await run("removal");
      expect(members(removed.summary, "ProductCard")).toEqual(["n0", "n2", "n20"]);
      expect(() => buildRepairView(removed.scan, reordered.evidence)).toThrow("does not match");

      await mutate(`{
        const old = document.getElementById('card-0');
        const next = old.cloneNode(true);
        next.setAttribute('data-propellr-instance', 'p0-r1');
        next.querySelector('button').setAttribute('data-propellr-owner', 'p0-r1');
        old.replaceWith(next);
      }`);
      const rerendered = await run("rerender");
      expect(tokenOf(rerendered.scan, rerendered.evidence, "n0")).toBe("p0-r1");
      expect(JSON.stringify(rerendered.evidence.instances)).not.toContain('"instance":"p0"');

      await mutate(`{
        const row = document.getElementById('card-2');
        row.setAttribute('data-propellr-instance', 'p40');
        row.querySelector('button').setAttribute('data-propellr-owner', 'p40');
      }`);
      const reused = await run("virtualized-reuse");
      expect(tokenOf(reused.scan, reused.evidence, "n2")).toBe("p40");
      expect(JSON.stringify(reused.evidence.instances)).not.toContain('"instance":"p2"');

      await mutate("document.getElementById('slot-b').append(document.getElementById('n10'))");
      const reassigned = await run("slot-reassignment");
      expect(attributionFor(reassigned.scan, reassigned.evidence, "n10")).toMatchObject({
        status: "supported",
        placement: "slotted",
      });
      await mutate("document.getElementById('n10').removeAttribute('data-propellr-owner')");
      const ownerless = await run("slot-without-owner");
      const uncertain = attributionFor(ownerless.scan, ownerless.evidence, "n10");
      expect(uncertain).toMatchObject({
        status: "unknown",
        reason: { code: "ownership-uncertain" },
      });
      const candidateTokens = (uncertain?.status === "unknown" ? uncertain.candidates : []).map(
        (key) => {
          const instance = ownerless.evidence.instances.find((entry) => entry.key === key);
          return instance?.status === "supported" ? instance.instance : undefined;
        },
      );
      expect(candidateTokens).toEqual(["sb", "pg0"]);
      expect(ownerless.summary.unattributed).toEqual({ n10: "unknown" });

      await mutate(`{
        const node = document.getElementById('n10');
        node.setAttribute('data-propellr-owner', 'pg0');
        document.body.append(node);
      }`);
      const portal = await run("portal");
      expect(attributionFor(portal.scan, portal.evidence, "n10")).toMatchObject({
        status: "supported",
        placement: "detached",
      });
      expect(members(portal.summary, "PageShell")).toEqual(["n10"]);

      // A mutation after collection but before transfer confirmation stales all identity.
      const evaluate = page.evaluate.bind(page);
      let calls = 0;
      const spy = vi.spyOn(page, "evaluate").mockImplementation(async (...args) => {
        const result = await evaluate(...args);
        if (++calls === 1)
          await evaluate("document.getElementById('n0').setAttribute('data-touched', '1')");
        return result;
      });
      const stale = await run("mutation-during-transfer").finally(() => spy.mockRestore());
      expect(stale.scan.coverage.state).toBe("stale");
      expect(stale.evidence.availability.state).toBe("stale");
      expect(stale.evidence.attributions).toEqual([]);
      expect(stale.view.scopes).toEqual([]);
      expect(new Set(Object.values(stale.summary.unattributed))).toEqual(new Set(["stale"]));

      // Cancellation commits neither a scan nor evidence; the next scan is unaffected.
      const cancelled = new AbortController();
      cancelled.abort();
      await expect(run("cancelled", cancelled.signal)).rejects.toThrow("scan-cancelled");
      const midflight = new AbortController();
      const abortSpy = vi.spyOn(page, "evaluate").mockImplementation(async (...args) => {
        const result = await evaluate(...args);
        midflight.abort();
        return result;
      });
      await expect(
        run("cancelled-midflight", midflight.signal).finally(() => abortSpy.mockRestore()),
      ).rejects.toThrow("scan-cancelled");
      const resumed = await run("after-cancellation");
      expect(resumed.evidence.availability.state).toBe("complete");
      // Narrowed scope is never evaluated or enriched with different semantics.
      const whole = request(target, lifecycleCase.rules);
      const narrowed = await scanComponents(
        target,
        {
          ...whole,
          scope: {
            ...whole.scope,
            exclude: [
              { ...whole.scope.include[0], path: [{ kind: "element", selector: "#list" }] },
            ],
          },
        },
        scanContext,
        new AbortController().signal,
        registry,
      );
      expect(narrowed.scan.coverage).toMatchObject({
        state: "partial",
        gaps: [{ code: "scope-unavailable" }],
      });
      expect(narrowed.evidence.availability).toMatchObject({
        state: "unavailable",
        reason: { code: "component-capture-unavailable" },
      });

      // Frame navigation replaces the document: old requests fail, association lapses.
      const previous = request(target, lifecycleCase.rules);
      await page.frames()[1]!.goto("about:blank");
      expect(target.documentId).not.toBe(previous.scope.include[0].documentId);
      await expect(
        scanComponents(target, previous, scanContext, new AbortController().signal, registry),
      ).rejects.toThrow("scan-document-changed");
      const unassociated = await run("navigated-unassociated");
      expect(unassociated.view.scopes).toEqual([]);
      expect(
        unassociated.evidence.instances.every(
          (entry) =>
            entry.status === "conflicting" &&
            entry.reasons.some(({ code }) => code === "unassociated-build"),
        ),
      ).toBe(true);
      expect(() => buildRepairView(unassociated.scan, resumed.evidence)).toThrow("does not match");
      registry.associate(target, lifecycleCase.associate);
      const reassociated = await run("navigated-reassociated");
      expect(members(reassociated.summary, "ProductCard")).toEqual(["n0", "n2"]);
    } finally {
      await archive(`${engine}-lifecycle.json`, { steps });
      registry.release(target);
      await target.release();
      await context.close();
      await browser.close();
    }
  });
