// Offline, self-contained labeling page for the two human adjudicators. No network, no oracle:
// cases carry only what the uninstrumented page shows (a screenshot, markup and the chain).
import type { SheetCase } from "./component-labels.js";
import { causes, labelSchemaId, memberships } from "./component-labels.js";

export interface PageCase extends SheetCase {
  // JPEG data URI of the rendered page around the target, with the target and ancestors marked.
  readonly image: string | null;
  // Enlarged view of the nearest ancestor, with its natural size in CSS pixels.
  readonly closeup: {
    readonly src: string;
    readonly width: number;
    readonly height: number;
  } | null;
  // Markup of the outermost visible ancestor; [start, end) marks the target's own markup.
  readonly snippet: { readonly text: string; readonly start: number; readonly end: number };
}
export interface SheetPage {
  readonly sheet: string;
  readonly generatedAt: string;
  readonly cases: readonly PageCase[];
}

// JSON inside <script> must never close the element or open a comment.
const embed = (value: unknown) =>
  JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");

export function renderSheet(sheet: SheetPage): string {
  const config = { labelSchemaId, memberships, causes };
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'">
<title>Component labeling sheet</title>
<style>
:root {
  --bg: #f7f7f5; --panel: #ffffff; --ink: #1d1d1b; --muted: #5d5d58; --line: #d9d8d2;
  --accent: #1f5fbf; --accent-ink: #ffffff; --target: #c62828; --done: #2e7d32; --warn: #a15c00;
  --mark: #ffe08a; --code: #f0efe9;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #161615; --panel: #1f1f1d; --ink: #ecebe6; --muted: #a8a79f; --line: #3a3a36;
    --accent: #7fb0ff; --accent-ink: #0d1b2e; --target: #ff7a7a; --done: #7bd08a; --warn: #f0b35a;
    --mark: #6b5510; --code: #262623;
  }
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink);
  font: 15px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
header { position: sticky; top: 0; z-index: 2; background: var(--panel); border-bottom: 1px solid var(--line);
  padding: 10px 16px; display: flex; flex-wrap: wrap; gap: 10px 16px; align-items: center; }
header h1 { font-size: 16px; margin: 0; }
header .grow { flex: 1; }
input[type=text], textarea { font: inherit; color: var(--ink); background: var(--bg);
  border: 1px solid var(--line); border-radius: 6px; padding: 5px 8px; }
button { font: inherit; border-radius: 6px; border: 1px solid var(--line); background: var(--panel);
  color: var(--ink); padding: 5px 10px; cursor: pointer; }
