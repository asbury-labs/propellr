// propellr-text-capture/1 and propellr-redaction/1 against real Chromium fixtures.
// Protocol: specs/semantic-text-capture-protocol.md (approved 2026-10-21). No provider calls.
import { afterAll, beforeAll, expect, test, vi } from "vitest";
import type { Browser } from "playwright";
import { textChecks, textRules } from "../../src/analysis.js";
import type { ScanResult } from "../../src/contracts.js";
import type { RedactedTextCapture, RedactedTextTarget } from "../../src/review/contracts.js";
import { BrowserTarget, browserTypes } from "../../src/host/browser.js";
import { ComponentRegistry, scanComponents } from "../../src/host/components.js";
import { bindTextCapture, redactText } from "../../src/host/redaction.js";
import { collectScan } from "../../src/host/scan.js";
import { namingDocument } from "../fixtures/naming.js";
import { deniedUrl, fixtureUrl, frameUrl } from "../fixtures/slice.js";
import { exact, raw, request, scanContext } from "../support/component-corpus.js";
import { fixturePage } from "../support/parity.js";

let browser: Browser;
beforeAll(async () => {
  browser = await browserTypes.chromium.launch();
});
afterAll(async () => {
  await browser.close();
});

const seven = [...textRules];
const shadow = (host: string, html: string) =>
  `<script>document.querySelector(${JSON.stringify(host)}).attachShadow({mode:"open"}).innerHTML=${JSON.stringify(html)};</script>`;
const slotElement = `<script>customElements.define("x-slot",class extends HTMLElement{constructor(){super();this.attachShadow({mode:"open"}).innerHTML="<slot></slot>"}});</script>`;

async function open(html: string, frames?: Readonly<Record<string, string>>) {
  const { context, page } = await fixturePage(browser, {
    id: "text-capture",
    html,
    expected: {},
    ...(frames ? { frames } : {}),
  });
  return { context, page, target: new BrowserTarget(page, "borrowed") };
}
// Every case checks isolation: raw rules/coverage, reportScan and applyGate are byte-identical
// with capture on and off, and the default-off result has no text property.
async function run(
  html: string,
  options: { rules?: readonly string[]; frames?: Readonly<Record<string, string>> } = {},
): Promise<{ scan: ScanResult; text: RedactedTextCapture }> {
  const { context, target } = await open(html, options.frames);
  try {
    const scanRequest = request(target, options.rules ?? seven);
    const registry = new ComponentRegistry([]);
    const scan = (text?: boolean) =>
      scanComponents(
        target,
        scanRequest,
        scanContext,
        new AbortController().signal,
        registry,
        target.documentId,
        text ? { text } : {},
      );
    const on = await scan(true);
    const off = await scan();
    expect(JSON.stringify(raw(on.scan))).toBe(JSON.stringify(raw(off.scan)));
    expect(JSON.stringify(exact(on.scan))).toBe(JSON.stringify(exact(off.scan)));
    expect("text" in off).toBe(false);
    expect(Object.keys(on.scan)).toEqual(Object.keys(off.scan));
    return { scan: on.scan, text: on.text! };
  } finally {
    await target.release();
    await context.close();
  }
}
function targets(text: RedactedTextCapture): readonly RedactedTextTarget[] {
  if (text.state !== "available") throw new Error(`capture unavailable: ${text.reason.code}`);
  return text.targets;
}
function at(text: RedactedTextCapture, rule: string, id: string): RedactedTextTarget {
  const found = targets(text).find(
    (record) => record.rule.id === rule && record.target.path.at(-1)?.selector === `#${id}`,
  );
  if (!found) throw new Error(`no ${rule} record for #${id}`);
  return found;
}
type Named = Extract<RedactedTextTarget, { name: { state: "available" } }>;
function named(text: RedactedTextCapture, rule: string, id: string): Named {
  const record = at(text, rule, id);
  if (record.name.state !== "available") throw new Error(`#${id} has no available name`);
  return record as Named;
}
function outcome(scan: ScanResult, rule: string, id: string) {
  const result = scan.rules.find((entry) => entry.rule.id === rule);
  if (result?.state !== "evaluated") return undefined;
  return result.occurrences.find(({ target }) => target.path.at(-1)?.selector === `#${id}`)
    ?.outcome;
}
const passes = (scan: ScanResult) =>
  scan.rules.flatMap((result) =>
    result.state === "evaluated"
      ? result.occurrences.filter(({ outcome }) => outcome === "pass")
      : [],
  ).length;

