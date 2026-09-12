// Original controlled fixtures. Expectations authored before reference execution.
export const fixtureUrl = "http://slice.invalid/case";
export const frameUrl = "http://slice.invalid/frame";
export const deniedUrl = "http://denied.invalid/frame";
const style = `<style>[hidden]{display:none!important}body{margin:32px;font-family:Arial,sans-serif}button{display:block;box-sizing:border-box;width:80px;height:32px;margin:16px 0;padding:0;border:0;font-size:12px} .small{width:20px;height:20px;font-size:8px;margin:0} .pair{display:flex;gap:2px;margin-bottom:30px}iframe{width:400px;height:260px;border:0} </style>`;
const doc = (body: string) =>
  `<!doctype html><html lang="en"><meta charset="utf-8"><title>Slice fixture</title>${style}<body>${body}</body></html>`;
export interface Fixture {
  readonly id: string;
  readonly html: string;
  readonly frames?: Readonly<Record<string, string>>;
  readonly expected: Readonly<Record<string, readonly string[]>>;
  readonly unsupported?: string;
  readonly incomplete?: Readonly<Record<string, readonly string[]>>;
  readonly allowedMismatches?: readonly string[];
}
export const fixtures: readonly Fixture[] = [
  {
    id: "naming",
    html: doc(
      `<main><button id="empty"></button><button id="text">Save</button><button id="aria" aria-label="Save"></button><span id="label" hidden>Hidden name</span><button id="ref" aria-labelledby="label"></button><button id="missing" aria-labelledby="absent"></button><button id="title" title="Save"></button><label for="labelled">Save</label><button id="labelled"></button><label>Wrap<button id="wrapped"></button></label><button id="hidden" hidden></button><button id="disabled" disabled>Save</button></main>`,
    ),
    expected: { "button-name": ["#empty", "#missing"] },
  },
  {
    id: "geometry",
    html: doc(
      `<main><button id="boundary" style="width:24px;height:24px">A</button><button id="rounding" style="width:23.96px;height:24px">B</button><div class="pair"><button class="small" id="close-a">A</button><button class="small" id="close-b">B</button></div><button class="small" id="isolated">I</button></main>`,
    ),
    expected: { "target-size": ["#close-a", "#close-b"] },
  },
  {
    id: "missing-main",
    html: doc(`<button id="named">Save</button>`),
    expected: { "landmark-one-main": ["html"] },
  },
  { id: "two-mains", html: doc(`<main id="one"></main><main id="two"></main>`), expected: {} },
  { id: "inapplicable", html: doc(`<main></main>`), expected: {} },
  {
    id: "shadow",
    html: doc(
      `<main><div id="host"></div></main><script>const a=document.querySelector('#host').attachShadow({mode:'open'});a.innerHTML='<div id="nested"></div>';a.querySelector('#nested').attachShadow({mode:'open'}).innerHTML='<style>button{display:block;width:80px;height:32px;margin:20px}</style><span id="label">Save</span><button id="named" aria-labelledby="label"></button><button id="empty"></button>';</script>`,
    ),
    expected: { "button-name": ["#host / #nested / #empty"] },
  },
  {
    id: "slot",
    html: doc(
      `<main><div id="slot-host"><button id="slotted" aria-labelledby="external"></button><button id="slot-empty"></button></div><span id="external">Save</span></main><script>document.querySelector('#slot-host').attachShadow({mode:'open'}).innerHTML='<slot></slot>';</script>`,
    ),
    expected: { "button-name": ["#slot-empty"] },
  },
  {
    id: "frames",
    html: doc(`<iframe id="child" src="${frameUrl}" title="Child"></iframe>`),
    frames: {
      [frameUrl]: doc(
        `<main><button id="empty"></button><iframe id="nested" src="http://slice.invalid/nested" title="Nested"></iframe></main>`,
      ),
      "http://slice.invalid/nested": doc(`<button id="nested-name">Save</button>`),
    },
    expected: { "button-name": ["#child / #empty"] },
  },
  {
    id: "denied-frame",
    html: doc(`<main><iframe id="denied" src="${deniedUrl}" title="Denied"></iframe></main>`),
    frames: { [deniedUrl]: doc(`<button id="secret"></button>`) },
    expected: {},
    unsupported:
      "Cross-origin frame deliberately not injected by either harness; Propellr exposes frame-unavailable. Canonical selected rules do not guarantee frame coverage diagnostics.",
  },
  {
    id: "denied-no-main",
    html: doc(`<iframe id="denied" src="${deniedUrl}" title="Denied"></iframe>`),
    frames: { [deniedUrl]: doc(`<main></main>`) },
    expected: {},
    incomplete: { "landmark-one-main": ["html"] },
    allowedMismatches: ["landmark-one-main:html"],
    unsupported:
      "Missing main cannot be established when denied frame might contain it; reference selected rules can report a top-document violation without inspecting that frame.",
  },
  {
    id: "negative-tabindex",
    incomplete: { "target-size": ["#negative", "#neighbor"] },
    html: doc(
      `<main><div class="pair"><button class="small" id="negative" tabindex="-1">A</button><button class="small" id="neighbor">B</button></div></main>`,
    ),
    expected: {},
    unsupported:
      "Non-tabbable small target or neighbor produces incomplete evidence, not a violation or pass.",
  },
  {
    id: "generated-name",
    incomplete: { "button-name": ["#generated"] },
    allowedMismatches: ["button-name:#generated"],
    html: doc(
      `<style>#generated::before{content:'Save'}</style><main><button id="generated"></button></main>`,
    ),
    expected: {},
    unsupported:
      "CSS-generated naming not implemented: explicit incomplete instead of reference pass.",
  },
  {
    id: "overlap",
    incomplete: { "target-size": ["#under", "#over"] },
    allowedMismatches: ["target-size:#under", "target-size:#over"],
    html: doc(
      `<main><div style="position:relative;height:100px"><button id="under">A</button><button id="over" style="position:absolute;top:0;left:0">B</button></div></main>`,
    ),
    expected: {},
    unsupported:
      "Obscured geometry not implemented: explicit incomplete instead of canonical obscuration handling.",
  },
];
export const benchmarkFixtures: readonly Fixture[] = [
  fixtures.find((fixture) => fixture.id === "geometry")!,
  {
    id: "dense",
    html: doc(
      `<main style="display:grid;grid-template-columns:repeat(8,80px);gap:16px">${Array.from({ length: 40 }, (_, index) => `<button id="dense-${index}" style="margin:0">${index % 5 ? "Save" : ""}</button>`).join("")}</main>`,
    ),
    expected: { "button-name": Array.from({ length: 8 }, (_, index) => `#dense-${index * 5}`) },
  },
  fixtures.find((fixture) => fixture.id === "shadow")!,
  fixtures.find((fixture) => fixture.id === "frames")!,
];
export const dynamicHtml = doc(
  `<main><span id="label">Save</span><button id="dynamic" aria-labelledby="label"></button><p id="unrelated">Unrelated</p></main>`,
);
