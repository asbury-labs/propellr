import { mkdir, readFile, writeFile } from "node:fs/promises";
import { describe, expect, test } from "vitest";
import { browserTypes, BrowserTarget } from "../../src/host/browser.js";
import { scanTarget } from "../../src/host/scan.js";
import { selectedRequest, sliceRules } from "../../src/analysis.js";
import catalog from "../../src/catalog.json" with { type: "json" };
import reference from "../../reference.json" with { type: "json" };
import { fixtures, dynamicHtml } from "../fixtures/slice.js";
import {
  axeSemantic,
  axeTargetPath,
  evidenceDifferences,
  environment,
  fixturePage,
  hash,
  injectReference,
  propellrSemantic,
  referenceBundle,
  referenceInventory,
  referenceActivation,
  runReference,
} from "../support/parity.js";

test("reference target grouping preserves shadow versus frame boundaries", () => {
  expect(axeTargetPath(["#host", ["#a", "#b"]])).toEqual([
    { kind: "frame", selector: "#host" },
    { kind: "shadow", selector: "#a" },
    { kind: "element", selector: "#b" },
  ]);
  expect(axeTargetPath(["#host", ["#a", "#b"]])).not.toEqual(axeTargetPath(["#host", "#a", "#b"]));
  expect(axeTargetPath([["#host", "#button"]])).not.toEqual(axeTargetPath(["#host", "#button"]));
});

