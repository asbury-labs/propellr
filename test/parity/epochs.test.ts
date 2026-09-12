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
    await expect(scanTarget(target, request, context, abort.signal)).rejects.toThrow("cancelled");
    await scanTarget(target, request, context, new AbortController().signal);
    await own.page.evaluate(
      "PropellrBrowser.scan = () => { throw new Error('fixture evaluation error') }",
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

test("actual DOM mutation during transfer yields stale coverage", async () => {
  const browser = await browserTypes.chromium.launch();
  const own = await fixturePage(browser, fixtures[0]!);
  const target = new BrowserTarget(own.page, "borrowed");
  const evaluate = own.page.evaluate.bind(own.page);
  let calls = 0;
  // Interpose a real mutation between collection and finish, not a fabricated scan result.
  const spy = vi.spyOn(own.page, "evaluate").mockImplementation(async (...args) => {
    const result = await evaluate(...args);
    if (++calls === 2) await evaluate("document.querySelector('#empty').textContent='Now named'");
    return result;
  });
  try {
    const result = await scanTarget(
      target,
      selectedRequest({ pageId: target.pageId, documentId: target.documentId, path: [] }),
      context,
      new AbortController().signal,
    );
    expect(result.coverage).toMatchObject({ state: "stale", gaps: [{ code: "scan-stale" }] });
  } finally {
    spy.mockRestore();
    await target.release();
    await own.context.close();
    await browser.close();
  }
});