// 1. Every successful check/source in the seven-rule table, selected by the rule itself.
test("each passing check yields its own text or a fixed unavailable reason", async () => {
  const html = namingDocument(`<main>
    <span id="bl">Save draft</span><span id="m1">First</span><span id="m2">Second</span>
    <span id="hid" hidden>Secret label</span>
    <span id="css-hid" style="visibility:hidden">Invisible label</span>
    <span id="aria-hid" aria-hidden="true">Muted label</span>
    <button id="b-ref" aria-labelledby="bl"></button>
    <button id="b-aria" aria-label="Close dialog"></button>
    <label for="b-lab">Upload file</label><button id="b-lab"></button>
    <button id="b-text">Send <b>now</b></button>
    <button id="b-title" title="More options"></button>
    <button id="b-compete" aria-label="Aria wins">Contents lose</button>
    <button id="b-multi" aria-labelledby="m2 missing m1 m2"></button>
    <button id="b-hidden" aria-labelledby="hid"></button>
    <button id="b-css-hidden" aria-labelledby="css-hid"></button>
    <button id="b-aria-hidden" aria-labelledby="aria-hid"></button>
    <a id="l-text" href="/x">Read the report</a>
    <a id="l-aria" href="#" aria-label="Open menu"></a>
    <a id="l-ref" href="#" aria-labelledby="bl"></a>
    <a id="l-title" href="#" title="Help center"></a>
    <a id="l-multi" href="#" aria-labelledby="m2 missing m1 m2"></a>
    <a id="l-compete" href="#" aria-label="Aria loses">Contents win</a>
    <a id="l-hidden" href="#" aria-labelledby="hid"></a>
    <img id="i-alt" alt="Team photo" src="/media/team-photo.jpg">
    <img id="i-empty" alt="" src="/spacer.gif">
    <img id="i-aria" aria-label="Sales chart">
    <img id="i-ref" aria-labelledby="bl">
    <img id="i-title" title="Company logo">
    <img id="i-present" role="presentation">
    <img id="i-data" alt="Logo" src="data:image/png;base64,AAAA">
    <img id="i-url" alt="Photo" src="https://cdn.example/a/b/IMG%202041.JPG?sig=abc#frag">
    <label>Email address <input id="f-implicit"></label>
    <label for="f-explicit">Phone number</label><input id="f-explicit">
    <input id="f-aria" aria-label="Search site">
    <input id="f-ref" aria-labelledby="bl">
    <input id="f-title" title="Zip code">
    <input id="f-ph" placeholder="Search">
    <input id="f-present" role="presentation" disabled>
    <label>Implicit wins <input id="f-compete" aria-label="Aria loses"></label>
    <label for="f-hl" style="display:none">Hidden name</label><input id="f-hl" aria-label="Visible aria">
    <label>Account password <input id="f-pass" type="password"></label>
    <label for="s-explicit">Country</label><select id="s-explicit"><option selected>Chosen option</option></select>
    <select id="s-aria" aria-label="Sort order"><option>A</option></select>
    <label>Region <select id="s-implicit"><option>A</option></select></label>
    <select id="s-ref" aria-labelledby="bl"><option>A</option></select>
    <select id="s-title" title="Currency"><option>A</option></select>
    <select id="s-present" role="presentation" disabled><option>A</option></select>
    <input type="submit" id="ib-default">
    <input type="button" id="ib-value" value="Authored caption">
    <input type="button" id="ib-aria" aria-label="Apply filters">
    <input type="button" id="ib-present" role="none" disabled>
    <input type="reset" id="ib-reset">
    <input type="button" id="ib-compete" value="Value wins" aria-label="Aria loses">
    <input type="button" id="ib-ref" aria-labelledby="bl">
    <input type="button" id="ib-title" title="Print page">
    <label>Archive <input type="button" id="ib-implicit"></label>
    <label for="ib-explicit">Restore</label><input type="button" id="ib-explicit">
    <input type="image" id="ii-alt" alt="Search" src="/icons/search.svg">
    <input type="image" id="ii-aria" aria-label="Go">
    <input type="image" id="ii-ref" aria-labelledby="bl">
    <input type="image" id="ii-title" title="Zoom in">
    <label>Rotate <input type="image" id="ii-implicit"></label>
    <label for="ii-explicit">Crop</label><input type="image" id="ii-explicit">
  </main>`);
  const { scan, text } = await run(html);
  const cases: [rule: string, id: string, check: string, name: string | { reason: string }][] = [
    ["button-name", "b-ref", "aria-labelledby", "Save draft"],
    ["button-name", "b-aria", "aria-label", "Close dialog"],
    ["button-name", "b-lab", "label", "Upload file"],
    ["button-name", "b-text", "contents", "Send now"],
    ["button-name", "b-title", "title", "More options"],
    ["button-name", "b-compete", "aria-label", "Aria wins"],
    // name() keeps its own reference list: missing IDs skipped, repeats retained.
    ["button-name", "b-multi", "aria-labelledby", "Second First Second"],
    ["button-name", "b-hidden", "aria-labelledby", { reason: "hidden-source" }],
    ["button-name", "b-css-hidden", "aria-labelledby", { reason: "hidden-source" }],
    ["button-name", "b-aria-hidden", "aria-labelledby", { reason: "hidden-source" }],
    ["link-name", "l-text", "has-visible-text", "Read the report"],
    ["link-name", "l-aria", "aria-label", "Open menu"],
    ["link-name", "l-ref", "aria-labelledby", "Save draft"],
    ["link-name", "l-title", "non-empty-title", "Help center"],
    // references(): IDREF order, missing IDs skipped, a repeated element kept once.
    ["link-name", "l-multi", "aria-labelledby", "Second First"],
    ["link-name", "l-compete", "has-visible-text", "Contents win"],
    ["link-name", "l-hidden", "aria-labelledby", { reason: "hidden-source" }],
    ["image-alt", "i-alt", "has-alt", "Team photo"],
    ["image-alt", "i-empty", "has-alt", ""],
    ["image-alt", "i-aria", "aria-label", "Sales chart"],
    ["image-alt", "i-ref", "aria-labelledby", "Save draft"],
    ["image-alt", "i-title", "non-empty-title", "Company logo"],
    ["image-alt", "i-present", "presentational-role", { reason: "non-text-check" }],
    ["image-alt", "i-data", "has-alt", "Logo"],
    ["image-alt", "i-url", "has-alt", "Photo"],
    ["label", "f-implicit", "implicit-label", "Email address"],
    ["label", "f-explicit", "explicit-label", "Phone number"],
    ["label", "f-aria", "aria-label", "Search site"],
    ["label", "f-ref", "aria-labelledby", "Save draft"],
    ["label", "f-title", "non-empty-title", "Zip code"],
    ["label", "f-ph", "non-empty-placeholder", "Search"],
    ["label", "f-present", "presentational-role", { reason: "non-text-check" }],
    ["label", "f-compete", "implicit-label", "Implicit wins"],
    // A CSS-hidden explicit label is a boolean success deferred to NONE; capture never reads it.
    ["label", "f-hl", "explicit-label", { reason: "hidden-source" }],
    ["label", "f-pass", "implicit-label", { reason: "excluded-target" }],
    ["select-name", "s-explicit", "explicit-label", "Country"],
    ["select-name", "s-aria", "aria-label", "Sort order"],
    ["select-name", "s-implicit", "implicit-label", "Region"],
    ["select-name", "s-ref", "aria-labelledby", "Save draft"],
    ["select-name", "s-title", "non-empty-title", "Currency"],
    ["select-name", "s-present", "presentational-role", { reason: "non-text-check" }],
    ["input-button-name", "ib-default", "non-empty-if-present", { reason: "native-default" }],
    ["input-button-name", "ib-value", "non-empty-value", { reason: "control-value" }],
    ["input-button-name", "ib-aria", "aria-label", "Apply filters"],
    ["input-button-name", "ib-present", "presentational-role", { reason: "non-text-check" }],
    ["input-button-name", "ib-reset", "non-empty-if-present", { reason: "native-default" }],
    // The value check wins by rule order; capture never falls back to the later aria-label.
    ["input-button-name", "ib-compete", "non-empty-value", { reason: "control-value" }],
    ["input-button-name", "ib-ref", "aria-labelledby", "Save draft"],
    ["input-button-name", "ib-title", "non-empty-title", "Print page"],
    ["input-button-name", "ib-implicit", "implicit-label", "Archive"],
    ["input-button-name", "ib-explicit", "explicit-label", "Restore"],
    ["input-image-alt", "ii-alt", "non-empty-alt", "Search"],
    ["input-image-alt", "ii-aria", "aria-label", "Go"],
    ["input-image-alt", "ii-ref", "aria-labelledby", "Save draft"],
    ["input-image-alt", "ii-title", "non-empty-title", "Zoom in"],
    ["input-image-alt", "ii-implicit", "implicit-label", "Rotate"],
    ["input-image-alt", "ii-explicit", "explicit-label", "Crop"],
  ];
  for (const [rule, id, check, name] of cases) {
    expect(outcome(scan, rule, id), `${rule} #${id}`).toBe("pass");
    const record = at(text, rule, id);
    expect(record.check, `${rule} #${id}`).toBe(check);
    expect(record.name, `${rule} #${id}`).toEqual(
      typeof name === "string"
        ? { state: "available", value: name }
        : { state: "unavailable", reason: name.reason },
    );
    // Unavailable-name records retain identity and check metadata only.
    if (typeof name !== "string")
      expect(Object.keys(record).sort(), `${rule} #${id}`).toEqual(
        ["check", "name", "redacted", "review", "role", "rule", "target"].sort(),
      );
  }
  // One record per retained pass, nothing for other outcomes.
  expect(targets(text)).toHaveLength(passes(scan));
  expect(JSON.stringify(text)).not.toContain("Authored caption");
  expect(JSON.stringify(text)).not.toContain("Secret label");
  expect(JSON.stringify(text)).not.toContain("Hidden name");
  expect(JSON.stringify(text)).not.toContain("Chosen option");
  for (const hidden of ["Invisible label", "Muted label", "Value wins"])
    expect(JSON.stringify(text)).not.toContain(hidden);
  // Every allowlisted check of every rule appears at least once above.
  const covered = new Set(cases.map(([rule, , check]) => `${rule}/${check}`));
  for (const [rule, checks] of Object.entries(textChecks))
    for (const check of checks) expect(covered, `${rule}/${check}`).toContain(`${rule}/${check}`);
  // Allowlisted roles, never page-chosen strings.
  expect(at(text, "button-name", "b-aria").role).toBe("button");
  expect(at(text, "link-name", "l-text").role).toBe("link");
  expect(at(text, "image-alt", "i-alt").role).toBe("img");
  expect(at(text, "image-alt", "i-empty").role).toBe("presentation");
  expect(at(text, "label", "f-explicit").role).toBe("textbox");
  expect(at(text, "select-name", "s-explicit").role).toBe("combobox");
  expect(at(text, "input-image-alt", "ii-alt").role).toBe("button");
  // Image fields: absent versus authored empty alt; basename without host, query or fragment.
  const image = (rule: string, id: string) => named(text, rule, id).image;
  expect(image("image-alt", "i-alt")).toEqual({
    alt: { state: "available", value: "Team photo" },
    basename: { state: "available", value: "team-photo.jpg" },
  });
  expect(image("image-alt", "i-empty")?.alt).toEqual({ state: "available", value: "" });
  expect(image("image-alt", "i-aria")).toEqual({
    alt: { state: "absent" },
    basename: { state: "unavailable", reason: "no-src" },
  });
  expect(image("image-alt", "i-data")?.basename).toEqual({
    state: "unavailable",
    reason: "unsupported-url",
  });
  expect(image("image-alt", "i-url")?.basename).toEqual({
    state: "available",
    value: "IMG%202041.JPG",
  });
  expect(image("input-image-alt", "ii-alt")?.basename).toEqual({
    state: "available",
    value: "search.svg",
  });
  expect(image("label", "f-aria")).toBeUndefined();
  expect(JSON.stringify(text)).not.toMatch(/cdn\.example|sig=abc|frag|AAAA/);
});