const context = {
  policy: { id: "test", version: "1" },
  configuration: { id: "slice", version: "1" },
  origin: { kind: "direct" },
} as const;
for (const engine of ["chromium", "firefox", "webkit"] as const)
  describe(engine, () => {
    test("non-empty catalog, raw reference comparisons and classified branch limits", async () => {
      const bundle = await referenceBundle();
      const browser = await browserTypes[engine].launch();
      const records: object[] = [];
      const failures: string[] = [];
      try {
        for (const fixture of fixtures) {
          const propellr = await fixturePage(browser, fixture);
          const canonical = await fixturePage(browser, fixture);
          const target = new BrowserTarget(propellr.page, "borrowed");
          try {
            await injectReference(canonical.page, bundle);
            const inventory = await referenceInventory(canonical.page);
            expect([...inventory].sort()).toEqual(catalog.rules.map((rule) => rule.id).sort());
            if (fixture.id === "naming") {
              expect(
                (await referenceActivation(canonical.page)).sort((a, b) =>
                  a.id.localeCompare(b.id),
                ),
              ).toEqual(
                catalog.rules
                  .map(({ id, defaultEnabled, experimental }) => ({
                    id,
                    defaultEnabled,
                    experimental,
                  }))
                  .sort((a, b) => a.id.localeCompare(b.id)),
              );
            }
            expect(
              catalog.rules
                .filter((rule) => rule.implementation === "selected-partial")
                .map((rule) => rule.id)
                .sort(),
            ).toEqual([...sliceRules].sort());
            expect(catalog.rules.find((rule) => rule.id === "target-size")?.defaultEnabled).toBe(
              false,
            );
            const request = selectedRequest({
              pageId: target.pageId,
              documentId: target.documentId,
              path: [],
            });
            const own = await scanTarget(target, request, context, new AbortController().signal);
            const axe = await runReference(canonical.page);
            if (fixture.id === "aria-command-not-native-button") {
              expect(own.rules.find((entry) => entry.rule.id === "button-name")?.state).toBe(
                "inapplicable",
              );
              expect(axe.inapplicable.some((entry) => entry.id === "button-name")).toBe(true);
              expect(
                axeSemantic(await runReference(canonical.page, ["aria-command-name"])),
              ).toContainEqual({
                rule: "aria-command-name",
                outcome: "violation",
                target: "#role-button",
                path: [{ kind: "element", selector: "#role-button" }],
                impact: "serious",
              });
            }
            if (fixture.id === "shadow-rooted-modal") {
              expect(own.rules.every((entry) => entry.state === "not-evaluated")).toBe(true);
              expect(own.coverage).toMatchObject({
                state: "partial",
                gaps: [{ code: "shadow-modal-unavailable" }],
              });
            }
            if (fixture.id === "modal-main-exception") {
              expect(
                own.rules.find((entry) => entry.rule.id === "landmark-one-main"),
              ).toMatchObject({
                state: "inapplicable",
              });
            }
            const actual = propellrSemantic(own);
            const expected = axeSemantic(axe);
            const changedKeys = [
              ...new Set([...actual, ...expected].map((node) => `${node.rule}:${node.target}`)),
            ].filter(
              (key) =>
                JSON.stringify(actual.filter((node) => `${node.rule}:${node.target}` === key)) !==
                JSON.stringify(expected.filter((node) => `${node.rule}:${node.target}` === key)),
            );
            const evidence = evidenceDifferences(own, axe);
            const main = own.rules.find((entry) => entry.rule.id === "landmark-one-main");
            if (main?.state === "evaluated")
              for (const occurrence of main.occurrences)
                expect(occurrence.evidence[0]).toMatchObject({
                  observed: fixture.mainPresence ?? { present: true, modal: false },
                  expected: { present: true },
                });
            const mismatch = changedKeys.length > 0 || evidence.length > 0;
            for (const key of changedKeys)
              if (!fixture.allowedMismatches?.includes(key))
                failures.push(`${fixture.id}: unexpected mismatch ${key}`);
            for (const key of evidence)
              if (!fixture.allowedMismatches?.some((allowed) => key.startsWith(`${allowed}:`)))
                failures.push(`${fixture.id}: evidence mismatch ${key}`);
            const entry = {
              fixture: fixture.id,
              fixtureHash: hash(JSON.stringify(fixture)),
              request,
              propellr: own,
              reference: axe,
              semantic: { propellr: actual, reference: expected },
              evidenceDifferences: evidence,
              changedKeys,
              mismatch: mismatch
                ? {
                    classification: fixture.unsupported ? "unsupported-scope" : "unresolved",
                    disposition: fixture.unsupported ?? "Investigate before claiming parity",
                    reproduction: `pnpm test:parity (${engine}, ${fixture.id})`,
                  }
                : null,
            };
            records.push(entry);
            if (mismatch && !fixture.unsupported)
              failures.push(`${fixture.id}: raw occurrence mismatch`);
            if (!fixture.unsupported && own.coverage.state !== "complete")
              failures.push(`${fixture.id}: unexpected coverage ${JSON.stringify(own.coverage)}`);
            for (const rule of sliceRules) {
              const violations = actual
                .filter((node) => node.rule === rule && node.outcome === "violation")
                .map((node) => node.target)
                .sort();
              if (
                JSON.stringify(violations) !==
                JSON.stringify([...(fixture.expected[rule] ?? [])].sort())
              )
                failures.push(
                  `${fixture.id}/${rule}: independently expected violations differ: ${JSON.stringify(violations)}`,
                );
              const incomplete = actual
                .filter((node) => node.rule === rule && node.outcome === "incomplete")
                .map((node) => node.target)
                .sort();
              if (
                JSON.stringify(incomplete) !==
                JSON.stringify([...(fixture.incomplete?.[rule] ?? [])].sort())
              )
                failures.push(
                  `${fixture.id}/${rule}: independently expected incomplete targets differ: ${JSON.stringify(incomplete)}`,
                );
            }
            if (fixture.unsupported && own.coverage.state === "complete")
              failures.push(`${fixture.id}: unsupported coverage hidden`);
            if (fixture.id === "denied-frame")
              expect(own.coverage).toMatchObject({
                state: "partial",
                gaps: expect.arrayContaining([
                  expect.objectContaining({ code: "frame-unavailable" }),
                ]),
              });
            if (fixture.id === "negative-tabindex")
              expect(
                actual
                  .filter((node) => node.rule === "target-size")
                  .every((node) => node.outcome === "incomplete"),
              ).toBe(true);
          } finally {
            await target.release();
            await propellr.context.close();
            await canonical.context.close();
          }
        }
      } finally {
        await mkdir("artifacts/parity", { recursive: true });
        await writeFile(
          `artifacts/parity/${engine}.json`,
          JSON.stringify(
            {
              environment: await environment(browser),
              referencePin: reference.primary,
              propellrBundleHash: hash(await readFile("dist/browser/propellr.js")),
              records,
              failures,
            },
            null,
            2,
          ),
        );
        await browser.close();
      }
      expect(failures).toEqual([]);
    });

    test("realtime requests use fresh full scans for naming, layout and unrelated mutations", async () => {
      const browser = await browserTypes[engine].launch();
      const fixture = { id: "dynamic", html: dynamicHtml, expected: {} };
      const own = await fixturePage(browser, fixture);
      const canonical = await fixturePage(browser, fixture);
      const target = new BrowserTarget(own.page, "borrowed");
      const records: object[] = [];
      try {
        await injectReference(canonical.page, await referenceBundle());
        for (const mutation of [
          "void 0",
          "document.querySelector('#label').textContent=''",
          "document.querySelector('#unrelated').textContent='Changed'",
          "document.querySelector('#dynamic').style.width='24px'",
          "document.querySelector('#label').textContent='Save'",
        ]) {
          await own.page.evaluate(mutation);
          await canonical.page.evaluate(mutation);
          const scope = { pageId: target.pageId, documentId: target.documentId, path: [] };
          const realtime = await scanTarget(
            target,
            selectedRequest(scope, "incremental"),
            context,
            new AbortController().signal,
          );
          const full = await scanTarget(
            target,
            selectedRequest(scope),
            context,
            new AbortController().signal,
          );
          const axe = await runReference(canonical.page);
          records.push({ mutation, realtime, full, reference: axe });
          expect(realtime.execution).toMatchObject({
            actual: "full",
            fallback: { code: "full-scan-fallback" },
          });
          expect(full.epoch).toBeGreaterThan(realtime.epoch);
          expect(propellrSemantic(realtime)).toEqual(propellrSemantic(full));
          expect(propellrSemantic(full)).toEqual(axeSemantic(axe));
        }
        const request = selectedRequest({
          pageId: target.pageId,
          documentId: target.documentId,
          path: [],
        });
        const defaults = await scanTarget(
          target,
          { ...request, rules: { kind: "defaults" } },
          context,
          new AbortController().signal,
        );
        expect(defaults.resolvedRules.length).toBeGreaterThan(3);
        expect(defaults.coverage.state).toBe("partial");
        expect(defaults.resolvedRules.some(({ rule }) => rule.id === "target-size")).toBe(false);
        const unsupported = await scanTarget(
          target,
          {
            ...request,
            rules: {
              kind: "explicit",
              rules: [
                { id: "unknown", options: {} },
                { id: "target-size", options: { minSize: 44 } },
              ],
            },
          },
          context,
          new AbortController().signal,
        );
        expect(unsupported.rules.every((rule) => rule.state === "not-evaluated")).toBe(true);
        const narrow = await scanTarget(
          target,
          {
            ...request,
            scope: {
              ...request.scope,
              exclude: [
                { ...request.scope.include[0], path: [{ kind: "element", selector: "#dynamic" }] },
              ],
            },
          },
          context,
          new AbortController().signal,
        );
        expect(narrow.coverage.state).toBe("partial");
        expect(narrow.rules.every((rule) => rule.state === "not-evaluated")).toBe(true);
        records.push({ defaults, unsupported, narrow });
      } finally {
        await mkdir("artifacts/parity", { recursive: true });
        await writeFile(
          `artifacts/parity/${engine}-dynamic.json`,
          JSON.stringify(records, null, 2),
        );
        await target.release();
        await own.context.close();
        await canonical.context.close();
        await browser.close();
      }
    });
  });
