import { expect, test, vi } from "vitest";
import { BrowserTarget, browserTypes } from "../../src/host/browser.js";
import { scanTarget } from "../../src/host/scan.js";
import { selectedRequest } from "../../src/analysis.js";
import {
  fixturePage,
  injectReference,
  referenceBundle,
  runReference,
  axeSemantic,
  propellrSemantic,
} from "../support/parity.js";
import { fixtures } from "../fixtures/slice.js";
const context = {
  policy: { id: "fixture", version: "1" },
  configuration: { id: "slice", version: "1" },
  origin: { kind: "direct" },
} as const;

test.each(["chromium", "firefox", "webkit"] as const)(
  "%s frame navigation invalidates generation and rebuilds aggregated results",
  async (engine) => {
    const browser = await browserTypes[engine].launch();
    const fixture = fixtures.find((fixture) => fixture.id === "frames")!;
    const own = await fixturePage(browser, fixture);
    const canonical = await fixturePage(browser, fixture);
    const target = new BrowserTarget(own.page, "borrowed");
    try {
      const old = selectedRequest({
        pageId: target.pageId,
        documentId: target.documentId,
        path: [],
      });
      await scanTarget(target, old, context, new AbortController().signal);
      for (const page of [own.page, canonical.page])
        await page.frames()[1]!.goto("http://slice.invalid/nested");
      expect(target.documentId).not.toBe(old.scope.include[0].documentId);
      await expect(scanTarget(target, old, context, new AbortController().signal)).rejects.toThrow(
        "document-changed",
      );
      await expect(
        scanTarget(
          target,
          old,
          context,
          new AbortController().signal,
          old.scope.include[0].documentId,
        ),
      ).rejects.toThrow("document-changed");
      await injectReference(canonical.page, await referenceBundle());
      const current = await scanTarget(
        target,
        selectedRequest(
          { pageId: target.pageId, documentId: target.documentId, path: [] },
          "incremental",
        ),
        context,
        new AbortController().signal,
      );
      expect(propellrSemantic(current)).toEqual(axeSemantic(await runReference(canonical.page)));
    } finally {
      await target.release();
      await own.context.close();
      await canonical.context.close();
      await browser.close();
    }
  },
);

test.each(["injection", "scan", "finish"] as const)(
  "%s context rejection after navigation preserves document-change classification",
  async (stage) => {
    const browser = await browserTypes.chromium.launch();
    const own = await fixturePage(browser, fixtures[0]!);
    const target = new BrowserTarget(own.page, "borrowed");
    const documentId = target.documentId;
    let rejected = false;
    const evaluateHandle = own.page.evaluateHandle.bind(own.page);
    const evaluate = own.page.evaluate.bind(own.page);
    const injection = vi.spyOn(own.page, "evaluateHandle").mockImplementation(async (...args) => {
      const handle = await evaluateHandle(...args);
      if (stage !== "injection") return handle;
      try {
        await own.page.goto("about:blank");
        await handle
          .evaluate(() => true)
          .catch((error) => {
            rejected = true;
            throw error;
          });
        return handle;
      } finally {
        await handle.dispose().catch(() => {});
      }
    });
    let calls = 0;
    const evaluation = vi.spyOn(own.page, "evaluate").mockImplementation(async (...args) => {
      if (++calls === (stage === "scan" ? 1 : stage === "finish" ? 2 : -1))
        await own.page.goto("about:blank");
      return evaluate(...args).catch((error) => {
        rejected = true;
        throw error;
      });
    });
    try {
      await expect(
        scanTarget(
          target,
          selectedRequest({ pageId: target.pageId, documentId, path: [] }),
          context,
          new AbortController().signal,
        ),
      ).rejects.toThrow("scan-document-changed");
      expect(rejected).toBe(true);
      expect(target.documentId).not.toBe(documentId);
    } finally {
      injection.mockRestore();
      evaluation.mockRestore();
      await target.release();
      await own.context.close();
      await browser.close();
    }
  },
);