// 2. Planted values, passwords, hidden inputs and hidden text never leave the page.
test("leak fixtures: controls, hidden text and editable content are never captured", async () => {
  const html = namingDocument(`<main><form>
    <h2>Contact <span aria-hidden="true">PLANTED-ARIA-HEADING</span></h2>
    <div>Visible context
      <span aria-hidden="true">PLANTED-ARIA-HIDDEN</span>
      <span style="display:none">PLANTED-DISPLAY-NONE</span>
      <span hidden>PLANTED-HIDDEN-ATTR</span>
      <span inert>PLANTED-INERT</span>
      <input value="PLANTED-INPUT-VALUE" aria-label="Your name">
      <input type="password" value="PLANTED-PASSWORD" aria-label="Passphrase">
      <input type="hidden" value="PLANTED-HIDDEN-INPUT">
      <textarea aria-label="Notes">PLANTED-TEXTAREA</textarea>
      <select aria-label="Plan"><option selected>PLANTED-OPTION</option></select>
      <script>/* PLANTED-SCRIPT */</script>
      <button id="leak-target">Send message</button>
    </div></form>
    <span id="secret" hidden>PLANTED-HIDDEN-REFERENCE</span>
    <button id="leak-ref" aria-labelledby="secret"></button>
    <div><span contenteditable="true">PLANTED-EDITABLE</span><button id="leak-context">Post</button></div>
    <div contenteditable="true"><button id="leak-editable">PLANTED-EDITABLE-NAME</button></div>
    <div contenteditable="true">PLANTED-EDITABLE-DIRECT <button id="leak-direct" aria-label="Bold"></button></div>
  </main>`);
  const { scan, text } = await run(html);
  const target = at(text, "button-name", "leak-target");
  expect(target).toMatchObject({
    name: { state: "available", value: "Send message" },
    heading: { state: "available", value: "Contact" },
    container: { state: "available", value: "Visible context" },
  });
  // A legitimate hidden-reference pass stays a pass; its capture is unavailable.
  expect(outcome(scan, "button-name", "leak-ref")).toBe("pass");
  expect(at(text, "button-name", "leak-ref").name).toEqual({
    state: "unavailable",
    reason: "hidden-source",
  });
  expect(named(text, "button-name", "leak-context").container).toEqual({
    state: "unavailable",
    reason: "excluded-source",
  });
  // Text directly inside an editable container is excluded, not only editable descendants.
  expect(named(text, "button-name", "leak-direct").container).toEqual({
    state: "unavailable",
    reason: "excluded-source",
  });
  expect(at(text, "button-name", "leak-editable").name).toEqual({
    state: "unavailable",
    reason: "excluded-source",
  });
  const password = targets(text).find(
    ({ rule, name }) =>
      rule.id === "label" && name.state === "unavailable" && name.reason === "excluded-target",
  );
  expect(password).toBeDefined();
  expect(JSON.stringify(text)).not.toContain("PLANTED");
  // Naming occurrence evidence still carries no name strings or control values.
  const evidence = JSON.stringify(scan.rules);
  for (const value of ["PLANTED", "Send message", "Your name", "Visible context", "Contact"])
    expect(evidence).not.toContain(value);
});

