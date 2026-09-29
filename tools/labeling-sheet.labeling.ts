// Labeling sheet generator, run only through `pnpm labeling:sheet`. Never part of pnpm validate.
// Renders the uninstrumented arm of every corpus family (no bridge attributes, no oracle) and
// writes an offline page for the human adjudicators plus a private key mapping cases to families.
// No provider arm runs here, so the holdout stays sealed.
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import type { Page } from "playwright";
import { test } from "vitest";
import { browserTypes, BrowserTarget } from "../src/host/browser.js";
import { ComponentRegistry, scanComponents } from "../src/host/components.js";
import { canonical } from "../src/reporting/index.js";
import { corpusFamilies } from "../test/fixtures/components/corpus.js";
import { request, scanContext } from "../test/support/component-corpus.js";
import { fixturePage } from "../test/support/parity.js";
import type { SheetCase } from "./component-labels.js";
import { sheetId } from "./component-labels.js";
import type { PageCase } from "./labeling-page.js";
import { renderSheet } from "./labeling-page.js";

type Segment = { readonly kind: "frame" | "shadow" | "element"; readonly selector: string };
const SNIPPET = 4000;
// Browser-side: resolve composed paths, measure in top-level page coordinates, and draw or clear
// numbered outlines in the top document. Kept as source text: the host has no ambient DOM.
const mark = `(input) => {
  const resolve = (path) => {
    let root = document;
    for (const [index, segment] of path.entries()) {
      const node = root.querySelector(segment.selector);
      if (!node) return null;
      if (index === path.length - 1) return node;
      if (segment.kind === "frame") root = node.contentDocument;
      else if (segment.kind === "shadow") root = node.shadowRoot;
      if (!root) return null;
    }
    return null;
  };
  const box = (node) => {
    let rect = node.getBoundingClientRect();
    let x = rect.left, y = rect.top;
    for (let view = node.ownerDocument.defaultView; view && view !== window; view = view.parent) {
      const frame = view.frameElement.getBoundingClientRect();
      x += frame.left + view.frameElement.clientLeft;
      y += frame.top + view.frameElement.clientTop;
    }
    return { x: x + window.scrollX, y: y + window.scrollY, width: rect.width, height: rect.height };
  };
  document.getElementById("__propellr_labeling")?.remove();
  if (input.clear) return null;
  const target = resolve(input.target);
  if (!target) return null;
  const layer = document.createElement("div");
  layer.id = "__propellr_labeling";
  layer.style.cssText = "position:absolute;left:0;top:0;width:0;height:0;z-index:2147483647;pointer-events:none";
  const draw = (rect, color, style, text, badgeAt = 0) => {
    const outline = document.createElement("div");
    outline.style.cssText = "position:absolute;box-sizing:border-box;border:3px " + style + " " + color +
      ";left:" + (rect.x - 3) + "px;top:" + (rect.y - 3) + "px;width:" + (rect.width + 6) + "px;height:" + (rect.height + 6) + "px";
    if (text) {
      const badge = document.createElement("span");
      badge.textContent = text;
      badge.style.cssText = "position:absolute;left:" + (badgeAt - 3) + "px;top:-3px;background:" + color +
        ";color:#fff;font:bold 12px/16px system-ui,sans-serif;padding:0 4px";
      outline.append(badge);
    }
    layer.append(outline);
  };
  const ancestors = input.ancestors
    .map(({ distance, path }) => ({ distance, node: path && resolve(path) }))
    .filter(({ node }) => node && !["html", "body"].includes(node.localName));
  for (const { distance, node } of [...ancestors].reverse()) draw(box(node), "#1f5fbf", "dashed", "A" + distance, (distance - 1) * 26);
  const targetBox = box(target);
  draw(targetBox, "#c62828", "solid", "");
  document.body.append(layer);
  const outer = ancestors.length ? ancestors[ancestors.length - 1].node : target;
  // outerHTML stops at shadow and frame boundaries: use the highest ancestor in the target's tree.
  const sameTree = ancestors.map(({ node }) => node).filter((node) => node.contains(target));
  const markupRoot = sameTree.length ? sameTree[sameTree.length - 1] : target;
  const own = target.outerHTML;
  const shadowHost = target.getRootNode() instanceof ShadowRoot ? target.getRootNode().host.localName : null;
  const html = (shadowHost ? "<!-- inside the shadow root of <" + shadowHost + "> -->\\n" : "") + markupRoot.outerHTML;
  const at = html.indexOf(own);
  const start = at < 0 ? 0 : at;
  const near = ancestors.length ? ancestors[0].node : target;
  return {
    target: targetBox,
    near: box(near),
    outer: box(outer),
    page: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
    snippet: { html, start, end: at < 0 ? 0 : start + own.length },
  };
}`;
type Marked = {
  target: { x: number; y: number; width: number; height: number };
  outer: { x: number; y: number; width: number; height: number };
  near: { x: number; y: number; width: number; height: number };
  page: { width: number; height: number };
  snippet: { html: string; start: number; end: number };
} | null;

