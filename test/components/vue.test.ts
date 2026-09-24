import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { expect, test, vi } from "vitest";
import type { Browser, Page } from "playwright";
import type { EventDelivery, Operation, ScanRequest, Session } from "../../src/contracts.js";
import type { ComponentManifestInput } from "../../src/components/contracts.js";
import { browserTypes } from "../../src/host/browser.js";
import { FIXTURE_URL } from "../../src/host/fixture.js";
import { LOCAL_POLICY } from "../../src/host/runtime.js";
import type { HostOptions } from "../../src/host/runtime.js";
import { vuePage, vuePartner, vueStorefront } from "../fixtures/components/vue/manifest.js";
import { vueOracle } from "../fixtures/components/oracle.js";
import { expected, raw, summarize } from "../support/component-corpus.js";
import { meta, terminal, unwrap, withHost } from "../support/host.js";
import type { LocalClient } from "../../src/host/client.js";

const engines = ["chromium", "firefox", "webkit"] as const;
const storefront = { application: "storefront", build: "vue-1" } as const;
const partner = { application: "partner", build: "p7" } as const;
const bundle = readFile(new URL("../../dist/fixtures/vue/app.js", import.meta.url), "utf8");
const artifacts = new URL("../../artifacts/components/", import.meta.url);
type Scenario = Parameters<typeof vuePage>[0];

async function vueTarget(browser: Browser, scenario: Scenario) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const html = vuePage(scenario, await bundle);
  await context.route("**/*", (route) =>
    route.request().url() === FIXTURE_URL
      ? route.fulfill({ contentType: "text/html", body: html })
      : route.abort(),
  );
  const page = await context.newPage();
  await page.goto(FIXTURE_URL);
  return { context, page };
}
const hostOptions = (
  page: Page,
  manifests: readonly ComponentManifestInput[] = [vueStorefront, vuePartner],
  builds: readonly { application: string; build: string }[] = [storefront, partner],
  extra: HostOptions = {},
): HostOptions => ({
  borrowed: new Map([["vue", page]]),
  components: { manifests, builds: { vue: builds } },
  ...extra,
});
const openVue = async (client: LocalClient) =>
  unwrap(
    await client.open({
      ...meta(),
      policy: LOCAL_POLICY,
      target: { kind: "attached", targetId: "vue" },
    }),
  );
async function current(client: LocalClient, session: Session) {
  const document = unwrap(await client.inspect({ ...meta(), sessionId: session.id })).session
    .documents[0];
  if (!document) throw new Error("No live document");
  return document;
}
const scanOf = (
  document: Awaited<ReturnType<typeof current>>,
  rules: readonly [string, ...string[]],
): ScanRequest => ({
  mode: "full",
  scope: { include: [{ ...document, path: [] }], exclude: [] },
  rules: {
    kind: "explicit",
    rules: [{ id: rules[0], options: {} }, ...rules.slice(1).map((id) => ({ id, options: {} }))],
  },
});
async function analyze(
  client: LocalClient,
  session: Session,
  rules: readonly [string, ...string[]] = ["button-name", "image-alt"],
) {
  const scan = scanOf(await current(client, session), rules);
  const accepted = unwrap(
    await client.analyzeComponents({ ...meta(), sessionId: session.id, scan }),
  );
  return { accepted, scan, operation: await terminal(client, accepted) };
}
function completed(operation: Operation) {
  if (operation.kind !== "components" || operation.state !== "completed")
    throw new Error(`Expected completed component analysis: ${JSON.stringify(operation)}`);
  return operation.result;
}
function view(operation: Operation) {
  const { scan, enrichment } = completed(operation);
  if (enrichment.state !== "available") throw new Error(`Enrichment ${enrichment.state}`);
  return { scan, view: enrichment.view, enrichment };
}
async function archive(name: string, value: unknown) {
  await mkdir(artifacts, { recursive: true });
  await writeFile(new URL(name, artifacts), `${JSON.stringify(value, null, 2)}\n`);
}

