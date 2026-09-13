import { randomUUID } from "node:crypto";
import { chromium, firefox, webkit } from "playwright";
import type { Browser, Frame, Page } from "playwright";
import type { Session } from "../contracts.js";
import { pageIdSchema } from "../validation.js";
import { DIALOG_HTML, FIXTURE_URL } from "./fixture.js";

export const browserTypes = { chromium, firefox, webkit };

export class BrowserCleanupError extends Error {
  constructor() {
    super("cleanup-incomplete: browser setup failed and cleanup could not be confirmed");
  }
}

// Borrowed Page registration is host-only. No endpoint comes from the wire.
export class BrowserTarget {
  readonly pageId = pageIdSchema.parse(`page_${randomUUID()}`);
  documentId = `document-${randomUUID()}`;
  scanEpoch = 0;
  private readonly navigated = (_frame: Frame) => {
    // Any frame navigation invalidates the aggregated document generation.
    this.documentId = `document-${randomUUID()}`;
    this.onNavigation();
  };
  private readonly lost = () => this.onLoss();
  onLoss: () => void = () => {};
  onNavigation: () => void = () => {};

  constructor(
    readonly page: Page,
    readonly ownership: Session["browser"]["ownership"],
    private readonly ownedBrowser?: Browser,
  ) {
    page.on("framenavigated", this.navigated);
    page.on("close", this.lost);
    page.on("crash", this.lost);
    page.context().browser()?.on("disconnected", this.lost);
  }

  async release(): Promise<void> {
    this.page.off("framenavigated", this.navigated);
    this.page.off("close", this.lost);
    this.page.off("crash", this.lost);
    this.page.context().browser()?.off("disconnected", this.lost);
    // Never close a borrowed Page, context, browser or customer connection.
    await this.ownedBrowser?.close();
  }
}

export async function launchTarget(name: keyof typeof browserTypes): Promise<BrowserTarget> {
  const browser = await browserTypes[name].launch({ headless: true });
  try {
    const context = await browser.newContext({ serviceWorkers: "block", acceptDownloads: false });
    await context.routeWebSocket("**/*", (socket) => socket.close());
    await context.route("**/*", async (route) => {
      if (route.request().url() === FIXTURE_URL && route.request().isNavigationRequest()) {
        await route.fulfill({ contentType: "text/html", body: DIALOG_HTML });
      } else await route.abort("blockedbyclient");
    });
    const page = await context.newPage();
    context.on("page", (extra) => {
      if (extra !== page) void extra.close().catch(() => {});
    });
    await page.goto(FIXTURE_URL);
    return new BrowserTarget(page, "owned", browser);
  } catch (error) {
    try {
      await browser.close();
    } catch {
      throw new BrowserCleanupError();
    }
    throw error;
  }
}
