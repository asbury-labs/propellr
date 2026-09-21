import { mkdir, readFile, writeFile } from "node:fs/promises";
import { expect, test } from "vitest";
import { browserTypes, BrowserTarget } from "../../src/host/browser.js";
import { scanTarget } from "../../src/host/scan.js";
import { selectedRequest, sixRuleRequest, implementedRules } from "../../src/analysis.js";
import { pageIdSchema } from "../../src/validation.js";
import catalog from "../../src/catalog.json" with { type: "json" };
import reference from "../../reference.json" with { type: "json" };
import { nativeFormFixtures, nativeFormRules } from "../fixtures/native-form-naming.js";
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
  configuration: { id: "native-form-naming", version: "1" },
  origin: { kind: "direct" },
} as const;

test("catalog growth preserves exact three/six-rule selections and stable defaults", () => {
  const target = {
    pageId: pageIdSchema.parse("page_test"),
    documentId: "document_test",
    path: [],
  } as const;
  const three = selectedRequest(target).rules;
  const six = sixRuleRequest(target).rules;
  if (three.kind !== "explicit" || six.kind !== "explicit")
    throw new Error("Explicit selection required");
  expect(three.rules.map(({ id }) => id)).toEqual([
    "button-name",
    "target-size",
    "landmark-one-main",
  ]);
  expect(six.rules.map(({ id }) => id)).toEqual([
    "button-name",
    "target-size",
    "landmark-one-main",
    "image-alt",
    "link-name",
    "label",
  ]);
  expect(implementedRules).toHaveLength(9);
  expect(catalog.rules).toHaveLength(105);
  expect(catalog.rules.filter((rule) => rule.defaultEnabled && !rule.experimental)).toHaveLength(
    89,
  );
  expect(catalog.rules.filter((rule) => rule.implementation === "not-implemented")).toHaveLength(
    96,
  );
  for (const rule of nativeFormRules) {
    expect(catalog.rules.find(({ id }) => id === rule)).toMatchObject({
      defaultEnabled: true,
      implementation: "selected-partial",
    });
    expect(
      nativeFormFixtures.some((fixture) => fixture.rule === rule && fixture.passes.length),
    ).toBe(true);
    expect(
      nativeFormFixtures.some((fixture) => fixture.rule === rule && fixture.expected[rule]?.length),
    ).toBe(true);
    expect(
      nativeFormFixtures.some(
        (fixture) => fixture.rule === rule && fixture.incomplete?.[rule]?.length,
      ),
    ).toBe(true);
  }
});

