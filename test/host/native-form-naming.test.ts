import { mkdir, readFile, writeFile } from "node:fs/promises";
import { expect, test } from "vitest";
import { implementedRules } from "../../src/analysis.js";
import type { ScanRequest } from "../../src/contracts.js";
import { browserTypes, BrowserTarget } from "../../src/host/browser.js";
import { FIXTURE_URL } from "../../src/host/fixture.js";
import { LOCAL_POLICY } from "../../src/host/runtime.js";
import { scanTarget } from "../../src/host/scan.js";
import reference from "../../reference.json" with { type: "json" };
import {
  nativeFormHtml,
  nativeFormRules,
  repairNativeForm,
  breakNativeForm,
} from "../fixtures/native-form-naming.js";
import { meta, terminal, unwrap, withHost } from "../support/host.js";
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

for (const engine of ["chromium", "firefox", "webkit"] as const)
  test(`${engine}: enabled native form IPC history equals full/canonical scans without hiding geometry gaps`, async () => {
    const browser = await browserTypes[engine].launch();
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1,
    });
    await context.route("**/*", (route) =>
      route.fulfill({
        contentType: "text/html",
        body:
          route.request().url() === FIXTURE_URL
            ? nativeFormHtml
            : '<main><select id="denied-control"></select></main>',
      }),
    );
    const page = await context.newPage();
    const fixture = { id: "native-form-host", html: nativeFormHtml, expected: {} };
    // No engine observes a page previously mutated by the other engine.
    const fullPage = await fixturePage(browser, fixture);
    const canonical = await fixturePage(browser, fixture);
    const fullTarget = new BrowserTarget(fullPage.page, "borrowed");
    const records: object[] = [];
    try {
      await page.goto(FIXTURE_URL);
      await page.evaluate("document.fonts.ready.then(() => true)");
      await injectReference(canonical.page, await referenceBundle());
      const mutate = async (script: string) => {
        for (const target of [page, fullPage.page, canonical.page]) await target.evaluate(script);
      };
      await withHost(
        async ({ client }) => {
          const session = unwrap(
            await client.open({
              ...meta(),
              policy: LOCAL_POLICY,
              target: { kind: "attached", targetId: "native-form" },
            }),
          );
          expect(session.capabilities).toEqual(
            expect.arrayContaining(["three-rule-slice", "six-rule-slice", "native-form-naming"]),
          );
          const scan = async (
            state: string,
            change?: (request: ScanRequest) => ScanRequest,
            compare = true,
          ) => {
            const current = unwrap(
              await client.inspect({ ...meta(), sessionId: session.id }),
            ).session;
            const document = current.documents[0];
            if (!document) throw new Error("Missing current document");
            const base: ScanRequest = {
              mode: "incremental",
              scope: { include: [{ ...document, path: [] }], exclude: [] },
              rules: {
                kind: "explicit",
                rules: [
                  { id: "input-button-name", options: {} },
                  { id: "input-image-alt", options: {} },
                  { id: "select-name", options: {} },
                ],
              },
            };
            const request = change ? change(base) : base;
            const accepted = unwrap(
              await client.scan({ ...meta(), sessionId: session.id, scan: request }),
            );
            const finished = await terminal(client, accepted);
            if (finished.kind !== "scan" || finished.state !== "completed")
              throw new Error(JSON.stringify(finished));
            const result = finished.result;
            expect(result.execution).toMatchObject({
              requested: "incremental",
              actual: "full",
              fallback: { code: "full-scan-fallback" },
            });
            if (compare) {
              const full = await scanTarget(
                fullTarget,
                {
                  ...request,
                  mode: "full",
                  scope: {
                    include: [
                      { pageId: fullTarget.pageId, documentId: fullTarget.documentId, path: [] },
                    ],
                    exclude: [],
                  },
                },
                {
                  policy: LOCAL_POLICY,
                  configuration: { id: "native-form", version: "1" },
                  origin: { kind: "direct" },
                },
                new AbortController().signal,
              );
              const axe = await runReference(
                canonical.page,
                full.resolvedRules.map(({ rule }) => rule.id),
              );
              records.push({ state, request, propellr: result, full, reference: axe });
              expect(result.coverage.state).toBe("complete");
              expect(full.coverage.state).toBe("complete");
              expect(propellrSemantic(result)).toEqual(propellrSemantic(full));
              expect(propellrSemantic(full)).toEqual(axeSemantic(axe));
              expect(evidenceDifferences(result, axe)).toEqual([]);
              expect(evidenceDifferences(full, axe)).toEqual([]);
            } else records.push({ state, request, propellr: result });
            return result;
          };
          for (const id of ["action", "image", "choice"])
            expect(await page.locator(`#${id}`).isEnabled()).toBe(true);
          const first = await scan("broken");
          expect(first.resolvedRules.map(({ rule }) => rule.id)).toEqual([...nativeFormRules]);
          expect(first.report).toMatchObject({
            counts: { violationOccurrences: 3, uniqueViolationIssues: 3, incompleteOccurrences: 0 },
            gate: { decision: "fail" },
          });
          expect(
            first.report?.groups.map(({ rule, lifecycle }) => [rule.id, lifecycle]).sort(),
          ).toEqual(nativeFormRules.map((id) => [id, "new"]));
          const identities = first.report?.groups.map(({ id }) => id);
          await mutate(
            "document.querySelector('#unrelated').textContent='Changed';document.querySelector('#choice').selectedIndex=1;document.querySelector('#second').textContent='OPTION_SENTINEL'",
          );
          const persistent = await scan("option-and-unrelated-change");
          expect(persistent.report?.groups.map(({ id }) => id)).toEqual(identities);
          expect(
            persistent.report?.groups.every(
              (group) => group.lifecycle === "existing" && group.members.length === 2,
            ),
          ).toBe(true);
          expect(persistent.report?.counts.violationOccurrences).toBe(3);
          await mutate(repairNativeForm);
          const repaired = await scan("absent-value-repaired");
          expect(repaired.report).toMatchObject({
            counts: { violationOccurrences: 0 },
            gate: { decision: "pass" },
          });
          expect(repaired.report?.groups).toHaveLength(3);
          expect(repaired.report?.groups.every(({ lifecycle }) => lifecycle === "resolved")).toBe(
            true,
          );
          await mutate(breakNativeForm);
          const recurring = await scan("whitespace-value-recurring");
          expect(recurring.report?.gate?.decision).toBe("fail");
          expect(recurring.report?.groups.map(({ id }) => id)).toEqual(identities);
          expect(recurring.report?.groups.every(({ lifecycle }) => lifecycle === "recurring")).toBe(
            true,
          );
          await mutate(
            `${repairNativeForm};document.querySelector('#action').setAttribute('value','VALUE_SENTINEL');document.querySelector('#image').setAttribute('alt','ALT_SENTINEL');document.querySelector('#choice-label').textContent='LABEL_SENTINEL'`,
          );
          const namedValue = await scan("nonempty-value-repaired");
          expect(namedValue.report?.gate?.decision).toBe("pass");
          const evidence = JSON.stringify(namedValue.rules);
          for (const sentinel of [
            "OPTION_SENTINEL",
            "VALUE_SENTINEL",
            "ALT_SENTINEL",
            "LABEL_SENTINEL",
          ])
            expect(evidence).not.toContain(sentinel);
          await mutate(
            `${breakNativeForm};document.querySelector('#action').setAttribute('value','')`,
          );
          const emptyValue = await scan("empty-value-recurring");
          expect(emptyValue.report?.counts.violationOccurrences).toBe(3);
          expect(
            emptyValue.report?.groups.every(({ lifecycle }) => lifecycle === "recurring"),
          ).toBe(true);
          await mutate(repairNativeForm);
          const narrow = await scan("narrow", (request) => ({
            ...request,
            rules: { kind: "explicit", rules: [{ id: "select-name", options: {} }] },
          }));
          expect(narrow.report?.comparison.state).toBe("not-comparable");
          expect(narrow.report?.groups.some(({ lifecycle }) => lifecycle === "resolved")).toBe(
            false,
          );
          const partial = await scan(
            "excluded-scope",
            (request) => ({
              ...request,
              scope: {
                ...request.scope,
                exclude: [
                  { ...request.scope.include[0], path: [{ kind: "element", selector: "#action" }] },
                ],
              },
            }),
            false,
          );
          expect(partial.coverage.state).toBe("partial");
          expect(partial.report?.gate?.decision).toBe("indeterminate");
          expect(partial.report?.groups.some(({ lifecycle }) => lifecycle === "resolved")).toBe(
            false,
          );
          const nine = await scan(
            "nine-rule-geometry-gap",
            (request) => ({
              ...request,
              rules: {
                kind: "explicit",
                rules: [
                  { id: implementedRules[0], options: {} },
                  ...implementedRules.slice(1).map((id) => ({ id, options: {} })),
                ],
              },
            }),
            false,
          );
          expect(nine.resolvedRules).toHaveLength(9);
          expect(nine.coverage.state).toBe("partial");
          expect(nine.report?.gate?.decision).toBe("indeterminate");
          expect(nine.report?.groups.some(({ lifecycle }) => lifecycle === "resolved")).toBe(false);
          const geometry = nine.rules.find(({ rule }) => rule.id === "target-size");
          if (geometry?.state !== "evaluated")
            throw new Error("Expected actual geometry evaluation");
          expect(geometry.occurrences.some(({ outcome }) => outcome === "incomplete")).toBe(true);
          expect(
            propellrSemantic(nine).filter(({ rule }) => nativeFormRules.some((id) => id === rule)),
          ).toEqual(propellrSemantic(namedValue));
          await page.evaluate(
            "new Promise(resolve => {const frame=document.createElement('iframe');frame.id='denied';frame.title='Denied';frame.onload=resolve;frame.src='http://denied.invalid/form';document.body.append(frame)})",
          );
          const denied = await scan("denied-frame", undefined, false);
          expect(denied.coverage).toMatchObject({
            state: "partial",
            gaps: expect.arrayContaining([expect.objectContaining({ code: "frame-unavailable" })]),
          });
          expect(denied.report?.gate?.decision).toBe("indeterminate");
          expect(denied.report?.groups.some(({ lifecycle }) => lifecycle === "resolved")).toBe(
            false,
          );
          unwrap(await client.end({ ...meta(), sessionId: session.id }));
          expect(page.isClosed()).toBe(false);
        },
        { borrowed: new Map([["native-form", page]]) },
      );
    } finally {
      await mkdir("artifacts/parity", { recursive: true });
      await writeFile(
        `artifacts/parity/${engine}-native-form-host.json`,
        JSON.stringify(
          {
            environment: await environment(browser),
            referencePin: reference.primary,
            propellrBundleHash: hash(await readFile("dist/browser/propellr.js")),
            fixtureHash: hash(nativeFormHtml),
            records,
          },
          null,
          2,
        ),
      );
      await fullTarget.release();
      await fullPage.context.close();
      await canonical.context.close();
      await context.close();
      await browser.close();
    }
  });