// 3. Per-string, per-target, per-scan and residual naming-budget bounds.
test("strings over 160 UTF-16 units are field-unavailable, never prefixes", async () => {
  const html = namingDocument(`<main>
    <h2>${"h".repeat(161)}</h2>
    <p>${"c".repeat(161)} <button id="s160" aria-label="${"q".repeat(160)}"></button></p>
    <button id="s161" aria-label="${"b".repeat(161)}"></button>
    <button id="e80" aria-label="${"😀".repeat(80)}"></button>
    <button id="e81" aria-label="${"😀".repeat(81)}"></button>
    <button id="long-contents">${"word ".repeat(40)}</button>
  </main>`);
  const { scan, text } = await run(html, { rules: ["button-name"] });
  for (const id of ["s160", "s161", "e80", "e81", "long-contents"])
    expect(outcome(scan, "button-name", id), id).toBe("pass");
  const s160 = named(text, "button-name", "s160");
  // Letters outside hex keep the token rule from applying; this checks the length bound only.
  expect(s160.name).toEqual({ state: "available", value: "q".repeat(160) });
  expect(s160.heading).toEqual({
    state: "unavailable",
    reason: "too-long",
  });
  expect(s160.container).toEqual({
    state: "unavailable",
    reason: "too-long",
  });
  expect(at(text, "button-name", "s161").name).toEqual({
    state: "unavailable",
    reason: "truncated",
  });
  expect(at(text, "button-name", "e80").name).toEqual({
    state: "available",
    value: "😀".repeat(80),
  });
  expect(at(text, "button-name", "e81").name).toEqual({
    state: "unavailable",
    reason: "truncated",
  });
  expect(at(text, "button-name", "long-contents").name).toEqual({
    state: "unavailable",
    reason: "truncated",
  });
  expect(JSON.stringify(text)).not.toContain("b".repeat(100));
});

