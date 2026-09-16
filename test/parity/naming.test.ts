import { mkdir, readFile, writeFile } from "node:fs/promises";
import { expect, test } from "vitest";
import { browserTypes, BrowserTarget } from "../../src/host/browser.js";
import { scanTarget } from "../../src/host/scan.js";
import { sixRuleRequest } from "../../src/analysis.js";
import reference from "../../reference.json" with { type: "json" };
import {
  namingFixtures,
  combinedNamingHtml,
  repairNaming,
  breakNaming,
} from "../fixtures/naming.js";
import {
  axeSemantic,
  environment,
  evidenceDifferences,
  fixturePage,
  hash,
  injectReference,
  propellrSemantic,
  referenceBundle,
  runReference,
} from "../support/parity.js";

const scanContext = {
  policy: { id: "test", version: "1" },
  configuration: { id: "naming", version: "1" },
  origin: { kind: "direct" },
} as const;
for (const engine of ["chromium", "firefox", "webkit"] as const) {
  test(`${engine}: naming check combinations, root scope and bounded unsupported evidence`, async () => {
    const browser = await browserTypes[engine].launch();
    const bundle = await referenceBundle();
    const records: object[] = [];
    const failures: string[] = [];
    try {
      for (const fixture of namingFixtures) {
        const own = await fixturePage(browser, fixture);
        const canonical = await fixturePage(browser, fixture);
        const target = new BrowserTarget(own.page, "borrowed");
        try {
          await injectReference(canonical.page, bundle);
          const request = {
            ...sixRuleRequest({ pageId: target.pageId, documentId: target.documentId, path: [] }),
            rules: { kind: "explicit", rules: [{ id: fixture.rule, options: {} }] },
          } as const;
          const result = await scanTarget(
            target,
            request,
            scanContext,
            new AbortController().signal,
          );
          const axe = await runReference(canonical.page, [fixture.rule]);
          const actual = propellrSemantic(result);
          const expected = axeSemantic(axe);
          const changedKeys = [
            ...new Set([...actual, ...expected].map((node) => `${node.rule}:${node.target}`)),
          ].filter(
            (key) =>
              JSON.stringify(actual.filter((node) => `${node.rule}:${node.target}` === key)) !==
              JSON.stringify(expected.filter((node) => `${node.rule}:${node.target}` === key)),
          );
          const evidence = evidenceDifferences(result, axe);
          for (const key of changedKeys)
            if (!fixture.allowedMismatches?.includes(key))
              failures.push(`${fixture.id}: semantic ${key}`);
          for (const key of evidence)
            if (!fixture.allowedMismatches?.some((allowed) => key.startsWith(`${allowed}:`)))
              failures.push(`${fixture.id}: evidence ${key}`);
          for (const outcome of ["pass", "violation", "incomplete"] as const) {
            const targets = actual
              .filter((node) => node.outcome === outcome)
              .map((node) => node.target)
              .sort();
            const wanted = [
              ...(outcome === "pass"
                ? fixture.passes
                : outcome === "violation"
                  ? (fixture.expected[fixture.rule] ?? [])
                  : (fixture.incomplete?.[fixture.rule] ?? [])),
            ].sort();
            if (JSON.stringify(targets) !== JSON.stringify(wanted))
              failures.push(
                `${fixture.id}: expected ${outcome} ${JSON.stringify(wanted)}, got ${JSON.stringify(targets)}`,
              );
          }
          if (!actual.length) {
            if (
              result.rules[0]?.state !== "inapplicable" ||
              !axe.inapplicable.some((rule) => rule.id === fixture.rule)
            )
              failures.push(`${fixture.id}: applicability mismatch`);
          }
          if (result.coverage.state !== (fixture.unsupported ? "partial" : "complete"))
            failures.push(`${fixture.id}: coverage ${JSON.stringify(result.coverage)}`);
          if (fixture.id.endsWith("-budget"))
            expect(result.coverage).toMatchObject({
              state: "partial",
              gaps: expect.arrayContaining([expect.objectContaining({ code: "naming-limit" })]),
            });
          if (fixture.id.endsWith("-denied"))
            expect(result.coverage).toMatchObject({
              state: "partial",
              gaps: expect.arrayContaining([
                expect.objectContaining({ code: "frame-unavailable" }),
              ]),
            });
          records.push({
            fixture: fixture.id,
            fixtureHash: hash(JSON.stringify(fixture)),
            request,
            propellr: result,
            reference: axe,
            changedKeys,
            evidenceDifferences: evidence,
            disposition: fixture.unsupported ?? null,
          });
        } finally {
          await target.release();
          await own.context.close();
          await canonical.context.close();
        }
      }
    } finally {
      await mkdir("artifacts/parity", { recursive: true });
      await writeFile(
        `artifacts/parity/${engine}-naming.json`,
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

  test(`${engine}: dynamic six-rule scans equal fresh full and canonical results`, async () => {
    const browser = await browserTypes[engine].launch();
    const fixture = { id: "naming-dynamic", html: combinedNamingHtml, expected: {} };
    const own = await fixturePage(browser, fixture);
    const canonical = await fixturePage(browser, fixture);
    const target = new BrowserTarget(own.page, "borrowed");
    const records: object[] = [];
    try {
      await injectReference(canonical.page, await referenceBundle());
      for (const mutation of [
        "void 0",
        "document.querySelector('#unrelated').textContent='Changed'",
        repairNaming,
        breakNaming,
        "document.querySelector('#field').setAttribute('aria-labelledby','form-label')",
        repairNaming,
      ]) {
        await own.page.evaluate(mutation);
        await canonical.page.evaluate(mutation);
        const scope = { pageId: target.pageId, documentId: target.documentId, path: [] };
        const realtime = await scanTarget(
          target,
          sixRuleRequest(scope, "incremental"),
          scanContext,
          new AbortController().signal,
        );
        const full = await scanTarget(
          target,
          sixRuleRequest(scope),
          scanContext,
          new AbortController().signal,
        );
        const axe = await runReference(
          canonical.page,
          full.resolvedRules.map(({ rule }) => rule.id),
        );
        records.push({ mutation, realtime, full, reference: axe });
        expect(realtime.execution).toMatchObject({
          actual: "full",
          fallback: { code: "full-scan-fallback" },
        });
        expect(propellrSemantic(realtime)).toEqual(propellrSemantic(full));
        expect(propellrSemantic(full)).toEqual(axeSemantic(axe));
        expect(evidenceDifferences(full, axe)).toEqual([]);
        expect(full.coverage.state).toBe("complete");
      }
    } finally {
      await mkdir("artifacts/parity", { recursive: true });
      await writeFile(
        `artifacts/parity/${engine}-naming-dynamic.json`,
        JSON.stringify(records, null, 2),
      );
      await target.release();
      await own.context.close();
      await canonical.context.close();
      await browser.close();
    }
  });
}
