import { describe, expect, test, vi } from "vitest";
import { chromium } from "playwright";
import { browserTypes, launchTarget } from "../../src/host/browser.js";
import { runDialog } from "../../src/host/playbook.js";
import { scanTarget } from "../../src/host/scan.js";
import { selectedRequest } from "../../src/analysis.js";
import { DIALOG_HTML, FIXTURE_URL } from "../../src/host/fixture.js";
import { LOCAL_POLICY } from "../../src/host/runtime.js";
import { meta, playbookInput, terminal, unwrap, withHost } from "../support/host.js";

test.each(["visible", "hidden"] as const)(
  "cancellation after a confirmed %s observation preserves its checkpoint",
  async (state) => {
    const target = await launchTarget("chromium");
    const abort = new AbortController();
    const locate = target.page.locator.bind(target.page);
    const spy = vi.spyOn(target.page, "locator").mockImplementation((selector, options) => {
      const locator = locate(selector, options);
      if (selector === "#dialog") {
        const wait = locator.waitFor.bind(locator);
        locator.waitFor = async (options) => {
          await wait(options); // Real browser observation; cancel exactly before the caller resumes.
          if (options?.state === state) abort.abort();
        };
      }
      return locator;
    });
    try {
      const execution = await runDialog(
        target,
        { timeoutMs: 1000 },
        target.documentId,
        abort.signal,
        () => true,
        () => {},
        (checkpointId) =>
          scanTarget(
            target,
            selectedRequest({ pageId: target.pageId, documentId: target.documentId, path: [] }),
            {
              policy: LOCAL_POLICY,
              configuration: { id: "test", version: "1" },
              origin: {
                kind: "playbook",
                playbook: { id: "dialog-open-close", version: "1" },
                checkpointId,
              },
            },
            abort.signal,
          ),
      );
      expect(execution.cancelled).toBe(true);
      expect(
        execution.result.checkpoints.find(
          (checkpoint) => checkpoint.id === (state === "visible" ? "opened" : "closed"),
        ),
      ).toMatchObject({ state: "blocked", observed: { dialogVisible: state === "visible" } });
      expect(execution.result.cleanup).toBe("complete");
      expect(await target.page.locator("#dialog").isVisible()).toBe(false);
    } finally {
      spy.mockRestore();
      await target.release();
    }
  },
);

test.each(["navigation", "cancellation"] as const)(
  "%s after a completed scan is checked before checkpoint emission",
  async (change) => {
    const target = await launchTarget("chromium");
    const abort = new AbortController();
    try {
      await target.page.evaluate(
        "new Promise(resolve => { const frame = document.createElement('iframe'); frame.onload = resolve; document.querySelector('#dialog').append(frame); })",
      );
      const documentId = target.documentId;
      const execution = await runDialog(
        target,
        { timeoutMs: 1000 },
        documentId,
        abort.signal,
        () => true,
        () => {},
        async (checkpointId) => {
          const result = await scanTarget(
            target,
            selectedRequest({ pageId: target.pageId, documentId, path: [] }),
            {
              policy: LOCAL_POLICY,
              configuration: { id: "test", version: "1" },
              origin: {
                kind: "playbook",
                playbook: { id: "dialog-open-close", version: "1" },
                checkpointId,
              },
            },
            abort.signal,
          );
          if (change === "navigation") await target.page.frames()[1]!.goto("about:blank#changed");
          else abort.abort();
          return result;
        },
      );
      expect(execution.result.checkpoints[0]).toMatchObject({
        id: "opened",
        state: change === "navigation" ? "blocked" : "reached",
      });
      if (change === "navigation") {
        expect(target.documentId).not.toBe(documentId);
        expect(execution.failed).toBe(true);
      } else expect(execution.cancelled).toBe(true);
    } finally {
      await target.release();
    }
  },
);

for (const engine of ["chromium", "firefox", "webkit"] as const) {
  describe(engine, () => {
    test("actual dialog checkpoint scans, input record and event correlation", async () => {
      await withHost(async ({ client, open, reconnect }) => {
        const session = await open(engine);
        const subscriber = await reconnect();
        const events = unwrap(await subscriber.subscribe({ ...meta(), sessionId: session.id }))[
          Symbol.asyncIterator
        ]();
        const input = playbookInput(session, 2000);
        const operation = unwrap(await client.runPlaybook(input));
        // Repeating the accepted request cannot re-open the dialog.
        expect(unwrap(await client.runPlaybook(input)).id).toBe(operation.id);
        const finished = await terminal(client, operation);
        expect(finished, JSON.stringify(finished)).toMatchObject({
          kind: "playbook",
          state: "completed",
          invocation: { playbook: input.playbook, inputs: { timeoutMs: 2000 } },
          result: {
            coverage: { state: "complete" },
            cleanup: "complete",
            checkpoints: [
              {
                id: "opened",
                state: "reached",
                scans: [
                  expect.objectContaining({
                    origin: { kind: "playbook", playbook: input.playbook, checkpointId: "opened" },
                  }),
                ],
                observed: { dialogVisible: true },
              },
              {
                id: "closed",
                state: "reached",
                scans: [
                  expect.objectContaining({
                    origin: { kind: "playbook", playbook: input.playbook, checkpointId: "closed" },
                  }),
                ],
                observed: { dialogVisible: false, focusReturned: true },
              },
            ],
          },
        });
        const checkpoints = [];
        const cursors: string[] = [];
        for (let count = 0; count < 8; count++) {
          const delivery = (await events.next()).value;
          if (delivery?.type !== "event") throw new Error("Expected event");
          expect(delivery.event.sessionId).toBe(session.id);
          cursors.push(delivery.event.cursor);
          if (delivery.event.type === "checkpoint") {
            expect(delivery.event.operationId).toBe(operation.id);
            expect(delivery.event.playbook).toEqual(input.playbook);
            checkpoints.push(delivery.event.checkpoint.id);
          }
          if (delivery.event.type === "operation" && delivery.event.operation.state === "completed")
            break;
        }
        expect(checkpoints).toEqual(["opened", "closed"]);
        expect(new Set(cursors).size).toBe(cursors.length);
        await events.return?.();
      });
    });

    test("blocked fixture prerequisite creates explicit journey gaps without side effects", async () => {
      const browser = await browserTypes[engine].launch();
      try {
        const page = await browser.newPage();
        await page.route(FIXTURE_URL, (route) =>
          route.fulfill({
            contentType: "text/html",
            body: "<!doctype html><title>Wrong fixture</title>",
          }),
        );
        await page.goto(FIXTURE_URL);
        await withHost(
          async ({ client }) => {
            const session = unwrap(
              await client.open({
                ...meta(),
                policy: LOCAL_POLICY,
                target: { kind: "attached", targetId: "fixture" },
              }),
            );
            const result = await terminal(
              client,
              unwrap(await client.runPlaybook(playbookInput(session))),
            );
            expect(result).toMatchObject({
              state: "failed",
              sideEffects: "none",
              cleanup: "not-required",
              completedScans: [],
              checkpoints: [
                { id: "opened", state: "skipped" },
                { id: "closed", state: "skipped" },
              ],
            });
            expect(await page.title()).toBe("Wrong fixture");
          },
          { borrowed: new Map([["fixture", page]]) },
        );
      } finally {
        await browser.close();
      }
    });
  });
}