test("an oversized target record abandons the whole sidecar; raw results stay valid", async () => {
  // Without IDs the reader's selector spans the full ancestry, making the target path long.
  const html = namingDocument(
    `<main><h1>${"h".repeat(150)}</h1>${"<div>".repeat(30)}<button>${"n".repeat(150)}</button>${"</div>".repeat(30)}</main>`,
  );
  const { scan, text } = await run(html, { rules: ["button-name"] });
  expect(scan.coverage).toEqual({ state: "complete" });
  expect(passes(scan)).toBe(1);
  expect(text).toMatchObject({ state: "unavailable", reason: { code: "text-capture-limit" } });
});

test("a capture over 64 KiB is unavailable, not a partial target list", async () => {
  const buttons = Array.from(
    { length: 96 },
    (_, k) =>
      `<button id="${`b${k}-`.padEnd(200, "x")}" aria-label="${`Label ${k} `.padEnd(150, "y")}"></button>`,
  ).join("");
  const { scan, text } = await run(namingDocument(`<h1>${"h".repeat(150)}</h1>${buttons}`), {
    rules: ["button-name"],
  });
  expect(passes(scan)).toBe(96);
  expect(text).toMatchObject({ state: "unavailable", reason: { code: "text-capture-limit" } });
});

test("residual naming budget exhaustion is unavailable and never changes raw findings", async () => {
  const residual = await run(
    namingDocument(`<main><div>${" ".repeat(20_000)}<button id="go">Go</button></div></main>`),
    { rules: ["button-name"] },
  );
  expect(outcome(residual.scan, "button-name", "go")).toBe("pass");
  expect(residual.text).toMatchObject({
    state: "unavailable",
    reason: { code: "text-capture-limit" },
  });
  // Raw evaluation exhausting the shared budget leaves no residual allowance for capture.
  const exhausted = await run(
    namingDocument(
      `<main><button id="first">First</button><button aria-label="${"z".repeat(17_000)}"></button></main>`,
    ),
    { rules: ["button-name"] },
  );
  expect(outcome(exhausted.scan, "button-name", "first")).toBe("pass");
  expect(exhausted.scan.coverage.state).toBe("partial");
  expect(exhausted.text).toMatchObject({
    state: "unavailable",
    reason: { code: "text-capture-limit" },
  });
});

// 4. Root-local context, slot deduplication, frame targets and same-name populations.
const contextHtml = (extra = "") =>
  namingDocument(`<main>
    <h1>Account</h1>
    <section><h2>Billing</h2><p>Manage your invoices <button id="c-btn">Download</button></p></section>
    <div id="host"></div>
    <div id="host2"></div>
    <div><span>Before</span><x-slot><em>Slotted text</em></x-slot><button id="c-slot">Go</button></div>
    <iframe id="frame" src="${frameUrl}" title="Child"></iframe>
    ${extra}
  </main>${shadow("#host", '<h2>Shadow heading</h2><div><span>Inside</span><button id="c-shadow">Edit</button></div>')}${shadow("#host2", '<button id="c-noheading">Open</button>')}${slotElement}`);