for (const engine of engines)
  test(`${engine}: compiled Vue ownership matches the oracle through the SDK`, async () => {
    const browser = await browserTypes[engine].launch();
    const records: object[] = [];
    try {
      for (const scenario of ["grid", "controls"] as const) {
        const { context, page } = await vueTarget(browser, scenario);
        try {
          await withHost(async ({ client }) => {
            const session = await openVue(client);
            expect(session.capabilities).toContain("component-analysis@1");
            const events = unwrap(await client.subscribe({ ...meta(), sessionId: session.id }));
            const rules = scenario === "grid" ? (["button-name"] as const) : undefined;
            const { accepted, operation } = await analyze(client, session, rules);
            const result = view(operation);
            records.push({ scenario, operation });
            expect(summarize(result.scan, result.view), scenario).toEqual(
              expected(vueOracle[scenario]),
            );
            expect(result.enrichment).toMatchObject({
              scanId: result.scan.id,
              documentId: result.scan.scope.include[0].documentId,
              epoch: result.scan.epoch,
              generation: 1,
            });
            // Exact report and counts are those of the raw scan, independent of grouping.
            const counts = result.scan.report!.counts;
            expect(result.view.counts.violationOccurrences).toBe(counts.violationOccurrences);
            expect(result.view.counts.exactViolationIssues).toBe(counts.uniqueViolationIssues);
            if (scenario === "grid")
              expect(result.view.counts).toMatchObject({
                violationOccurrences: 80,
                exactViolationIssues: 80,
                supportedRepairScopes: 2,
              });
            // The same request through plain scan yields identical raw results.
            const direct = await terminal(
              client,
              unwrap(
                await client.scan({
                  ...meta(),
                  sessionId: session.id,
                  scan: scanOf(
                    await current(client, session),
                    rules ?? ["button-name", "image-alt"],
                  ),
                }),
              ),
            );
            if (direct.kind !== "scan" || direct.state !== "completed") throw new Error("scan");
            expect(raw(direct.result)).toEqual(raw(result.scan));
            // Raw results are delivered before the enriched completion.
            const order: string[] = [];
            for await (const delivery of events as AsyncIterable<EventDelivery>) {
              if (delivery.type !== "event") continue;
              const event = delivery.event;
              if (event.type === "raw-scan" && event.operationId === accepted.id)
                order.push("raw-scan");
              if (
                event.type === "operation" &&
                event.operation.id === accepted.id &&
                event.operation.state === "completed"
              ) {
                order.push("completed");
                break;
              }
            }
            expect(order).toEqual(["raw-scan", "completed"]);
            if (scenario === "controls") {
              // One fragment instance with two roots; teleported and slotted parts keep owners.
              const fragment = result.view.scopes.find(
                ({ definition }) => definition === "FragmentPair",
              );
              expect(new Set(fragment?.members.map(({ instance }) => instance)).size).toBe(1);
              // Source references and text stay out of the delivered view.
              expect(JSON.stringify(operation)).not.toContain(".vue");
              expect(JSON.stringify(operation)).not.toContain("Item 1");
            }
          }, hostOptions(page));
        } finally {
          await context.close();
        }
      }
    } finally {
      await archive(`${engine}-vue-oracle.json`, { records });
      await browser.close();
    }
  });

for (const engine of engines)
  test(`${engine}: missing, stale and drifted manifests never support Vue scopes`, async () => {
    const browser = await browserTypes[engine].launch();
    const { context, page } = await vueTarget(browser, "controls");
    const drifted: ComponentManifestInput = {
      ...vueStorefront,
      definitions: vueStorefront.definitions.map((definition) =>
        definition.id === "ProductCard"
          ? {
              ...definition,
              parts: definition.parts.filter(({ key }) => key !== "favorite-control"),
            }
          : definition,
      ),
    };
    const cases = [
      { name: "missing", manifests: [vuePartner], builds: [partner], reason: "unapproved-build" },
      {
        name: "stale",
        manifests: [{ ...vueStorefront, build: "vue-0" }, vuePartner],
        builds: [{ application: "storefront", build: "vue-0" }, partner],
        reason: "unapproved-build",
      },
      {
        name: "drifted",
        manifests: [drifted, vuePartner],
        builds: [storefront, partner],
        reason: "unknown-part",
      },
    ] as const;
    try {
      for (const entry of cases)
        await withHost(
          async ({ client }) => {
            const session = await openVue(client);
            const { view: repair, scan } = view((await analyze(client, session)).operation);
            const summary = summarize(scan, repair);
            const favorites = ["n1", "n3", "n5", "n7"];
            expect(
              summary.scopes.some(
                ({ application, part }) =>
                  application === "storefront" && part === "favorite-control",
              ),
              entry.name,
            ).toBe(false);
            for (const id of favorites)
              expect(summary.unattributed[id], `${entry.name}:${id}`).toBe("conflicting");
            const reasons = repair.unattributed.flatMap(({ reasons }) =>
              reasons.map(({ code }) => code),
            );
            expect(reasons, entry.name).toContain(
              entry.reason === "unapproved-build" ? "owner-conflicting" : "unknown-part",
            );
            // The independently approved partner application is unaffected.
            expect(
              summary.scopes.some(({ application }) => application === "partner"),
              entry.name,
            ).toBe(true);
          },
          hostOptions(page, entry.manifests, entry.builds),
        );
    } finally {
      await context.close();
      await browser.close();
    }
  });