for (const engine of ["chromium", "firefox", "webkit"] as const)
  test(`${engine}: native form names preserve canonical checks, scope and declared limits`, async () => {
    const browser = await browserTypes[engine].launch();
    const bundle = await referenceBundle();
    const records: object[] = [];
    const failures: string[] = [];
    try {
      for (const fixture of nativeFormFixtures) {
        const own = await fixturePage(browser, fixture);
        const canonical = await fixturePage(browser, fixture);
        const target = new BrowserTarget(own.page, "borrowed");
        try {
          await injectReference(canonical.page, bundle);
          const request = {
            mode: "full",
            scope: {
              include: [{ pageId: target.pageId, documentId: target.documentId, path: [] }],
              exclude: [],
            },
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
          if (
            fixture.referenceOutcome &&
            (expected.length !== 1 || expected[0]?.outcome !== fixture.referenceOutcome)
          )
            failures.push(`${fixture.id}: reference disposition no longer matches raw outcome`);
          const changedKeys = [
            ...new Set([...actual, ...expected].map((node) => `${node.rule}:${node.target}`)),
          ].filter(
            (key) =>
              JSON.stringify(actual.filter((node) => `${node.rule}:${node.target}` === key)) !==
              JSON.stringify(expected.filter((node) => `${node.rule}:${node.target}` === key)),
          );
          const evidence = evidenceDifferences(result, axe);
          records.push({
            fixture: fixture.id,
            fixtureHash: hash(JSON.stringify(fixture)),
            request,
            propellr: result,
            reference: axe,
            changedKeys,
            evidenceDifferences: evidence,
            disposition: fixture.approvedDivergence
              ? {
                  kind: "approved-divergence",
                  id: fixture.approvedDivergence,
                  approval: "Tony, 2026-09-16",
                }
              : (fixture.unsupported ?? null),
          });
          // Approved differences stay exact, not a target-wide semantic/evidence allowlist.
          if (fixture.approvedDivergence) {
            const uppercase = fixture.approvedDivergence === "native-type-case";
            const selector = uppercase ? "#uppercase" : "#empty-wrap";
            const key = `${fixture.rule}:${selector}`;
            expect(changedKeys).toEqual([key]);
            expect(actual).toEqual([
              {
                rule: fixture.rule,
                outcome: uppercase ? "pass" : "violation",
                target: selector,
                path: [{ kind: "element", selector }],
                impact: uppercase ? null : "critical",
              },
            ]);
            const ownRule = result.rules[0];
            if (ownRule?.state !== "evaluated") throw new Error("Missing divergence evidence");
            expect(ownRule.occurrences[0]?.evidence[0]?.observed).toEqual({
              any: uppercase
                ? [{ id: "non-empty-if-present", result: true }]
                : [
                    ...["non-empty-alt", "aria-label", "aria-labelledby", "non-empty-title"].map(
                      (id) => ({ id, result: false }),
                    ),
                    {
                      id: "implicit-label",
                      result: false,
                      related: [[{ kind: "element", selector: "#empty-wrap-label" }]],
                    },
                    { id: "explicit-label", result: false, related: [] },
                  ],
              none: [],
            });
            if (uppercase) {
              expect(expected).toEqual([]);
              expect(axe.inapplicable.map(({ id }) => id)).toEqual([fixture.rule]);
              expect(evidence).toEqual([]);
            } else {
              expect(expected).toEqual([{ ...actual[0], outcome: "pass", impact: null }]);
              expect(axe.passes[0]?.nodes[0]).toMatchObject({
                any: [
                  {
                    id: "implicit-label",
                    data: { implicitLabel: "Submit" },
                    relatedNodes: [{ target: ["#empty-wrap-label"] }],
                  },
                ],
                all: [],
                none: [],
              });
              expect(evidence).toEqual(
                [
                  "non-empty-alt",
                  "aria-label",
                  "aria-labelledby",
                  "non-empty-title",
                  "explicit-label",
                ].map((id) => `${key}:any:${id}`),
              );
            }
          } else {
            for (const key of changedKeys)
              if (!fixture.allowedMismatches?.includes(key))
                failures.push(`${fixture.id}: semantic ${key}`);
            for (const key of evidence)
              if (!fixture.allowedMismatches?.some((allowed) => key.startsWith(`${allowed}:`)))
                failures.push(`${fixture.id}: evidence ${key}`);
          }
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
          if (
            result.rules.length !== 1 ||
            result.rules[0]?.rule.id !== fixture.rule ||
            result.rules[0]?.state !== (actual.length ? "evaluated" : "inapplicable") ||
            ![...axe.passes, ...axe.violations, ...axe.incomplete, ...axe.inapplicable].some(
              ({ id }) => id === fixture.rule,
            ) ||
            (!actual.length && !axe.inapplicable.some(({ id }) => id === fixture.rule))
          )
            failures.push(`${fixture.id}: rule state missing or incorrect`);
          if (result.coverage.state !== (fixture.unsupported ? "partial" : "complete"))
            failures.push(`${fixture.id}: coverage ${JSON.stringify(result.coverage)}`);
          const gap = fixture.id.endsWith("-budget")
            ? "naming-limit"
            : fixture.id.endsWith("-denied")
              ? "frame-unavailable"
              : undefined;
          if (
            gap &&
            (result.coverage.state !== "partial" ||
              !result.coverage.gaps.some(({ code }) => code === gap))
          )
            failures.push(`${fixture.id}: missing ${gap}`);
        } finally {
          await target.release();
          await own.context.close();
          await canonical.context.close();
        }
      }
    } finally {
      await mkdir("artifacts/parity", { recursive: true });
      await writeFile(
        `artifacts/parity/${engine}-native-form-naming.json`,
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