const contextFrames = {
  [frameUrl]: namingDocument('<h3>Frame heading</h3><button id="f-dup">Download</button>'),
  [deniedUrl]: namingDocument("<button>Hidden from reader</button>"),
};
test("context is root-local, slots are read once and frames keep distinct targets", async () => {
  const { scan, text } = await run(contextHtml(), { frames: contextFrames });
  expect(scan.coverage).toEqual({ state: "complete" });
  const field = (id: string) => named(text, "button-name", id);
  expect(field("c-btn")).toMatchObject({
    heading: { state: "available", value: "Billing" },
    container: { state: "available", value: "Manage your invoices" },
  });
  expect(field("c-shadow")).toMatchObject({
    heading: { state: "available", value: "Shadow heading" },
    container: { state: "available", value: "Inside" },
  });
  // No cross-root heading guess, and no container across a shadow-root boundary.
  expect(field("c-noheading")).toMatchObject({
    heading: { state: "absent" },
    container: { state: "absent" },
  });
  expect(field("c-slot")).toMatchObject({
    heading: { state: "available", value: "Billing" },
    container: { state: "available", value: "Before Slotted text" },
  });
  const frame = field("f-dup");
  expect(frame.target.path.map(({ kind }) => kind)).toEqual(["frame", "element"]);
  expect(frame.heading).toEqual({ state: "available", value: "Frame heading" });
  // Complete page, all seven rules: exact counts over the declared population, frames included.
  expect(frame.sameName).toEqual({ state: "available", count: 2 });
  expect(field("c-btn").sameName).toEqual({ state: "available", count: 2 });
  expect(field("c-shadow").sameName).toEqual({ state: "available", count: 1 });
  expect(text.state === "available" && text.gaps).toEqual([]);
});

test("same-name counts are unavailable for subsets, incomplete populations or unavailable names", async () => {
  const subset = await run(contextHtml(), { frames: contextFrames, rules: ["button-name"] });
  expect(at(subset.text, "button-name", "c-btn").name.state).toBe("available");
  expect(at(subset.text, "button-name", "c-btn")).toMatchObject({
    sameName: { state: "unavailable", reason: "selection-incomplete" },
  });
  expect(subset.text.state === "available" && subset.text.gaps.map(({ code }) => code)).toEqual([
    "text-selection-incomplete",
  ]);
  // A denied frame prevents a complete-page claim.
  const denied = await run(
    contextHtml(`<iframe id="denied" src="${deniedUrl}" title="Denied"></iframe>`),
    { frames: contextFrames },
  );
  expect(at(denied.text, "button-name", "c-btn")).toMatchObject({
    sameName: { state: "unavailable", reason: "population-incomplete" },
  });
  expect(denied.text.state === "available" && denied.text.gaps.map(({ code }) => code)).toEqual([
    "text-population-incomplete",
  ]);
  for (const extra of [
    '<input type="submit" id="default">',
    `<button id="long" aria-label="${"t".repeat(161)}"></button>`,
  ]) {
    const unnamed = await run(contextHtml(extra), { frames: contextFrames });
    expect(at(unnamed.text, "button-name", "c-btn"), extra).toMatchObject({
      sameName: { state: "unavailable", reason: "name-unavailable" },
      review: { state: "available", distinguishable: "unavailable" },
    });
  }
});

test("an occurrence limit outside the naming rules leaves the naming population complete", async () => {
  const buttons = Array.from({ length: 90 }, (_, k) => `<button id="g${k}">Action ${k}</button>`);
  const { scan, text } = await run(namingDocument(`<main>${buttons.join("")}</main>`), {
    rules: [...seven, "target-size"],
  });
  expect(scan.coverage.state).toBe("partial");
  expect(scan.rules.find(({ rule }) => rule.id === "target-size")?.state).toBe("evaluated");
  expect(passes(scan)).toBeGreaterThanOrEqual(90);
  expect(text.state === "available" && text.gaps).toEqual([]);
  expect(named(text, "button-name", "g0").sameName).toEqual({ state: "available", count: 1 });
});