for (const engine of engines)
  test(`${engine}: keyed rerender is re-observed, never reused`, async () => {
    const browser = await browserTypes[engine].launch();
    const { context, page } = await vueTarget(browser, "list");
    const owner = (id: string) =>
      page.evaluate<string | null>(
        `document.getElementById(${JSON.stringify(id)})?.getAttribute("data-propellr-owner") ?? null`,
      );
    try {
      await withHost(async ({ client }) => {
        const session = await openVue(client);
        const members = async () => {
          const {
            scan,
            view: repair,
            enrichment,
          } = view((await analyze(client, session, ["button-name"])).operation);
          return { summary: summarize(scan, repair), enrichment };
        };
        const first = await members();
        expect(first.summary.scopes[0]?.members).toEqual(["n1", "n3", "n5"]);
        const tokenA = await owner("n1");
        // Keyed reorder and removal: Vue keeps instance a; b disappears.
        await page.evaluate(() => {
          const fixture = (
            globalThis as unknown as {
              __propellrFixture: { setItems: (items: object[]) => void };
            }
          ).__propellrFixture;
          const item = (id: string, n: number) => ({
            id,
            name: `Item ${n}`,
            variant: "desktop",
            favoriteId: `n${n * 2 - 1}`,
            imageId: `n${n * 2}`,
            imageAlt: "Product photo",
          });
          fixture.setItems([item("c", 3), item("a", 1)]);
        });
        const reordered = await members();
        expect(reordered.summary.scopes[0]?.members).toEqual(["n1", "n5"]);
        expect(await owner("n1")).toBe(tokenA);
        // A new key renders a new instance at the same element ID: identity is fresh.
        await page.evaluate(() => {
          const fixture = (
            globalThis as unknown as {
              __propellrFixture: { setItems: (items: object[]) => void };
            }
          ).__propellrFixture;
          fixture.setItems([
            {
              id: "a2",
              name: "Item 1",
              variant: "desktop",
              favoriteId: "n1",
              imageId: "n2",
              imageAlt: "Photo",
            },
          ]);
        });
        const rekeyed = await members();
        expect(rekeyed.summary.scopes[0]?.members).toEqual(["n1"]);
        expect(await owner("n1")).not.toBe(tokenA);
        expect([first, reordered, rekeyed].map(({ enrichment }) => enrichment.generation)).toEqual([
          1, 2, 3,
        ]);
        expect(
          new Set([first, reordered, rekeyed].map(({ enrichment }) => enrichment.scanId)).size,
        ).toBe(3);
      }, hostOptions(page));
    } finally {
      await context.close();
      await browser.close();
    }
  });