test("cancelled and evaluator-error scans cannot return a successful empty result", async () => {
  const browser = await browserTypes.chromium.launch();
  const own = await fixturePage(
    browser,
    fixtures.find((fixture) => fixture.id === "inapplicable")!,
  );
  const target = new BrowserTarget(own.page, "borrowed");
  try {
    const request = selectedRequest({
      pageId: target.pageId,
      documentId: target.documentId,
      path: [],
    });
    const abort = new AbortController();
    abort.abort();
    const narrow = {
      ...request,
      scope: { ...request.scope, exclude: [request.scope.include[0]] },
    };
    for (const selection of [request, narrow]) {
      await expect(scanTarget(target, selection, context, abort.signal)).rejects.toThrow(
        "cancelled",
      );
      await expect(
        scanTarget(target, selection, context, new AbortController().signal, "old-document"),
      ).rejects.toThrow("document-changed");
    }
    await scanTarget(target, request, context, new AbortController().signal);
    await own.page.evaluate(
      "document.querySelector = () => { throw new Error('fixture evaluation error') }",
    );
    await expect(
      scanTarget(target, request, context, new AbortController().signal),
    ).rejects.toThrow("fixture evaluation error");
  } finally {
    await target.release();
    await own.context.close();
    await browser.close();
  }
});

test.each(["chromium", "firefox", "webkit"] as const)(
  "%s scan runtime ignores preexisting and replaced page globals",
  async (engine) => {
    const browser = await browserTypes[engine].launch();
    const own = await fixturePage(browser, fixtures[0]!);
    const target = new BrowserTarget(own.page, "borrowed");
    try {
      const request = selectedRequest({
        pageId: target.pageId,
        documentId: target.documentId,
        path: [],
      });
      await own.page.evaluate(
        "globalThis.PropellrBrowser = { scan: () => ({ rules: [], gaps: [] }), finish: () => true }",
      );
      const first = await scanTarget(target, request, context, new AbortController().signal);
      expect(propellrSemantic(first)).toContainEqual(
        expect.objectContaining({ rule: "button-name", outcome: "violation", target: "#empty" }),
      );
      await own.page.evaluate(
        "globalThis.PropellrBrowser = { scan: () => { throw new Error('page-owned analyzer') }, finish: () => false }",
      );
      const second = await scanTarget(target, request, context, new AbortController().signal);
      expect(second.coverage.state).toBe("complete");
      expect(propellrSemantic(second)).toEqual(propellrSemantic(first));
    } finally {
      await target.release();
      await own.context.close();
      await browser.close();
    }
  },
);

test.each(["mutation", "scroll", "new-shadow", "diagnostic-limit"] as const)(
  "actual %s during transfer yields stale coverage",
  async (change) => {
    const browser = await browserTypes.chromium.launch();
    const own = await fixturePage(browser, fixtures[0]!);
    const target = new BrowserTarget(own.page, "borrowed");
    if (change === "scroll") await own.page.evaluate("document.body.style.minHeight='2000px'");
    const evaluate = own.page.evaluate.bind(own.page);
    let calls = 0;
    // Interpose a real mutation between collection and finish, not a fabricated scan result.
    const spy = vi.spyOn(own.page, "evaluate").mockImplementation(async (...args) => {
      const result = await evaluate(...args);
      if (++calls === 1)
        await evaluate(
          change === "mutation" || change === "diagnostic-limit"
            ? "document.querySelector('#empty').textContent='Now named'"
            : change === "scroll"
              ? "scrollTo(0, 200)"
              : "document.querySelector('main').attachShadow({mode:'open'}).innerHTML='<button></button>'",
        );
      return result;
    });
    try {
      const request = selectedRequest({
        pageId: target.pageId,
        documentId: target.documentId,
        path: [],
      });
      const result = await scanTarget(
        target,
        change === "diagnostic-limit"
          ? {
              ...request,
              rules: {
                kind: "explicit",
                rules: [
                  { id: "unknown-first", options: {} },
                  ...Array.from({ length: 39 }, (_, index) => ({
                    id: `unknown-${index}`,
                    options: {},
                  })),
                ],
              },
            }
          : request,
        context,
        new AbortController().signal,
      );
      expect(result.coverage.state).toBe("stale");
      if (result.coverage.state === "stale") {
        expect(result.coverage.gaps[0]?.code).toBe("scan-stale");
        expect(result.coverage.gaps).toHaveLength(change === "diagnostic-limit" ? 32 : 1);
      }
    } finally {
      spy.mockRestore();
      await target.release();
      await own.context.close();
      await browser.close();
    }
  },
);
