import { z } from "zod";
import type {
  Checkpoint,
  Diagnostic,
  JsonObject,
  PlaybookManifest,
  PlaybookResult,
  ScanResult,
} from "../contracts.js";
import type { BrowserTarget } from "./browser.js";
import { FIXTURE_URL } from "./fixture.js";

export const dialogInputs = z.strictObject({
  timeoutMs: z.number().int().min(100).max(10_000).default(2_000),
});
export const dialogVersion = { id: "dialog-open-close", version: "1" } as const;
export const dialogManifest: PlaybookManifest = {
  playbook: dialogVersion,
  inputSchema: z.record(z.string(), z.json()).parse(z.toJSONSchema(dialogInputs)),
  prerequisites: [
    "Configured local fixture; closed dialog; visible opener; current document binding",
  ],
  permissions: { origins: [new URL(FIXTURE_URL).origin], actions: ["dialog.open", "dialog.close"] },
  checkpoints: [
    { id: "opened", expectedBehavior: "Dialog visible after opening" },
    { id: "closed", expectedBehavior: "Dialog hidden; focus returned to opener" },
  ],
};
export const scanInterrupted: Diagnostic = {
  code: "scan-interrupted",
  message: "Checkpoint observed but scan could not complete",
};

export interface PlaybookExecution {
  readonly result: PlaybookResult;
  readonly cancelled: boolean;
  readonly failed: boolean;
  readonly sideEffects: "none" | "confirmed" | "uncertain";
}

// Only fixed, reviewed actions. Cancellation waits for bounded in-flight actions and cleanup.
export async function runDialog(
  target: BrowserTarget,
  inputs: z.infer<typeof dialogInputs>,
  documentId: string,
  signal: AbortSignal,
  authorize: () => boolean,
  emit: (checkpoint: Checkpoint) => void,
  scan: (checkpointId: string) => Promise<ScanResult>,
): Promise<PlaybookExecution> {
  const { page } = target;
  const checkpoints: Checkpoint[] = [];
  const diagnostics: Diagnostic[] = [];
  let sideEffects: PlaybookExecution["sideEffects"] = "none";
  let failed = false;
  let cleanup: PlaybookResult["cleanup"] = "not-required";
  const options = { timeout: inputs.timeoutMs };
  let opener: Awaited<ReturnType<typeof page.$>> = null;
  let closer: Awaited<ReturnType<typeof page.$>> = null;
  const current = () =>
    !page.isClosed() &&
    target.documentId === documentId &&
    page.url() === FIXTURE_URL &&
    authorize();
  const guard = () => {
    if (signal.aborted || !current()) throw new Error("interrupted");
  };
  const cleanUp = async () => {
    if (!current()) return false;
    if (await page.locator("#dialog").isVisible()) {
      if (!closer) return false;
      await closer.click(options);
    }
    return current() && !(await page.locator("#dialog").isVisible());
  };
  const record = (checkpoint: Checkpoint) => {
    checkpoints.push(checkpoint);
    emit(checkpoint);
  };
  const checkpoint = async (id: string, observed: JsonObject) => {
    if (signal.aborted) {
      record({ id, observed, state: "blocked", reason: scanInterrupted });
      return;
    }
    try {
      const result = await scan(id);
      record({ id, observed, state: "reached", scans: [result] });
    } catch {
      record({ id, observed, state: "blocked", reason: scanInterrupted });
      throw new Error("checkpoint-scan-failed");
    }
  };
  try {
    guard();
    if (
      (await page.locator('[data-propellr-fixture="dialog-v1"]').count()) !== 1 ||
      !(await page.locator("#open").isVisible()) ||
      (await page.locator("#dialog").isVisible())
    )
      throw new Error("prerequisite");
    opener = await page.$("#open");
    closer = await page.$("#close");
    if (!opener || !closer) throw new Error("prerequisite");
    guard();
    // Fixed handles cannot rebind an in-flight action to a newly navigated document.
    // Once dispatched, a failed click can have an uncertain side effect. Never retry it.
    sideEffects = "uncertain";
    await opener.click(options);
    await page.locator("#dialog").waitFor({ state: "visible", ...options });
    // Retain confirmed observations even when cancellation arrived during the browser await.
    if (!current()) throw new Error("stale-observation");
    sideEffects = "confirmed";
    await checkpoint("opened", { dialogVisible: true });
    guard();
    sideEffects = "uncertain";
    await closer.click(options);
    await page.locator("#dialog").waitFor({ state: "hidden", ...options });
    const focusReturned = (await page.locator("#open:focus").count()) === 1;
    if (!current()) throw new Error("stale-observation");
    if (!focusReturned) throw new Error("focus");
    sideEffects = "confirmed";
    await checkpoint("closed", { dialogVisible: false, focusReturned });
  } catch {
    failed = !signal.aborted;
    const reason = {
      code: signal.aborted ? "cancellation-requested" : "journey-blocked",
      message: signal.aborted
        ? "Journey interrupted by cancellation"
        : "Prerequisite, authorization, document or interaction check failed",
    };
    diagnostics.push(reason);
    for (const id of ["opened", "closed"]) {
      if (!checkpoints.some((checkpoint) => checkpoint.id === id))
        record({ id, state: "skipped", reason });
    }
  } finally {
    if (sideEffects !== "none") {
      cleanup = "incomplete";
      try {
        // Cleanup is a distinct permitted close action, never a retry of an uncertain opener.
        if (await cleanUp()) cleanup = "complete";
      } catch {
        /* Keep cleanup incomplete; never expose raw browser error text. */
      }
      if (cleanup === "incomplete")
        diagnostics.push({
          code: "cleanup-incomplete",
          message: "Could not confirm authorized dialog cleanup",
        });
    }
    await Promise.all([opener, closer].map((handle) => handle?.dispose().catch(() => {})));
  }
  const first = checkpoints[0];
  if (!first) throw new Error("Missing journey checkpoint");
  const gaps = checkpoints.flatMap((checkpoint) =>
    checkpoint.state !== "reached"
      ? [checkpoint.reason]
      : checkpoint.scans.flatMap((scan) =>
          scan.coverage.state === "complete" ? [] : scan.coverage.gaps,
        ),
  );
  gaps.push(...diagnostics);
  const firstGap = gaps[0];
  return {
    cancelled: signal.aborted,
    failed,
    sideEffects,
    result: {
      playbook: dialogVersion,
      coverage: firstGap
        ? { state: "partial", gaps: [firstGap, ...gaps.slice(1)] }
        : { state: "complete" },
      checkpoints: [first, ...checkpoints.slice(1)],
      cleanup,
      diagnostics,
    },
  };
}