for (const engine of engines)
  test(`${engine}: component analysis IPC keeps opt-in, failure, retention and cleanup explicit`, async () => {
    const browser = await browserTypes[engine].launch();
    const { context, page } = await vueTarget(browser, "controls");
    try {
      // Opt-in off: no capability and a clear rejection.
      await withHost(
        async ({ client }) => {
          const session = await openVue(client);
          expect(session.capabilities).not.toContain("component-analysis@1");
          const reply = await client.analyzeComponents({
            ...meta(),
            sessionId: session.id,
            scan: scanOf(await current(client, session), ["button-name"]),
          });
          expect(reply).toMatchObject({
            ok: false,
            diagnostic: { code: "capability-unavailable" },
          });
          await client.end({ ...meta(), sessionId: session.id });
        },
        { borrowed: new Map([["vue", page]]) },
      );

      await withHost(async ({ client, reconnect }) => {
        const session = await openVue(client);
        // Mutation during transfer stales the scan: no raw commit, no enrichment.
        const evaluate = page.evaluate.bind(page);
        let calls = 0;
        const spy = vi.spyOn(page, "evaluate").mockImplementation(async (...args) => {
          const result = await evaluate(...args);
          if (++calls === 1) await evaluate("document.body.setAttribute('data-touched', '1')");
          return result;
        });
        const stale = await analyze(client, session).finally(() => spy.mockRestore());
        expect(stale.operation).toMatchObject({
          kind: "components",
          state: "failed",
          diagnostics: [{ code: "scan-stale" }],
          completedScans: [],
        });

        // Cancellation while the browser call is held: cancelled, nothing committed.
        const release = Promise.withResolvers<void>();
        const hold = vi.spyOn(page, "evaluate").mockImplementation(async (...args) => {
          await release.promise;
          return evaluate(...args);
        });
        const pending = unwrap(
          await client.analyzeComponents({
            ...meta(),
            sessionId: session.id,
            scan: scanOf(await current(client, session), ["button-name"]),
          }),
        );
        const cancel = unwrap(
          await client.cancel({ ...meta(), sessionId: session.id, operationId: pending.id }),
        );
        expect(cancel.disposition).toBe("requested");
        release.resolve();
        const cancelled = await terminal(client, pending).finally(() => hold.mockRestore());
        expect(cancelled).toMatchObject({
          state: "cancelled",
          diagnostics: [{ code: "scan-cancelled" }],
        });

        // Reconnect: same lease/request returns the original acknowledgment, never a rerun.
        const input = {
          ...meta(),
          sessionId: session.id,
          scan: scanOf(await current(client, session), ["button-name"]),
        };
        const acknowledged = unwrap(await client.analyzeComponents(input));
        client.close();
        const next = await reconnect(client.lease);
        const finished = await terminal(next, acknowledged);
        expect(completed(finished).enrichment.state).toBe("available");
        expect(unwrap(await next.analyzeComponents(input)).id).toBe(acknowledged.id);

        // Eight available views retained; the oldest becomes an explicit eviction.
        const ids = [acknowledged.id];
        for (let index = 0; index < 8; index++)
          ids.push((await analyze(next, session, ["button-name"])).accepted.id);
        const states: string[] = [];
        for (const operationId of ids) {
          const inspected = unwrap(
            await next.inspect({ ...meta(), sessionId: session.id, operationId }),
          ).selectedOperation!;
          states.push(completed(inspected).enrichment.state);
        }
        expect(states).toEqual(["evicted", ...Array(8).fill("available")]);

        // Session end releases the borrowed page without closing it.
        await next.end({ ...meta(), sessionId: session.id });
        expect(page.isClosed()).toBe(false);
        const again = await openVue(next);
        expect(again.state).toBe("active");
        await next.end({ ...meta(), sessionId: again.id });
      }, hostOptions(page));

      // A view over budget is unavailable while the exact raw scan is still delivered.
      await withHost(
        async ({ client }) => {
          const session = await openVue(client);
          const { scan, enrichment } = completed((await analyze(client, session)).operation);
          expect(enrichment).toMatchObject({
            state: "unavailable",
            reason: { code: "component-result-limit" },
          });
          expect(scan.report?.counts.violationOccurrences).toBe(16);
          // Small event retention produces an explicit gap for an old cursor. Breaking the
          // iterator closes this connection by design; withHost ends the session.
          const deliveries = unwrap(
            await client.subscribe({ ...meta(), sessionId: session.id, after: `${session.id}.0` }),
          );
          for await (const delivery of deliveries) {
            expect(delivery.type).toBe("gap");
            break;
          }
        },
        hostOptions(page, undefined, undefined, {
          limits: { componentViewBytes: 1024, events: 4 },
        }),
      );

      // Page loss during analysis: the operation is lost, never completed.
      await withHost(async ({ client }) => {
        const session = await openVue(client);
        const evaluate = page.evaluate.bind(page);
        const close = vi.spyOn(page, "evaluate").mockImplementation(async (...args) => {
          await page.close();
          return evaluate(...args);
        });
        const { operation } = await analyze(client, session, ["button-name"]).finally(() =>
          close.mockRestore(),
        );
        expect(operation).toMatchObject({ kind: "components", state: "lost" });
      }, hostOptions(page));
    } finally {
      await context.close();
      await browser.close();
    }
  });

test("chromium: the 80-occurrence grid is analyzable through the CLI", async () => {
  const browser = await browserTypes.chromium.launch();
  const { context, page } = await vueTarget(browser, "grid");
  const cli = async (socket: string, request: object, lease?: string) => {
    const child = spawn(process.execPath, ["dist/host/cli.js", socket, ...(lease ? [lease] : [])], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    const output: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => output.push(chunk));
    const finished = once(child, "close");
    child.stdin.end(JSON.stringify(request));
    const [code] = await finished;
    return {
      code,
      value: JSON.parse(Buffer.concat(output).toString("utf8")) as {
        lease: string;
        reply: { ok: boolean; value: Operation };
      },
    };
  };
  try {
    await withHost(async ({ client, server }) => {
      const session = await openVue(client);
      const scan = scanOf(await current(client, session), ["button-name"]);
      const accepted = await cli(server.path, {
        command: "analyzeComponents",
        input: { ...meta(), sessionId: session.id, scan },
      });
      expect(accepted.code).toBe(0);
      const operation = await terminal(client, accepted.value.reply.value);
      const inspected = await cli(
        server.path,
        {
          command: "inspect",
          input: { ...meta(), sessionId: session.id, operationId: operation.id },
        },
        accepted.value.lease,
      );
      const selected = (inspected.value.reply.value as unknown as { selectedOperation: Operation })
        .selectedOperation;
      expect(view(selected).view.counts).toMatchObject({
        violationOccurrences: 80,
        exactViolationIssues: 80,
        supportedRepairScopes: 2,
        supportedOccurrences: 80,
      });
    }, hostOptions(page));
  } finally {
    await context.close();
    await browser.close();
  }
});