button.primary { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
main { max-width: 1100px; margin: 0 auto; padding: 16px; }
.intro, .case { background: var(--panel); border: 1px solid var(--line); border-radius: 10px;
  padding: 16px; margin-bottom: 16px; }
.intro h2 { margin-top: 0; font-size: 18px; }
nav.pages { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
nav.pages button[aria-current=true] { border-color: var(--accent); outline: 2px solid var(--accent); }
.case h3 { margin: 0 0 8px; font-size: 15px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.status { font-size: 12px; padding: 1px 8px; border-radius: 99px; border: 1px solid currentColor; }
.status.done { color: var(--done); } .status.todo, .status.copied { color: var(--warn); }
.shot { max-width: 100%; height: auto; border: 1px solid var(--line); border-radius: 6px; display: block; }
.grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; margin-top: 12px; }
@media (max-width: 760px) { .grid { grid-template-columns: minmax(0, 1fr); } }
fieldset { border: 1px solid var(--line); border-radius: 8px; margin: 0 0 12px; padding: 8px 12px; }
legend { font-weight: 600; padding: 0 4px; }
label.opt { display: block; padding: 2px 0; }
.hint { color: var(--muted); font-size: 13px; }
.part { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background: var(--code);
  padding: 1px 6px; border-radius: 4px; }
pre { background: var(--code); padding: 10px; border-radius: 6px; overflow-x: auto; max-height: 280px;
  font-size: 12px; white-space: pre-wrap; word-break: break-all; }
mark { background: var(--mark); color: inherit; }
table { border-collapse: collapse; font-size: 13px; width: 100%; }
td, th { border-bottom: 1px solid var(--line); padding: 3px 6px; text-align: left; }
.legend-target { color: var(--target); font-weight: 600; }
.legend-ancestor { color: var(--accent); font-weight: 600; }
.row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
</style>
</head>
<body>
<header>
  <h1>Component labeling</h1>
  <label>Your name <input type="text" id="labeler" maxlength="64" autocomplete="name" placeholder="required to export"></label>
  <span id="progress" class="hint"></span>
  <span class="grow"></span>
  <label class="hint"><input type="checkbox" id="unanswered"> Only unanswered</label>
  <button type="button" id="import">Load saved file</button>
  <button type="button" id="export" class="primary">Export labels</button>
  <input type="file" id="file" accept="application/json,.json" hidden>
</header>
<main>
  <section class="intro">
    <h2>How to label</h2>
    <p>Each case is one element that failed an accessibility check, shown in its rendered page:
    <span class="legend-target">red</span> marks the element, <span class="legend-ancestor">blue</span>
    boxes numbered A1, A2, … mark its ancestors (A1 is the parent). For each case answer:</p>
    <ol>
      <li><b>Component.</b> Which element is the root of the reusable component instance (such as one
      product card or one shared button) that renders the red element? Pick the red element itself if it is
      a reusable component on its own, <i>Not part of a reusable component</i> if none applies, or
      <i>Can't tell</i>.</li>
      <li><b>Component name.</b> A short name you make up (for example <i>product card</i>). Use the same
      name for every case you believe comes from the same component on that page; names only need to be
      consistent within a page.</li>
      <li><b>Cause.</b> Is the problem built into the shared component, so every instance would have it
      (<i>template</i>), or specific to this one instance's content or usage (<i>instance</i>)?</li>
    </ol>
    <p class="hint">Work alone: do not compare answers with the other labeler until both of you have
    exported. Your answers are saved in this browser as you go; export when you are done and send the file
    back. Answers copied with “Copy to identical cases” are marked as copied in the export; check each one.</p>
    <p class="hint">Sheet <code id="sheet-id"></code>, generated <span id="generated"></span>.</p>
  </section>
  <nav class="pages" id="pages" aria-label="Pages"></nav>
  <div id="cases"></div>
</main>
<script type="application/json" id="data">${embed({ ...sheet, config })}</script>
<script>
"use strict";
const data = JSON.parse(document.getElementById("data").textContent);
const { cases, sheet, config } = data;
const storageKey = "propellr-labels:" + sheet;
const state = { labeler: "", labels: {}, page: cases[0] ? cases[0].page : "" };
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
  if (saved && typeof saved === "object") Object.assign(state, saved);
} catch {}
const save = () => { try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch {} };
const el = (tag, props, ...children) => {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (key === "class") node.className = value;
    else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
    else if (value !== undefined && value !== null && value !== false) node.setAttribute(key, value === true ? "" : value);
  }
  for (const child of children.flat()) if (child !== null && child !== undefined)
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  return node;
};
const pages = [...new Set(cases.map((c) => c.page))];
const structure = (c) => JSON.stringify(c.chain.map((l) => [l.label, l.shape, l.repeats]));
const complete = (label) => Boolean(label && label.membership && label.cause &&
  (label.membership === "none" || label.membership === "cannot-tell" || label.component.trim()));
const partFor = (c, membership) => {
  if (membership === "target") return "(the component root itself)";
  const match = /^ancestor-(\\d)$/.exec(membership || "");
  if (!match) return "";
  const distance = Number(match[1]);
  return c.chain.filter((l) => l.distance < distance).map((l) => l.label).reverse().join(" > ");
};
const labelFor = (id) => state.labels[id] || (state.labels[id] = { membership: "", component: "", cause: "", notes: "", bulk: false });