// 5. propellr-redaction/1.
test("redaction replaces each pattern with a typed placeholder, deterministically", () => {
  const cases: [string, string][] = [
    [
      "See https://example.com/path?token=abc#top now",
      "See https://example.com/path[query][fragment] now",
    ],
    ["Docs at https://example.com/guide#install", "Docs at https://example.com/guide[fragment]"],
    ["Contact jane.doe@example.co.uk", "Contact [email]"],
    ["Mail ADMIN@Example.ORG today", "Mail [email] today"],
    ["Call +1 555 123 4567", "Call [phone]"],
    ["Call (555) 123-4567 now", "Call [phone] now"],
    ["Dial 555.123.4567", "Dial [phone]"],
    ["Order 12345678", "Order [digits]"],
    ["Ref +15551234567", "Ref [phone]"],
    ["Key a1b2c3d4e5f6g7h8i9j0k1l2", "Key [token]"],
    ["Hash deadbeefdeadbeefdeadbeef", "Hash [token]"],
    ["Session abc_DEF-123/456+789=xyz0", "Session [token]"],
    // Overlaps: the query rule runs first, then email inside a retained path.
    ["https://x.com/p?email=a@b.com&phone=5551234567", "https://x.com/p[query]"],
    ["https://x.com/u/jane@example.com", "https://x.com/u/[email]"],
    // Non-ASCII local parts and labels; a suffix ends before the next letter only.
    ["Write müller@example.de", "Write [email]"],
    ["Shop x@bücher.de", "Shop [email]"],
    ["jane@example.com-x", "[email]-x"],
    ["jane@example.com1", "[email]1"],
    ["a@b.cc1234567", "[email][digits]"],
  ];
  for (const [input, expected] of cases) {
    expect(redactText(input), input).toEqual({ value: expected, changed: true });
    // Idempotent: placeholders are never reclassified.
    expect(redactText(expected), expected).toEqual({ value: expected, changed: false });
  }
  for (const plain of [
    "Save",
    "Next page",
    "Settings",
    "Close dialog",
    "Page 2 of 10",
    "2024 annual report",
    "Call 555-12",
    "123456",
    "user@localhost",
    "internationalization-localization",
    "Envoyer le formulaire",
    "送信する",
    "Ελληνικά",
    "Größe ändern",
    "Ссылка на отчёт",
  ])
    expect(redactText(plain), plain).toEqual({ value: plain, changed: false });
  // Idempotence over generated mixtures of every pattern's building blocks.
  const pieces =
    "a Z ü é 7 1234 5551234 @ . - + ( ) ? # / _ = : https:// http:// x.co b.cc ex.com [email] [digits] ab12cd34 deadbeef"
      .split(" ")
      .concat(" ");
  let seed = 0x2f6e2b1;
  const random = () => (seed = (Math.imul(seed, 1_103_515_245) + 12_345) >>> 0) / 2 ** 32;
  for (let run = 0; run < 5000; run++) {
    let probe = "";
    while (probe.length < 1 + random() * 150) probe += pieces[Math.floor(random() * pieces.length)];
    const once = redactText(probe.slice(0, 160)).value;
    expect(redactText(once), JSON.stringify(probe)).toEqual({ value: once, changed: false });
  }
  // Bounded strings with adversarial shapes finish promptly.
  const started = performance.now();
  for (const probe of [
    `${"a".repeat(159)}@`,
    `${"1 ".repeat(80)}`,
    `${"a.".repeat(80)}`,
    `https://${"a".repeat(152)}`,
    `${"+(".repeat(80)}`,
  ])
    redactText(probe);
  expect(performance.now() - started).toBeLessThan(100);
});

test("essential-text redaction disables a target; basename-only disables the filename question", async () => {
  const html = namingDocument(`<main><h2>Support</h2>
    <div><p>Questions? <a id="r-email" href="#">Email jane@example.com</a></p></div>
    <p>Call +1 555 123 4567 <button id="r-context">Call us</button></p>
    <div><img id="r-basename" alt="Team" src="/photos/a1b2c3d4e5f6a7b8c9d0e1f2a3b4.jpg"></div>
    <div><button id="r-plain">Save</button></div>
  </main>`);
  const { text } = await run(html);
  expect(at(text, "link-name", "r-email")).toMatchObject({
    name: { state: "available", value: "Email [email]" },
    redacted: ["name"],
    review: { state: "redacted-unavailable", reason: "essential-text-redacted" },
  });
  expect(at(text, "button-name", "r-context")).toMatchObject({
    container: { state: "available", value: "Call [phone]" },
    redacted: ["container"],
    review: { state: "redacted-unavailable", reason: "essential-text-redacted" },
  });
  expect(at(text, "image-alt", "r-basename")).toMatchObject({
    image: { basename: { state: "available", value: "[token].jpg" } },
    redacted: ["basename"],
    review: { state: "available", filename: "unavailable" },
  });
  // A redacted counted name disables same-name distinguishability for the population.
  expect(at(text, "button-name", "r-plain")).toMatchObject({
    sameName: { state: "unavailable", reason: "name-redacted" },
    redacted: [],
    review: { state: "available", filename: "not-applicable", distinguishable: "unavailable" },
  });
  expect(text.state === "available" && text.redaction).toEqual({
    version: "propellr-redaction/1",
  });
  expect(JSON.stringify(text)).not.toMatch(/jane@|555 123|a1b2c3d4/);
});

test("a replacement that expands a string past 160 units makes the sidecar unavailable", async () => {
  const label = Array.from({ length: 22 }, () => "a@b.cc").join(" ");
  expect(label.length).toBeLessThanOrEqual(160);
  const { scan, text } = await run(
    namingDocument(`<button id="x" aria-label="${label}"></button>`),
    {
      rules: ["button-name"],
    },
  );
  expect(outcome(scan, "button-name", "x")).toBe("pass");
  expect(text).toMatchObject({ state: "unavailable", reason: { code: "text-capture-limit" } });
  expect(JSON.stringify(text)).not.toContain("a@b.cc");
});