// Context around the target: the outermost marked ancestor, capped in size and centered on the
// target when the ancestor is larger than the cap.
function crop(
  marked: NonNullable<Marked>,
  outer: NonNullable<Marked>["outer"],
  cap: { width: number; height: number },
) {
  const pad = 16;
  const axis = (start: number, size: number, center: number, cap: number, page: number) => {
    const span = Math.min(cap, size + 2 * pad, page);
    const from = start - pad;
    const fitted =
      size + 2 * pad <= span
        ? from
        : Math.min(Math.max(center - span / 2, from), from + size + 2 * pad - span);
    return { at: Math.round(Math.max(0, Math.min(fitted, page - span))), span: Math.round(span) };
  };
  const { target, page } = marked;
  const x = axis(outer.x, outer.width, target.x + target.width / 2, cap.width, page.width);
  const y = axis(outer.y, outer.height, target.y + target.height / 2, cap.height, page.height);
  return { x: x.at, y: y.at, width: x.span, height: y.span };
}

async function capture(
  page: Page,
  target: readonly Segment[],
  ancestors: readonly { distance: number; path?: readonly Segment[] }[],
) {
  const marked = (await page.evaluate(
    `(${mark})(${JSON.stringify({ target, ancestors })})`,
  )) as Marked;
  if (!marked) return { image: null, closeup: null, snippet: { text: "", start: 0, end: 0 } };
  const jpeg = async (clip: ReturnType<typeof crop>) =>
    `data:image/jpeg;base64,${(await page.screenshot({ clip, fullPage: true, type: "jpeg", quality: 72 })).toString("base64")}`;
  const context = crop(marked, marked.outer, { width: 960, height: 640 });
  // Close-up of the nearest ancestor (or the target), shown enlarged on the sheet.
  const near = crop(marked, marked.near, { width: 480, height: 320 });
  const image = await jpeg(context);
  const closeup = { src: await jpeg(near), width: near.width, height: near.height };
  await page.evaluate(`(${mark})({ clear: true })`);
  const text = marked.snippet.html.slice(0, SNIPPET);
  return {
    image,
    closeup,
    snippet: {
      text,
      start: Math.min(marked.snippet.start, text.length),
      end: Math.min(marked.snippet.end, text.length),
    },
  };
}

test("component labeling sheet", { timeout: 600_000 }, async () => {
  const browser = await browserTypes.chromium.launch();
  const cases: PageCase[] = [];
  const key: { id: string; family: string; split: string; path: unknown }[] = [];
  // Families appear as opaque pages in a fixed, name-independent order.
  const order = [...corpusFamilies].sort((a, b) =>
    createHash("sha256")
      .update(`page:${a.id}`)
      .digest("hex")
      .localeCompare(createHash("sha256").update(`page:${b.id}`).digest("hex")),
  );
  try {
    for (const [index, family] of order.entries()) {
      const letter = String.fromCharCode(65 + index);
      const { context, page } = await fixturePage(browser, family.render("uninstrumented"));
      const target = new BrowserTarget(page, "borrowed");
      try {
        const { scan, structure } = await scanComponents(
          target,
          request(target, family.rules),
          scanContext,
          new AbortController().signal,
          new ComponentRegistry([]),
          target.documentId,
          { structure: true },
        );
        if (structure?.state !== "available")
          throw new Error(`blocked: structure unavailable for page ${letter}`);
        if (scan.coverage.state !== "complete")
          throw new Error(`blocked: incomplete scan for page ${letter}`);
        const rulesByPath = new Map<string, string[]>();
        for (const result of scan.rules)
          if (result.state === "evaluated")
            for (const occurrence of result.occurrences)
              if (occurrence.outcome === "violation") {
                const path = canonical(occurrence.target.path);
                rulesByPath.set(path, [...(rulesByPath.get(path) ?? []), result.rule.id]);
              }
        for (const entry of structure.targets) {
          const path = canonical(entry.target.path);
          const id = `c-${createHash("sha256").update(`${family.id}\n${path}`).digest("hex").slice(0, 10)}`;
          const shown = await capture(
            page,
            entry.target.path,
            entry.chain
              .filter(({ distance }) => distance > 0)
              .map(({ distance, target: link }) => ({
                distance,
                ...(link ? { path: link.path } : {}),
              })),
          );
          const sheetCase: SheetCase = {
            id,
            page: letter,
            rules: [...new Set(rulesByPath.get(path) ?? [])].sort(),
            chain: entry.chain.map(({ distance, label, shape, repeats }) => ({
              distance,
              label,
              shape,
              repeats,
            })),
          };
          cases.push({ ...sheetCase, ...shown });
          key.push({ id, family: family.id, split: family.split, path: entry.target.path });
        }
      } finally {
        await target.release();
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
  const sheet = sheetId(cases);
  const generatedAt = new Date().toISOString();
  const out = new URL("../artifacts/labeling/", import.meta.url);
  await mkdir(out, { recursive: true });
  await writeFile(
    new URL("component-labeling-sheet.html", out),
    renderSheet({ sheet, generatedAt, cases }),
  );
  // Private: maps opaque cases to families and splits. Never give this file to labelers.
  await writeFile(
    new URL("sheet-cases.json", out),
    `${JSON.stringify(
      {
        schema: "propellr-component-labeling-sheet/1",
        sheet,
        generatedAt,
        cases: cases.map(({ id, page, rules, chain }) => ({ id, page, rules, chain })),
        key,
      },
      null,
      2,
    )}\n`,
  );
  console.log(
    JSON.stringify({
      sheet,
      cases: cases.length,
      pages: new Set(cases.map(({ page }) => page)).size,
      withoutImage: cases.filter(({ image }) => !image).length,
      perPage: Object.fromEntries(
        order.map((family, index) => [
          String.fromCharCode(65 + index),
          key.filter((k) => k.family === family.id).length,
        ]),
      ),
    }),
  );
});
