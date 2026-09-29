import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { browserTypes } from "../../src/host/browser.js";
import type { LabelSet, SheetCase } from "../../tools/component-labels.js";
import {
  compareLabels,
  kappa,
  labelSchemaId,
  labelSetSchema,
  sheetId,
} from "../../tools/component-labels.js";
import type { PageCase } from "../../tools/labeling-page.js";
import { renderSheet } from "../../tools/labeling-page.js";

const chain = [
  { distance: 0, label: "button", shape: "00000001", repeats: 2 },
  { distance: 1, label: "article", shape: "00000002", repeats: 2 },
  { distance: 2, label: "main", shape: "00000003", repeats: 1 },
];
const cases: SheetCase[] = [
  { id: "c-0000000001", page: "A", rules: ["button-name"], chain },
  { id: "c-0000000002", page: "A", rules: ["button-name"], chain },
  {
    id: "c-0000000003",
    page: "B",
    rules: ["image-alt"],
    chain: [{ distance: 0, label: "img", shape: "00000004", repeats: 1 }, chain[2]!],
  },
];
const sheet = sheetId(cases);
type Answer = Pick<LabelSet["labels"][number], "membership" | "component" | "cause">;
const set = (labeler: string, answers: Readonly<Record<string, Answer>>): LabelSet =>
  labelSetSchema.parse({
    schema: labelSchemaId,
    sheet,
    labeler,
    exportedAt: "2026-09-29T12:00:00.000Z",
    labels: Object.entries(answers).map(([id, answer]) => ({
      id,
      notes: "",
      bulk: false,
      ...answer,
    })),
  });
const card = { membership: "ancestor-1", component: "card", cause: "template" } as const;

