import { mkdir, writeFile } from "node:fs/promises";
import { expect, test } from "vitest";
import { browserTypes } from "../../src/host/browser.js";
import { FIXTURE_URL } from "../../src/host/fixture.js";
import { LOCAL_POLICY } from "../../src/host/runtime.js";
import { sixRuleRequest } from "../../src/analysis.js";
import type { ScanRequest, ScanResult } from "../../src/contracts.js";
import { combinedNamingHtml, repairNaming, breakNaming } from "../fixtures/naming.js";
import { meta, terminal, unwrap, withHost } from "../support/host.js";

for (const engine of ["chromium", "firefox", "webkit"] as const)
  test(`${engine}: IPC naming scans preserve raw findings, history, gates and incomplete scope`, async () => {
    // Test owns and closes this local browser. Host borrows the explicitly registered page.
    const browser = await browserTypes[engine].launch();
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1,
    });
    const records: ScanResult[] = [];
    await context.route("**/*", (route) =>
      route.fulfill({
        contentType: "text/html",
        body:
          route.request().url() === FIXTURE_URL
            ? combinedNamingHtml
            : '<main><input id="denied-field"></main>',
      }),
    );
    const page = await context.newPage();
    try {
      await page.goto(FIXTURE_URL);
      await withHost(
        async ({ client }) => {
          const session = unwrap(
            await client.open({
              ...meta(),
              policy: LOCAL_POLICY,
              target: { kind: "attached", targetId: "naming-fixture" },
            }),
          );
          expect(session.capabilities).toEqual(
            expect.arrayContaining(["three-rule-slice", "six-rule-slice"]),
          );
          const scan = async (change?: (request: ScanRequest) => ScanRequest) => {
            const current = unwrap(
              await client.inspect({ ...meta(), sessionId: session.id }),
            ).session;
            const document = current.documents[0];
            if (!document) throw new Error("Missing live document");
            const request = sixRuleRequest({ ...document, path: [] }, "incremental");
            const accepted = unwrap(
              await client.scan({
                ...meta(),
                sessionId: session.id,
                scan: change ? change(request) : request,
              }),
            );
            const finished = await terminal(client, accepted);
            if (finished.kind !== "scan" || finished.state !== "completed")
              throw new Error(JSON.stringify(finished));
            records.push(finished.result);
            return finished.result;
          };
          const first = await scan();
          expect(first.rules.map(({ rule }) => rule.id).sort()).toEqual(
            [
              "button-name",
              "target-size",
              "landmark-one-main",
              "image-alt",
              "link-name",
              "label",
            ].sort(),
          );
          expect(first.coverage.state).toBe("complete");
          expect(first.execution).toMatchObject({ requested: "incremental", actual: "full" });
          expect(first.report).toMatchObject({
            counts: { violationOccurrences: 3, uniqueViolationIssues: 3, incompleteOccurrences: 0 },
            gate: { decision: "fail" },
          });
          expect(
            first.report?.groups.map(({ rule, lifecycle }) => [rule.id, lifecycle]).sort(),
          ).toEqual([
            ["image-alt", "new"],
            ["label", "new"],
            ["link-name", "new"],
          ]);
          const persistent = await scan();
          expect(
            persistent.report?.groups.every(
              (group) => group.lifecycle === "existing" && group.members.length === 2,
            ),
          ).toBe(true);
          expect(persistent.report?.counts.violationOccurrences).toBe(3);
          await page.evaluate(repairNaming);
          const repaired = await scan();
          expect(repaired.report?.gate?.decision).toBe("pass");
          expect(repaired.report?.counts.violationOccurrences).toBe(0);
          expect(repaired.report?.groups).toHaveLength(3);
          expect(repaired.report?.groups.every((group) => group.lifecycle === "resolved")).toBe(
            true,
          );
          await page.evaluate(breakNaming);
          const recurring = await scan();
          expect(recurring.report?.gate?.decision).toBe("fail");
          expect(recurring.report?.groups.every((group) => group.lifecycle === "recurring")).toBe(
            true,
          );
          expect(recurring.report?.groups.map((group) => group.id)).toEqual(
            first.report?.groups.map((group) => group.id),
          );
          await page.evaluate(repairNaming);
          const narrow = await scan((request) => ({
            ...request,
            rules: { kind: "explicit", rules: [{ id: "image-alt", options: {} }] },
          }));
          expect(narrow.report?.comparison.state).toBe("not-comparable");
          expect(narrow.report?.groups.some((group) => group.lifecycle === "resolved")).toBe(false);
          const partial = await scan((request) => ({
            ...request,
            scope: {
              ...request.scope,
              exclude: [
                { ...request.scope.include[0], path: [{ kind: "element", selector: "#photo" }] },
              ],
            },
          }));
          expect(partial.coverage.state).toBe("partial");
          expect(partial.report?.gate?.decision).toBe("indeterminate");
          expect(partial.report?.groups.some((group) => group.lifecycle === "resolved")).toBe(
            false,
          );
          await page.evaluate(
            `new Promise(resolve => { const frame=document.createElement('iframe'); frame.id='denied'; frame.title='Denied'; frame.onload=resolve; frame.src='http://denied.invalid/frame'; document.body.append(frame); })`,
          );
          const denied = await scan();
          expect(denied.coverage).toMatchObject({
            state: "partial",
            gaps: expect.arrayContaining([expect.objectContaining({ code: "frame-unavailable" })]),
          });
          expect(denied.report?.gate?.decision).toBe("indeterminate");
          expect(denied.report?.groups.some((group) => group.lifecycle === "resolved")).toBe(false);
          // Host retention does not replace raw check evidence or return name strings.
          expect(
            first.rules
              .filter((rule) => rule.state === "evaluated")
              .flatMap((rule) => rule.occurrences)
              .some((node) => node.evidence[0]?.kind === "naming-checks"),
          ).toBe(true);
          unwrap(await client.end({ ...meta(), sessionId: session.id }));
          expect(page.isClosed()).toBe(false);
        },
        { borrowed: new Map([["naming-fixture", page]]) },
      );
    } finally {
      await mkdir("artifacts/parity", { recursive: true });
      await writeFile(
        `artifacts/parity/${engine}-naming-host.json`,
        JSON.stringify(records, null, 2),
      );
      await context.close();
      await browser.close();
    }
  });