test("failed close preserves reached observation and reports incomplete cleanup", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const broken = DIALOG_HTML.replace(
      'id="close" type="button"',
      'id="close" type="button" disabled',
    );
    await page.route(FIXTURE_URL, (route) =>
      route.fulfill({ contentType: "text/html", body: broken }),
    );
    await page.goto(FIXTURE_URL);
    await withHost(
      async ({ client }) => {
        const session = unwrap(
          await client.open({
            ...meta(),
            policy: LOCAL_POLICY,
            target: { kind: "attached", targetId: "fixture" },
          }),
        );
        const result = await terminal(
          client,
          unwrap(await client.runPlaybook(playbookInput(session, 150))),
        );
        expect(result).toMatchObject({
          state: "failed",
          sideEffects: "uncertain",
          cleanup: "incomplete",
          checkpoints: [
            { id: "opened", state: "reached", observed: { dialogVisible: true } },
            { id: "closed", state: "skipped" },
          ],
        });
        expect(
          "diagnostics" in result &&
            result.diagnostics.some((diagnostic) => diagnostic.code === "cleanup-incomplete"),
        ).toBe(true);
        expect(await page.locator("#dialog").isVisible()).toBe(true);
      },
      { borrowed: new Map([["fixture", page]]) },
    );
    expect(page.isClosed()).toBe(false);
  } finally {
    await browser.close();
  }
});

test("navigation invalidates bindings and prevents stale checkpoints", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const navigating = DIALOG_HTML.replace("dialog.showModal()", "location.href = 'about:blank'");
    await page.route(FIXTURE_URL, (route) =>
      route.fulfill({ contentType: "text/html", body: navigating }),
    );
    await page.goto(FIXTURE_URL);
    await withHost(
      async ({ client }) => {
        const session = unwrap(
          await client.open({
            ...meta(),
            policy: LOCAL_POLICY,
            target: { kind: "attached", targetId: "fixture" },
          }),
        );
        const result = await terminal(
          client,
          unwrap(await client.runPlaybook(playbookInput(session, 150))),
        );
        expect(result).toMatchObject({
          state: "failed",
          cleanup: "incomplete",
          checkpoints: [{ state: "skipped" }, { state: "skipped" }],
        });
        const current = unwrap(await client.inspect({ ...meta(), sessionId: session.id })).session;
        expect(current.documents?.[0]?.documentId).not.toBe(session.documents?.[0]?.documentId);
        expect(await client.runPlaybook(playbookInput(session))).toMatchObject({
          ok: false,
          diagnostic: { code: "permission-denied" },
        });
        expect(
          await terminal(client, unwrap(await client.runPlaybook(playbookInput(current)))),
        ).toMatchObject({ state: "failed", sideEffects: "none" });
      },
      { borrowed: new Map([["fixture", page]]) },
    );
  } finally {
    await browser.close();
  }
});

test("trusted manifest validation rejects dynamic code, bindings, unknown inputs and versions", async () => {
  await withHost(async ({ client, open }) => {
    const session = await open();
    const input = playbookInput(session);
    for (const inputs of [
      { timeoutMs: 0 },
      { source: "secret arbitrary code" },
      { timeoutMs: 100, password: "secret-value" },
    ]) {
      expect(await client.runPlaybook({ ...input, ...meta(), inputs })).toMatchObject({
        ok: false,
        diagnostic: { code: "invalid-playbook-input" },
      });
    }
    expect(await client.runPlaybook({ ...input, ...meta(), bindings: {} })).toMatchObject({
      ok: false,
      diagnostic: { code: "invalid-playbook-input" },
    });
    expect(
      await client.runPlaybook({
        ...input,
        ...meta(),
        playbook: { id: "dialog-open-close", version: "2" },
      }),
    ).toMatchObject({ ok: false, diagnostic: { code: "permission-denied" } });
  });
});