function progress() {
  const done = cases.filter((c) => complete(state.labels[c.id])).length;
  document.getElementById("progress").textContent = done + " of " + cases.length + " complete";
}
function renderPages() {
  const nav = document.getElementById("pages");
  nav.replaceChildren(...pages.map((page) => {
    const inPage = cases.filter((c) => c.page === page);
    const done = inPage.filter((c) => complete(state.labels[c.id])).length;
    return el("button", { type: "button", "aria-current": page === state.page ? "true" : "false",
      onclick: () => { state.page = page; save(); render(); window.scrollTo(0, 0); } },
      "Page " + page + " (" + done + "/" + inPage.length + ")");
  }));
}
function membershipOptions(c) {
  const options = [["target", "The red element itself"]];
  for (const link of c.chain) if (link.distance > 0)
    options.push(["ancestor-" + link.distance, "A" + link.distance + " · <" + link.label + "> · this structure appears " + link.repeats + "× on the page"]);
  options.push(["none", "Not part of a reusable component"], ["cannot-tell", "Can't tell"]);
  return options;
}
function caseCard(c, index, total) {
  const label = labelFor(c.id);
  const status = el("span", { class: "status " + (complete(label) ? "done" : "todo") }, complete(label) ? "done" : "to do");
  const part = el("span", { class: "part" }, partFor(c, label.membership) || "—");
  const names = [...new Set(cases.filter((o) => o.page === c.page).map((o) => (state.labels[o.id] || {}).component).filter(Boolean))];
  const listId = "names-" + c.page;
  const update = () => {
    label.bulk = false;
    save();
    status.className = "status " + (complete(label) ? "done" : "todo");
    status.textContent = complete(label) ? "done" : "to do";
    part.textContent = partFor(c, label.membership) || "—";
    progress(); renderPages();
  };
  const radio = (name, value, text, current, set) => el("label", { class: "opt" },
    el("input", { type: "radio", name: name + "-" + c.id, value, checked: current === value,
      onchange: () => { set(value); update(); } }), " ", text);
  const snippet = c.snippet;
  const pre = el("pre", {}, snippet.text.slice(0, snippet.start),
    el("mark", {}, snippet.text.slice(snippet.start, snippet.end)), snippet.text.slice(snippet.end));
  const same = cases.filter((o) => o.page === c.page && o.id !== c.id && structure(o) === structure(c));
  const copy = el("button", { type: "button", onclick: () => {
    if (!complete(label)) { alert("Answer this case first."); return; }
    let copied = 0;
    for (const other of same) {
      if (complete(state.labels[other.id])) continue;
      state.labels[other.id] = { ...label, notes: "", bulk: true };
      copied++;
    }
    save(); render();
    alert(copied + " unanswered identical case(s) filled. They are marked as copied; review each one.");
  } }, "Copy to " + same.length + " identical case(s) on this page");
  return el("article", { class: "case", id: c.id },
    el("h3", {}, "Page " + c.page + " · case " + (index + 1) + " of " + total, status,
      label.bulk ? el("span", { class: "status copied" }, "copied, check it") : null),
    el("div", { class: "hint" }, "Failed check" + (c.rules.length > 1 ? "s" : "") + ": " + c.rules.join(", ")),
    c.image ? el("img", { class: "shot", src: c.image, alt: "Rendered page around the element; the element is outlined in red and its ancestors in numbered blue boxes" })
      : el("p", { class: "hint" }, "No screenshot could be taken for this case; use the markup below."),
    c.closeup ? el("details", {}, el("summary", {}, "Close-up (enlarged)"),
      el("img", { class: "shot", src: c.closeup.src, width: String(Math.min(2 * c.closeup.width, 960)),
        alt: "Enlarged view of the element and its nearest ancestor" })) : null,
    el("div", { class: "grid" },
      el("div", {},
        el("fieldset", {}, el("legend", {}, "1. Component root"),
          membershipOptions(c).map(([value, text]) => radio("m", value, text, label.membership, (v) => { label.membership = v; }))),
        el("p", {}, "Part within the component: ", part),
        el("fieldset", {}, el("legend", {}, "2. Component name"),
          el("input", { type: "text", maxlength: "64", list: listId, value: label.component,
            placeholder: "e.g. product card", oninput: (event) => { label.component = event.target.value; update(); } }),
          el("datalist", { id: listId }, names.map((name) => el("option", { value: name }))),
          el("div", { class: "hint" }, "Leave empty if not part of a component.")),
        el("fieldset", {}, el("legend", {}, "3. Cause"),
          radio("c", "template", "Template: every instance of the component would have it", label.cause, (v) => { label.cause = v; }),
          radio("c", "instance", "Instance: specific to this instance's content or usage", label.cause, (v) => { label.cause = v; }),
          radio("c", "cannot-tell", "Can't tell", label.cause, (v) => { label.cause = v; })),
        el("label", {}, "Notes (optional)", el("br"),
          el("textarea", { rows: "2", maxlength: "500", style: "width:100%",
            oninput: (event) => { label.notes = event.target.value; save(); } }, label.notes)),
        same.length ? el("div", { class: "row" }, copy) : null),
      el("div", {},
        el("table", {}, el("thead", {}, el("tr", {}, el("th", {}, "Mark"), el("th", {}, "Element"), el("th", {}, "Same structure on page"))),
          el("tbody", {}, c.chain.map((l) => el("tr", {}, el("td", {}, l.distance === 0 ? "red" : "A" + l.distance),
            el("td", {}, "<" + l.label + ">"), el("td", {}, l.repeats + "×"))))),
        el("details", {}, el("summary", {}, "Markup (element highlighted)"), pre))));
}
function render() {
  document.getElementById("labeler").value = state.labeler;
  const onlyOpen = document.getElementById("unanswered").checked;
  const inPage = cases.filter((c) => c.page === state.page);
  document.getElementById("cases").replaceChildren(...inPage
    .map((c, index) => [c, index])
    .filter(([c]) => !onlyOpen || !complete(state.labels[c.id]))
    .map(([c, index]) => caseCard(c, index, inPage.length)));
  renderPages(); progress();
}
document.getElementById("sheet-id").textContent = sheet.slice(0, 12);
document.getElementById("generated").textContent = data.generatedAt;
document.getElementById("labeler").addEventListener("input", (event) => { state.labeler = event.target.value; save(); });
document.getElementById("unanswered").addEventListener("change", render);
document.getElementById("export").addEventListener("click", () => {
  const labeler = state.labeler.trim();
  if (!labeler) { alert("Enter your name first."); document.getElementById("labeler").focus(); return; }
  const labels = cases.filter((c) => complete(state.labels[c.id])).map((c) => {
    const l = state.labels[c.id];
    // A case outside any component carries no component name, even if one was typed earlier.
    const outside = l.membership === "none" || l.membership === "cannot-tell";
    return { id: c.id, membership: l.membership, component: outside ? "" : l.component.trim(), cause: l.cause, notes: l.notes, bulk: Boolean(l.bulk) };
  });
  if (labels.length < cases.length && !confirm(labels.length + " of " + cases.length + " cases are complete. Export anyway?")) return;
  const body = JSON.stringify({ schema: config.labelSchemaId, sheet, labeler, exportedAt: new Date().toISOString(), labels }, null, 2);
  const link = el("a", { href: URL.createObjectURL(new Blob([body], { type: "application/json" })),
    download: "labels-" + labeler.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + sheet.slice(0, 8) + ".json" });
  document.body.append(link); link.click(); link.remove();
});
document.getElementById("import").addEventListener("click", () => document.getElementById("file").click());
document.getElementById("file").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file) return;
  try {
    const set = JSON.parse(await file.text());
    if (set.schema !== config.labelSchemaId || set.sheet !== sheet) throw new Error("This file belongs to a different sheet.");
    const ids = new Set(cases.map((c) => c.id));
    // Validate the whole file first, then replace this browser's answers with it: answers saved
    // here from another session must never be exported under the loaded labeler's name.
    const loaded = {};
    for (const l of set.labels) {
      if (!ids.has(l.id) || loaded[l.id] || !config.memberships.includes(l.membership) || !config.causes.includes(l.cause)) throw new Error("Unexpected case or answer in file.");
      loaded[l.id] = { membership: l.membership, component: String(l.component), cause: l.cause, notes: String(l.notes), bulk: Boolean(l.bulk) };
    }
    if (!confirm("Replace the answers saved in this browser with the " + set.labels.length + " answers in this file?")) return;
    state.labels = loaded;
    state.labeler = String(set.labeler);
    save(); render();
  } catch (error) { alert("Could not load: " + error.message); }
});
render();
</script>
</body>
</html>
`;
}