// 6. Strict host validation, stale transfer, cancellation and navigation.
test("host validation fails closed and never echoes page text", async () => {
  const { context, target } = await open(
    namingDocument(
      '<main><h2>Orders</h2><p>Recent <button id="ok">Refresh list</button></p><input type="button" id="v" value="Caption"></main>',
    ),
  );
  try {
    const { result, text } = await collectScan(
      target,
      request(target, seven),
      scanContext,
      new AbortController().signal,
      target.documentId,
      { bridge: "propellr-bridge/1", text: "propellr-text-capture/1" },
    );
    expect(bindTextCapture(result, text).state).toBe("available");
    const capture = structuredClone(text) as {
      targets: Record<string, unknown>[];
      [key: string]: unknown;
    };
    const first = capture.targets[0]!;
    const named = capture.targets.find(
      (record) => (record["name"] as { state: string }).state === "available",
    )!;
    const mutated: [string, unknown][] = [
      ["unknown field", { ...capture, extra: 1 }],
      ["collector version", { ...capture, collector: { id: "semantic-text", version: "2" } }],
      ["unknown check", { ...capture, targets: [{ ...first, check: "made-up" }] }],
      ["duplicate record", { ...capture, targets: [first, first, ...capture.targets.slice(1)] }],
      ["dropped record", { ...capture, targets: capture.targets.slice(1) }],
      [
        "zero count",
        { ...capture, targets: [{ ...named, sameName: { state: "available", count: 0 } }] },
      ],
      [
        "count over bound",
        { ...capture, targets: [{ ...named, sameName: { state: "available", count: 97 } }] },
      ],
      [
        "string over bound",
        {
          ...capture,
          targets: [{ ...named, name: { state: "available", value: "x".repeat(161) } }],
        },
      ],
      [
        "foreign target",
        {
          ...capture,
          targets: [
            {
              ...named,
              target: {
                ...(named["target"] as object),
                path: [{ kind: "element", selector: "#nope" }],
              },
            },
            ...capture.targets.filter((record) => record !== named),
          ],
        },
      ],
      [
        "value check with text",
        {
          ...capture,
          targets: capture.targets.map((record) =>
            record["check"] === "non-empty-value"
              ? { ...record, name: { state: "available", value: "Caption" } }
              : record,
          ),
        },
      ],
      [
        "unexpected diagnostic text",
        { ...capture, gaps: [{ code: "text-selection-incomplete", message: "Refresh list" }] },
      ],
      ["wrong discriminant", { ...capture, state: "complete" }],
    ];
    for (const [label, value] of mutated) {
      const bound = bindTextCapture(result, value);
      expect(bound, label).toMatchObject({
        state: "unavailable",
        reason: { code: "text-capture-invalid" },
        scan: { id: result.id, epoch: result.epoch },
      });
      expect(JSON.stringify(bound), label).not.toMatch(/Refresh|Caption|Orders|Recent|nope/);
    }
    expect(bindTextCapture(result, undefined)).toMatchObject({
      state: "unavailable",
      reason: { code: "text-capture-unavailable" },
    });
    const stale: ScanResult = {
      ...result,
      coverage: { state: "stale", gaps: [{ code: "scan-stale", message: "changed" }] },
    };
    expect(bindTextCapture(stale, text)).toMatchObject({
      state: "unavailable",
      reason: { code: "text-capture-stale" },
    });
    // A capture bound to an older epoch's scan does not match a newer scan's identity.
    const newer = await collectScan(
      target,
      request(target, ["button-name"]),
      scanContext,
      new AbortController().signal,
      target.documentId,
      { bridge: "propellr-bridge/1", text: "propellr-text-capture/1" },
    );
    expect(bindTextCapture(newer.result, text)).toMatchObject({
      state: "unavailable",
      reason: { code: "text-capture-invalid" },
    });
  } finally {
    await target.release();
    await context.close();
  }
});

test("stale transfer, cancellation and navigation never attach text to newer state", async () => {
  const { context, page, target } = await open(
    namingDocument('<main><button id="n0">First action</button></main>'),
  );
  const registry = new ComponentRegistry([]);
  const scan = (signal = new AbortController().signal, expected = target.documentId) =>
    scanComponents(target, request(target, seven), scanContext, signal, registry, expected, {
      text: true,
    });
  try {
    expect((await scan()).text?.state).toBe("available");
    // A mutation after collection but before transfer confirmation stales the scan.
    const evaluate = page.evaluate.bind(page);
    let calls = 0;
    const spy = vi.spyOn(page, "evaluate").mockImplementation(async (...args) => {
      const result = await evaluate(...args);
      if (++calls === 1)
        await evaluate("document.getElementById('n0').setAttribute('data-touched', '1')");
      return result;
    });
    const stale = await scan().finally(() => spy.mockRestore());
    expect(stale.scan.coverage.state).toBe("stale");
    expect(stale.text).toMatchObject({
      state: "unavailable",
      reason: { code: "text-capture-stale" },
      scan: { id: stale.scan.id, epoch: stale.scan.epoch },
    });
    expect(JSON.stringify(stale.text)).not.toContain("First action");
    const cancelled = new AbortController();
    cancelled.abort();
    await expect(scan(cancelled.signal)).rejects.toThrow("scan-cancelled");
    const previous = target.documentId;
    await page.goto(fixtureUrl, { waitUntil: "load" });
    await expect(scan(undefined, previous)).rejects.toThrow("scan-document-changed");
    const fresh = await scan();
    expect(fresh.text).toMatchObject({
      state: "available",
      scan: { documentId: target.documentId },
    });
  } finally {
    await target.release();
    await context.close();
  }
});
