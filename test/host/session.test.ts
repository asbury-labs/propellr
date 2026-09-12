import { randomUUID } from "node:crypto";
import { lstat } from "node:fs/promises";
import { dirname } from "node:path";
import { describe, expect, test, vi } from "vitest";
import { chromium } from "playwright";
import { DIALOG_HTML, FIXTURE_URL } from "../../src/host/fixture.js";
import { LOCAL_POLICY } from "../../src/host/runtime.js";
import { selectedRequest } from "../../src/analysis.js";
import * as scans from "../../src/host/scan.js";
import { sessionIdSchema } from "../../src/validation.js";
import { meta, playbookInput, terminal, unwrap, withHost } from "../support/host.js";

describe("local session host over real Unix IPC", () => {
  test("owned resources, reconnect, request deduplication/conflicts, and explicit default catalog gaps", async () => {
    await withHost(async ({ client, server, reconnect }) => {
      expect((await lstat(dirname(server.path))).mode & 0o777).toBe(0o700);
      expect((await lstat(server.path)).mode & 0o777).toBe(0o600);
      const input = {
        ...meta(),
        policy: LOCAL_POLICY,
        target: { kind: "managed", browser: "chromium" },
      } as const;
      const session = unwrap(await client.open(input));
      expect(session.browser.ownership).toBe("owned");
      client.close();
      const next = await reconnect(client.lease);
      expect(unwrap(await next.open(input)).id).toBe(session.id);
      expect(
        await next.open({ ...input, target: { kind: "managed", browser: "firefox" } }),
      ).toMatchObject({ ok: false, diagnostic: { code: "request-conflict" } });
      expect(unwrap(await next.inspect({ ...meta(), sessionId: session.id })).session.state).toBe(
        "active",
      );
      const document = session.documents![0]!;
      const scan = unwrap(
        await next.scan({
          ...meta(),
          sessionId: session.id,
          scan: {
            mode: "incremental",
            scope: { include: [{ ...document, path: [] }], exclude: [] },
            rules: { kind: "defaults" },
          },
        }),
      );
      expect(await terminal(next, scan)).toMatchObject({
        kind: "scan",
        state: "completed",
        result: {
          coverage: { state: "partial" },
          execution: {
            requested: "incremental",
            actual: "full",
            fallback: { code: "full-scan-fallback" },
          },
        },
      });
      const inspection = { ...meta(), sessionId: session.id, operationId: scan.id };
      unwrap(await next.inspect(inspection));
      expect(await next.inspect({ ...inspection, operationId: undefined })).toMatchObject({
        ok: false,
        diagnostic: { code: "request-conflict" },
      });
      unwrap(await next.cancel({ ...meta(), sessionId: session.id, operationId: scan.id }));
      for (const command of ["scan", "inspect", "cancel"]) {
        expect(server.host.audit).toContainEqual(
          expect.objectContaining({
            command,
            decision: "accepted",
            sessionId: session.id,
            operationId: scan.id,
          }),
        );
      }
      expect(server.host.audit).toContainEqual(
        expect.objectContaining({
          command: "inspect",
          decision: "request-conflict",
          sessionId: session.id,
        }),
      );
      expect(unwrap(await next.end({ ...meta(), sessionId: session.id })).state).toBe("ended");
      expect(await next.runPlaybook(playbookInput(session))).toMatchObject({ ok: false });
    });
  });

  test.each(["scan", "playbook", "scan-url-change", "playbook-url-change"] as const)(
    "%s interruption after collection cannot commit its scan",
    async (kind) => {
      await withHost(async ({ client, server, open }) => {
        const session = await open();
        const scanTarget = scans.scanTarget;
        // Keep real browser evaluation; interpose interruption at the host commit boundary.
        const spy = vi.spyOn(scans, "scanTarget").mockImplementationOnce(async (...args) => {
          const result = await scanTarget(...args);
          if (!("kind" in operation)) throw new Error("Expected operation");
          if (kind.endsWith("url-change")) {
            const before = args[0].documentId;
            await args[0].page.evaluate("history.pushState({}, '', '#changed')");
            expect(args[0].documentId).not.toBe(before);
          } else
            expect(
              unwrap(
                await server.host.execute(
                  JSON.stringify({
                    command: "cancel",
                    input: { ...meta(), sessionId: session.id, operationId: operation.id },
                  }),
                ),
              ),
            ).toMatchObject({ disposition: "requested", operation: { state: "cancelling" } });
          return result;
        });
        const operation = unwrap(
          await server.host.execute(
            JSON.stringify(
              kind === "scan" || kind === "scan-url-change"
                ? {
                    command: "scan",
                    input: {
                      ...meta(),
                      sessionId: session.id,
                      scan: selectedRequest({ ...session.documents[0]!, path: [] }),
                    },
                  }
                : { command: "runPlaybook", input: playbookInput(session) },
            ),
          ),
        );
        try {
          if (!("kind" in operation)) throw new Error("Expected operation");
          expect(await terminal(client, operation)).toMatchObject({
            state: kind.endsWith("url-change") ? "failed" : "cancelled",
            ...(kind.endsWith("url-change")
              ? {
                  diagnostics: expect.arrayContaining([
                    expect.objectContaining({ code: "scan-document-changed" }),
                  ]),
                }
              : {}),
            completedScans: [],
          });
          expect(spy).toHaveBeenCalledOnce();
        } finally {
          spy.mockRestore();
        }
      });
    },
  );

  test("large retained reports stay within IPC limits without breaking the connection", async () => {
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.route(FIXTURE_URL, (route) =>
        route.fulfill({ contentType: "text/html", body: DIALOG_HTML }),
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
          const run = async (prefix: string, count: number, length: number) => {
            const html = `<main>${Array.from({ length: count }, (_, index) => `<button id="${prefix}-${index}-${"x".repeat(length)}"></button>`).join("")}</main>`;
            await page.evaluate(`document.body.innerHTML = ${JSON.stringify(html)}`);
            return terminal(
              client,
              unwrap(
                await client.scan({
                  ...meta(),
                  sessionId: session.id,
                  scan: {
                    ...selectedRequest({ ...session.documents[0]!, path: [] }),
                    rules: { kind: "explicit", rules: [{ id: "button-name", options: {} }] },
                  },
                }),
              ),
            );
          };
          let omitted = false;
          for (let index = 0; index < 4; index++) {
            const result = await run(`epoch-${index}`, 72, 500);
            if (result.kind !== "scan" || result.state !== "completed")
              throw new Error("Expected bounded scan result");
            expect(Buffer.byteLength(JSON.stringify(result.result))).toBeLessThanOrEqual(
              192 * 1024,
            );
            expect(result.result.report?.counts.violationOccurrences).toBe(72);
            const comparison = result.result.report?.comparison;
            omitted ||=
              comparison?.state === "not-comparable" &&
              comparison.reason.code === "report-history-limit";
          }
          expect(omitted).toBe(true);
          expect(await run("oversized-current", 85, 850)).toMatchObject({
            state: "failed",
            diagnostics: [{ code: "scan-result-limit" }],
            completedScans: [],
          });
          expect(
            unwrap(await client.inspect({ ...meta(), sessionId: session.id })).session.state,
          ).toBe("active");
        },
        { borrowed: new Map([["fixture", page]]) },
      );
    } finally {
      await browser.close();
    }
  });

  test("lease loss and bounded replay fail closed, including after reconnect", async () => {
    await withHost(
      async ({ client, reconnect }) => {
        await expect(reconnect(randomUUID())).rejects.toThrow("lease-lost");
        const input = { ...meta(), sessionId: sessionIdSchema.parse("session_missing") };
        expect(await client.inspect(input)).toMatchObject({
          ok: false,
          diagnostic: { code: "permission-denied" },
        });
        expect(await client.inspect({ ...input, ...meta() })).toMatchObject({
          ok: false,
          diagnostic: { code: "replay-limit" },
        });
        client.close();
        const next = await reconnect(client.lease);
        expect(await next.inspect(input)).toMatchObject({
          ok: false,
          diagnostic: { code: "permission-denied" },
        });
        expect(await next.inspect({ ...input, ...meta() })).toMatchObject({
          ok: false,
          diagnostic: { code: "replay-limit" },
        });
        await expect(reconnect()).rejects.toThrow("lease-limit");
      },
      {},
      { maxRequests: 1, maxLeases: 1 },
    );
  });

  test("session and operation/event retention expose limits and session-scoped replay gaps", async () => {
    await withHost(
      async ({ client, open }) => {
        const session = await open();
        expect(
          await client.open({
            ...meta(),
            policy: LOCAL_POLICY,
            target: { kind: "managed", browser: "chromium" },
          }),
        ).toMatchObject({ ok: false, diagnostic: { code: "session-limit" } });
        const first = unwrap(await client.runPlaybook(playbookInput(session)));
        await terminal(client, first);
        const second = unwrap(await client.runPlaybook(playbookInput(session)));
        await terminal(client, second);
        expect(
          await client.inspect({ ...meta(), sessionId: session.id, operationId: first.id }),
        ).toMatchObject({ ok: false, diagnostic: { code: "operation-not-retained" } });
        expect(
          await client.subscribe({ ...meta(), sessionId: session.id, after: "session_other.0" }),
        ).toMatchObject({ ok: false, diagnostic: { code: "invalid-cursor" } });
        // Failed subscriptions do not reserve this connection's stream slot.
      },
      { limits: { sessions: 1, operations: 1, events: 3 } },
    );
    await withHost(
      async ({ client, open, reconnect }) => {
        const session = await open();
        await terminal(client, unwrap(await client.runPlaybook(playbookInput(session))));
        const subscriber = await reconnect();
        const events = unwrap(
          await subscriber.subscribe({
            ...meta(),
            sessionId: session.id,
            after: `${session.id}.0`,
          }),
        )[Symbol.asyncIterator]();
        expect((await events.next()).value).toMatchObject({
          type: "gap",
          sessionId: session.id,
          reason: { code: "event-retention-gap" },
        });
        const delivery = (await events.next()).value;
        expect(delivery).toMatchObject({ type: "event", event: { sessionId: session.id } });
        await events.return?.();
      },
      { limits: { events: 3 } },
    );
  });

  test("host-owned permissions and redacted audit reject secrets and unknown sessions", async () => {
    await withHost(
      async ({ client, open, server }) => {
        expect(
          await client.open({
            ...meta(),
            policy: { id: "self-granted", version: "1" },
            target: { kind: "managed", browser: "chromium" },
          }),
        ).toMatchObject({ ok: false, diagnostic: { code: "permission-denied" } });
        expect(
          await client.open({
            ...meta(),
            policy: LOCAL_POLICY,
            target: { kind: "attached", targetId: "ws:unauthorized" },
          }),
        ).toMatchObject({ ok: false, diagnostic: { code: "permission-denied" } });
        const session = await open();
        const input = playbookInput(session);
        expect(await client.runPlaybook(input)).toMatchObject({
          ok: false,
          diagnostic: { code: "permission-denied" },
        });
        expect(
          await client.runPlaybook({
            ...input,
            ...meta(),
            secretRefs: { password: "private-secret" },
          }),
        ).toMatchObject({ ok: false, diagnostic: { code: "permission-denied" } });
        expect(
          await client.inspect({ ...meta(), sessionId: sessionIdSchema.parse("session_unknown") }),
        ).toMatchObject({ ok: false, diagnostic: { code: "permission-denied" } });
        expect(JSON.stringify(server.host.audit)).not.toMatch(
          /private-secret|self-granted|ws:unauthorized/,
        );
        expect(server.host.audit.some((entry) => entry.decision === "permission-denied")).toBe(
          true,
        );
      },
      { actions: ["dialog.open"] },
    );
  });

  test("borrowed target is exclusive, cancellation confirms cleanup, detach preserves browser", async () => {
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.route(FIXTURE_URL, (route) =>
        route.fulfill({ contentType: "text/html", body: DIALOG_HTML }),
      );
      await page.goto(FIXTURE_URL);
      await page.evaluate("document.querySelector('#close').disabled = true");
      await withHost(
        async ({ client, reconnect }) => {
          const session = unwrap(
            await client.open({
              ...meta(),
              policy: LOCAL_POLICY,
              target: { kind: "attached", targetId: "fixture" },
            }),
          );
          expect(session.browser.ownership).toBe("borrowed");
          expect(
            await client.open({
              ...meta(),
              policy: LOCAL_POLICY,
              target: { kind: "attached", targetId: "fixture" },
            }),
          ).toMatchObject({ ok: false, diagnostic: { code: "target-unavailable" } });
          const operation = unwrap(await client.runPlaybook(playbookInput(session, 500)));
          expect(await client.runPlaybook(playbookInput(session))).toMatchObject({
            ok: false,
            diagnostic: { code: "operation-conflict" },
          });
          client.close();
          const next = await reconnect(client.lease);
          await page.locator("#dialog").waitFor({ state: "visible" });
          const observer = await reconnect(client.lease);
          const events = unwrap(await observer.subscribe({ ...meta(), sessionId: session.id }));
          for await (const delivery of events) {
            if (
              delivery.type === "event" &&
              delivery.event.type === "checkpoint" &&
              delivery.event.checkpoint.id === "opened"
            ) {
              expect(delivery.event.checkpoint.state).toBe("reached");
              break;
            }
          }
          const cancelling = unwrap(
            await next.cancel({ ...meta(), sessionId: session.id, operationId: operation.id }),
          );
          expect(cancelling).toMatchObject({
            disposition: "requested",
            operation: { state: "cancelling" },
          });
          await page.evaluate("document.querySelector('#close').disabled = false");
          expect(await terminal(next, operation)).toMatchObject({
            state: "cancelled",
            completedScans: [
              expect.objectContaining({
                origin: {
                  kind: "playbook",
                  playbook: { id: "dialog-open-close", version: "1" },
                  checkpointId: "opened",
                },
              }),
            ],
            cleanup: "complete",
            sideEffects: "confirmed",
          });
          expect(
            unwrap(
              await next.cancel({ ...meta(), sessionId: session.id, operationId: operation.id }),
            ).disposition,
          ).toBe("already-terminal");
          expect(unwrap(await next.end({ ...meta(), sessionId: session.id })).state).toBe("ended");
          expect(browser.isConnected()).toBe(true);
          expect(page.isClosed()).toBe(false);
          expect(await page.title()).toBe("Dialog fixture");
        },
        { borrowed: new Map([["fixture", page]]) },
      );
    } finally {
      await browser.close();
    }
  });

  test("disconnected journey continues; sessions keep documents and operations separate", async () => {
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.route(FIXTURE_URL, (route) =>
        route.fulfill({ contentType: "text/html", body: DIALOG_HTML }),
      );
      await page.goto(FIXTURE_URL);
      await page.evaluate("document.querySelector('#close').disabled = true");
      await withHost(
        async ({ client, open, reconnect }) => {
          const borrowed = unwrap(
            await client.open({
              ...meta(),
              policy: LOCAL_POLICY,
              target: { kind: "attached", targetId: "fixture" },
            }),
          );
          const other = await open();
          const input = playbookInput(borrowed, 2000);
          const operation = unwrap(await client.runPlaybook(input));
          await page.locator("#dialog").waitFor({ state: "visible" });
          client.close();
          await page.evaluate("document.querySelector('#close').disabled = false");
          const next = await reconnect(client.lease);
          expect(await terminal(next, operation)).toMatchObject({ state: "completed" });
          expect(unwrap(await next.runPlaybook(input)).id).toBe(operation.id);
          expect(await page.locator("#dialog").isVisible()).toBe(false);
          expect(
            await next.inspect({ ...meta(), sessionId: other.id, operationId: operation.id }),
          ).toMatchObject({ ok: false, diagnostic: { code: "permission-denied" } });
          expect(
            await next.cancel({ ...meta(), sessionId: other.id, operationId: operation.id }),
          ).toMatchObject({ ok: false, diagnostic: { code: "permission-denied" } });
          expect(
            await next.runPlaybook({ ...playbookInput(other), bindings: input.bindings }),
          ).toMatchObject({ ok: false, diagnostic: { code: "permission-denied" } });
          expect(
            await terminal(next, unwrap(await next.runPlaybook(playbookInput(other)))),
          ).toMatchObject({ state: "completed" });
          const ended = await Promise.all([
            next.end({ ...meta(), sessionId: borrowed.id }),
            next.end({ ...meta(), sessionId: borrowed.id }),
          ]);
          expect(ended.every((reply) => reply.ok && reply.value.state === "ended")).toBe(true);
          expect(unwrap(await next.inspect({ ...meta(), sessionId: other.id })).session.state).toBe(
            "active",
          );
        },
        { borrowed: new Map([["fixture", page]]) },
      );
    } finally {
      await browser.close();
    }
  });

  test("loss before deferred startup still finalizes the operation and revokes document grants", async () => {
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.route(FIXTURE_URL, (route) =>
        route.fulfill({ contentType: "text/html", body: DIALOG_HTML }),
      );
      await page.goto(FIXTURE_URL);
      await withHost(
        async ({ client, server }) => {
          const session = unwrap(
            await client.open({
              ...meta(),
              policy: LOCAL_POLICY,
              target: { kind: "attached", targetId: "fixture" },
            }),
          );
          const input = playbookInput(session);
          // Direct admission queues synchronously. Inject loss before yielding to setImmediate.
          const pending = server.host.execute(JSON.stringify({ command: "runPlaybook", input }));
          const ending = server.host.execute(
            JSON.stringify({ command: "end", input: { ...meta(), sessionId: session.id } }),
          );
          if (!("emit" in page) || typeof page.emit !== "function")
            throw new Error("Expected Playwright event emitter for fault injection");
          page.emit("crash", page);
          const operation = unwrap(await pending);
          expect(unwrap(await ending)).toMatchObject({
            state: "ended",
            diagnostics: [{ code: "browser-lost" }],
          });
          if (!("kind" in operation)) throw new Error("Expected operation");
          expect(server.host.audit).toContainEqual(
            expect.objectContaining({
              command: "runPlaybook",
              decision: "accepted",
              sessionId: session.id,
              operationId: operation.id,
            }),
          );
          expect(await terminal(client, operation)).toMatchObject({ state: "lost" });
          expect(await client.runPlaybook({ ...input, ...meta() })).toMatchObject({
            ok: false,
            diagnostic: { code: "permission-denied" },
          });
          // A later navigation must not restore grants to a lost session.
          await page.goto(FIXTURE_URL);
          expect(
            unwrap(await client.inspect({ ...meta(), sessionId: session.id })).session.documents,
          ).toEqual([]);
          expect(unwrap(await client.end({ ...meta(), sessionId: session.id })).state).toBe(
            "ended",
          );
          expect(await terminal(client, operation)).toMatchObject({ state: "lost" });
        },
        { borrowed: new Map([["fixture", page]]) },
      );
    } finally {
      await browser.close();
    }
  });

  test("browser loss marks pending operation lost, never successful or replayed", async () => {
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.route(FIXTURE_URL, (route) =>
        route.fulfill({ contentType: "text/html", body: DIALOG_HTML }),
      );
      await page.goto(FIXTURE_URL);
      await page.evaluate("document.querySelector('#close').disabled = true");
      await withHost(
        async ({ client, reconnect }) => {
          const session = unwrap(
            await client.open({
              ...meta(),
              policy: LOCAL_POLICY,
              target: { kind: "attached", targetId: "fixture" },
            }),
          );
          const operation = unwrap(await client.runPlaybook(playbookInput(session)));
          const deliveries = unwrap(await client.subscribe({ ...meta(), sessionId: session.id }));
          for await (const delivery of deliveries) {
            if (delivery.type === "event" && delivery.event.type === "checkpoint") break;
          }
          await browser.close();
          const next = await reconnect(client.lease);
          expect(await terminal(next, operation)).toMatchObject({
            state: "lost",
            sideEffects: "uncertain",
            cleanup: "incomplete",
            checkpoints: [{ id: "opened", observed: { dialogVisible: true } }],
          });
          expect(
            unwrap(await next.inspect({ ...meta(), sessionId: session.id })).session.state,
          ).toBe("lost");
          await next.end({ ...meta(), sessionId: session.id });
          expect(await terminal(next, operation)).toMatchObject({
            state: "lost",
            cleanup: "incomplete",
          });
        },
        { borrowed: new Map([["fixture", page]]) },
      );
    } finally {
      await browser.close();
    }
  });
});