describe("human label comparison", () => {
  test("Cohen's kappa on known cases", () => {
    expect(
      kappa([
        ["a", "a"],
        ["b", "b"],
      ]),
    ).toBe(1);
    // Observed 0.75, chance 0.5.
    expect(
      kappa([
        ["a", "a"],
        ["a", "b"],
        ["b", "b"],
        ["b", "b"],
      ]),
    ).toBeCloseTo(0.5, 12);
    // A single shared category leaves nothing to agree beyond chance.
    expect(
      kappa([
        ["a", "a"],
        ["a", "a"],
      ]),
    ).toBeNull();
    expect(kappa([])).toBeNull();
  });

  test("records disagreements, missing cases and component grouping without resolving them", () => {
    const tony = set("Tony", {
      "c-0000000001": card,
      "c-0000000002": card,
      "c-0000000003": { membership: "none", component: "", cause: "instance" },
    });
    const colleague = set("Colleague", {
      "c-0000000001": { ...card, component: "Tile" },
      "c-0000000002": { ...card, membership: "target", component: "button" },
    });
    const report = compareLabels(cases, tony, colleague);
    expect(report).toMatchObject({
      labelers: ["Tony", "Colleague"],
      cases: 3,
      labeled: { each: [3, 2], both: 2 },
      complete: false,
      membership: { agreement: 0.5 },
      cause: { agreement: 1, kappa: null },
      // Tony groups cases 1 and 2 together; the colleague separates them.
      component: { pairs: 1, agreement: 0 },
      bulk: [0, 0],
      missing: [{ id: "c-0000000003", missingFrom: [false, true] }],
    });
    expect(report.disagreements).toEqual([
      {
        id: "c-0000000002",
        page: "A",
        answers: [
          { membership: "ancestor-1", cause: "template", component: "card", notes: "" },
          { membership: "target", cause: "template", component: "button", notes: "" },
        ],
      },
    ]);
  });

  test("refuses mismatched sheets, one labeler twice, unknown cases and malformed sets", () => {
    const tony = set("Tony", { "c-0000000001": card });
    expect(() => compareLabels(cases, tony, set("tony", { "c-0000000001": card }))).toThrow(
      "same labeler",
    );
    expect(() =>
      compareLabels(cases, tony, { ...set("Colleague", {}), sheet: "0".repeat(64) }),
    ).toThrow("different sheet");
    expect(() => compareLabels(cases, tony, set("Colleague", { "c-00000000ff": card }))).toThrow(
      "unknown case",
    );
    const valid = {
      schema: labelSchemaId,
      sheet,
      labeler: "T",
      exportedAt: "2026-09-29T12:00:00.000Z",
    };
    const label = { id: "c-0000000001", notes: "", bulk: false, ...card };
    expect(labelSetSchema.safeParse({ ...valid, labels: [label, label] }).success).toBe(false);
    expect(
      labelSetSchema.safeParse({ ...valid, labels: [{ ...label, membership: "ancestor-9" }] })
        .success,
    ).toBe(false);
    expect(labelSetSchema.safeParse({ ...valid, labels: [{ ...label, extra: 1 }] }).success).toBe(
      false,
    );
    expect(labelSetSchema.safeParse({ ...valid, labeler: " ", labels: [] }).success).toBe(false);
  });

  test("the compare command reads the private sheet key and writes the report", async () => {
    const dir = await mkdtemp(join(tmpdir(), "propellr-labels-"));
    try {
      const files = {
        cases: join(dir, "sheet-cases.json"),
        a: join(dir, "a.json"),
        b: join(dir, "b.json"),
        out: join(dir, "report.json"),
      };
      await writeFile(files.cases, JSON.stringify({ sheet, cases }));
      await writeFile(files.a, JSON.stringify(set("Tony", { "c-0000000001": card })));
      await writeFile(files.b, JSON.stringify(set("Colleague", { "c-0000000001": card })));
      const run = (...args: string[]) =>
        spawnSync(process.execPath, ["tools/component-labels.ts", ...args], { encoding: "utf8" });
      const ok = run("compare", files.a, files.b, "--cases", files.cases, "--out", files.out);
      expect(ok.status, ok.stderr).toBe(0);
      expect(JSON.parse(await readFile(files.out, "utf8"))).toMatchObject({
        labeled: { both: 1 },
        membership: { agreement: 1 },
      });
      expect(run("compare", files.a).status).toBe(2);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe("offline labeling page", () => {
  const pixel =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  // Fixture markup is untrusted text: it must never execute or escape the data block.
  const hostile =
    '<article><button id="n0"></button></script><script>window.pwned=1</script><img src=x onerror="window.pwned=2"></article>';
  const page: readonly PageCase[] = cases.map((entry, index) => ({
    ...entry,
    image: index === 2 ? null : pixel,
    closeup: index === 0 ? { src: pixel, width: 1, height: 1 } : null,
    snippet: { text: hostile, start: 9, end: 34 },
  }));
  const html = renderSheet({ sheet, generatedAt: "2026-09-29T12:00:00.000Z", cases: page });

  test("self-contained: one style, two scripts, a restrictive CSP and no network references", () => {
    expect(html.match(/<style>/g)).toHaveLength(1);
    expect(html.match(/<script/g)).toHaveLength(2);
    expect(html).toContain(`content="default-src 'none'; img-src data:;`);
    expect(html).not.toMatch(/https?:\/\//);
    expect(html).not.toContain("innerHTML");
    expect(html).not.toContain("window.pwned=1</script>");
  });

  test("labels, copies to identical cases and exports a valid label set in a real browser", async () => {
    const browser = await browserTypes.chromium.launch();
    try {
      const context = await browser.newContext({ acceptDownloads: true });
      const tab = await context.newPage();
      const errors: string[] = [];
      tab.on("pageerror", (error) => errors.push(String(error)));
      tab.on("dialog", (dialog) => void dialog.accept());
      await tab.setContent(html);
      await tab.fill("#labeler", "Tony");
      const first = tab.locator("#c-0000000001");
      await first.locator('input[value="ancestor-1"]').check();
      await expect.poll(() => first.locator(".part").textContent()).toBe("button");
      await first.locator('input[type="text"]').fill("card");
      await first.locator('input[value="template"]').check();
      await first.locator("button", { hasText: "Copy to 1 identical" }).click();
      await expect.poll(() => tab.locator("#c-0000000002 .status.copied").count()).toBe(1);
      expect(await first.locator("mark").textContent()).toBe('<button id="n0"></button>');
      await tab.locator("nav.pages button", { hasText: "Page B" }).click();
      const other = tab.locator("#c-0000000003");
      expect(await other.textContent()).toContain("No screenshot could be taken");
      await other.locator('input[value="none"]').check();
      await other.locator('input[value="instance"]').check();
      await expect.poll(() => tab.locator("#progress").textContent()).toBe("3 of 3 complete");
      const [download] = await Promise.all([tab.waitForEvent("download"), tab.click("#export")]);
      const exported = labelSetSchema.parse(
        JSON.parse(await readFile(await download.path(), "utf8")),
      );
      expect(exported).toMatchObject({ labeler: "Tony", sheet });
      expect(exported.labels.map(({ id, membership, bulk }) => [id, membership, bulk])).toEqual([
        ["c-0000000001", "ancestor-1", false],
        ["c-0000000002", "ancestor-1", true],
        ["c-0000000003", "none", false],
      ]);
      expect(await tab.evaluate("window.pwned")).toBeUndefined();
      expect(errors).toEqual([]);
    } finally {
      await browser.close();
    }
  });
});
