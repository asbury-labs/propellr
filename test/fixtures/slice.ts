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
  readonly mainPresence?: { readonly present: boolean; readonly modal: boolean };
  readonly unsupported?: string;
  readonly incomplete?: Readonly<Record<string, readonly string[]>>;
  readonly allowedMismatches?: readonly string[];
}
export const fixtures: readonly Fixture[] = [
  {
    id: "naming",
    html: doc(
      `<main><button id="empty"></button><button id="text">Save</button><button id="aria" aria-label="Save"></button><span id="label" hidden>Hidden name</span><button id="ref" aria-labelledby="label"></button><button id="missing" aria-labelledby="absent"></button><button id="title" title="Save"></button><label for="labelled">Save</label><button id="labelled"></button><label>Wrap<button id="wrapped"></button></label><button id="hidden" hidden></button><button id="disabled" disabled>Save</button><button id="redundant-role" role="button">Save</button><button id="descendant-label"><span aria-label="Save"></span></button></main>`,
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
    mainPresence: { present: false, modal: false },
    html: doc(`<button id="named">Save</button>`),
    expected: { "landmark-one-main": ["html"] },
  },
  { id: "two-mains", html: doc(`<main id="one"></main><main id="two"></main>`), expected: {} },
  { id: "inapplicable", html: doc(`<main></main>`), expected: {} },
  {
    id: "modal-main-exception",
    html: doc(
      `<dialog id="modal"><button id="modal-close">Close</button></dialog><button id="outside"></button><script>document.querySelector('#modal').showModal()</script>`,
    ),
    expected: {},
  },
  {
    id: "modal-shadow",
    html: doc(
      `<dialog id="modal"><div id="modal-host"></div></dialog><script>document.querySelector('#modal-host').attachShadow({mode:'open'}).innerHTML='<style>button{display:block;width:80px;height:32px;margin:16px}</style><button id="shadow-empty"></button><button id="shadow-named">Save</button>';document.querySelector('#modal').showModal()</script>`,
    ),
    expected: { "button-name": ["#modal-host / #shadow-empty"] },
  },
  {
    id: "shadow-rooted-modal",
    html: doc(
      `<main><div id="shadow-modal-host"></div></main><script>const root=document.querySelector('#shadow-modal-host').attachShadow({mode:'open'});root.innerHTML='<dialog id="dialog"><button id="inside" style="width:80px;height:32px"></button></dialog>';root.querySelector('dialog').showModal()</script>`,
    ),
    expected: {},
    allowedMismatches: [
      "button-name:#shadow-modal-host / #inside",
      "target-size:#shadow-modal-host / #inside",
      "landmark-one-main:html",
    ],
    unsupported:
      "Native modal rooted inside shadow DOM has unsupported document-level visibility semantics; selected rules are not evaluated.",
  },
  {
    id: "role-dialog-main-exception",
    mainPresence: { present: true, modal: true },
    html: doc(`<div role="dialog"><button id="dialog-close">Close</button></div>`),
    expected: {},
  },
  {
    id: "non-modal-dialog-exception",
    html: doc('<dialog open><button id="non-modal-close">Close</button></dialog>'),
    expected: {},
    mainPresence: { present: true, modal: true },
  },
  {
    id: "aria-command-not-native-button",
    html: doc(
      `<main><div id="role-button" role="button" tabindex="0" style="width:80px;height:32px"></div><div id="unfocusable-role-button" role="button" style="width:80px;height:32px"></div><div id="editable" contenteditable="true" style="width:20px;height:20px">A</div></main>`,
    ),
    expected: {},
  },
  {
    id: "role-token-list",
    html: doc(
      '<main><div id="fallback-role" role="button menuitem" tabindex="0" style="width:80px;height:32px">Save</div><div id="padded-role" role=" button " tabindex="0" style="width:80px;height:32px">Save</div></main>',
    ),
    expected: {},
    allowedMismatches: [
      "target-size:#fallback-role",
      "target-size:#padded-role",
      "landmark-one-main:html",
    ],
    unsupported:
      "Whitespace and fallback role-token resolution is not implemented; selected rules are explicitly not evaluated.",
  },
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
    id: "slot-text-assignment",
    html: doc(
      `<div id="slot-host">Assigned text</div><script>document.querySelector('#slot-host').attachShadow({mode:'open'}).innerHTML='<slot><main><button id="fallback-button"></button></main></slot>';</script>`,
    ),
    expected: { "landmark-one-main": ["html"] },
    mainPresence: { present: false, modal: false },
  },
  {
    id: "slot-fallback",
    html: doc(
      `<div id="slot-host"></div><script>document.querySelector('#slot-host').attachShadow({mode:'open'}).innerHTML='<style>button{width:80px;height:32px;display:block}</style><slot><main><button id="fallback-button"></button></main></slot>';</script>`,
    ),
    expected: { "button-name": ["#slot-host / #fallback-button"] },
  },
  {
    id: "frames",
    html: doc(
      `<iframe id="child" src="${frameUrl}" title="Child" style="width:600px;height:500px"></iframe>`,
    ),
    frames: {
      [frameUrl]: doc(
        `<main><button id="empty"></button><iframe id="nested" src="http://slice.invalid/nested" title="Nested"></iframe></main>`,
      ),
      "http://slice.invalid/nested": doc(`<button id="nested-name">Save</button>`),
    },
    expected: { "button-name": ["#child / #empty"] },
  },
  {
    id: "frame-dialog-exception",
    html: doc(
      `<iframe id="dialog-frame" src="${frameUrl}" title="Child" style="width:600px;height:500px"></iframe>`,
    ),
    frames: {
      [frameUrl]: doc('<div role="dialog"><button id="frame-dialog-button">Save</button></div>'),
    },
    expected: {},
    mainPresence: { present: true, modal: true },
  },
  {
    id: "parent-frame-overlay",
    html: doc(
      `<main style="position:relative"><iframe id="covered-frame" src="${frameUrl}" title="Child"></iframe><span style="position:absolute;left:40px;top:0;width:40px;height:260px;background:black"></span></main>`,
    ),
    frames: { [frameUrl]: doc('<main><button id="frame-target">Save</button></main>') },
    expected: {},
    incomplete: { "target-size": ["#covered-frame / #frame-target"] },
    allowedMismatches: ["target-size:#covered-frame / #frame-target"],
    unsupported:
      "Parent-document overlay makes the enclosing frame rectangle uncertain; child hit tests cannot establish exposure.",
  },
  {
    id: "parent-frame-clip",
    html: doc(
      `<main style="overflow:hidden;width:50px;height:100px"><iframe id="clipped-frame" src="${frameUrl}" title="Child"></iframe></main>`,
    ),
    frames: { [frameUrl]: doc('<main><button id="frame-target">Save</button></main>') },
    expected: {},
    incomplete: { "target-size": ["#clipped-frame / #frame-target"] },
    allowedMismatches: ["target-size:#clipped-frame / #frame-target"],
    unsupported:
      "Clipping ancestry prevents proof of full child target exposure; geometry remains incomplete.",
  },
  {
    id: "shadow-target-spacing",
    html: doc(
      `<main><div id="spacing-host"></div></main><script>document.querySelector('#spacing-host').attachShadow({mode:'open'}).innerHTML='<style>div{display:flex;gap:2px}button{display:block;width:20px;height:20px;border:0;padding:0;font-size:8px}</style><div><button id="small-a">A</button><button id="small-b">B</button></div>';</script>`,
    ),
    expected: { "target-size": ["#spacing-host / #small-a", "#spacing-host / #small-b"] },
  },
  {
    id: "frame-target-spacing",
    html: doc(
      `<iframe id="spacing-frame" src="${frameUrl}" title="Child" style="width:600px;height:500px"></iframe>`,
    ),
    frames: {
      [frameUrl]: doc(
        '<main><div class="pair"><button class="small" id="small-a">A</button><button class="small" id="small-b">B</button></div></main>',
      ),
    },
    expected: { "target-size": ["#spacing-frame / #small-a", "#spacing-frame / #small-b"] },
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
    mainPresence: { present: false, modal: false },
    html: doc(`<iframe id="denied" src="${deniedUrl}" title="Denied"></iframe>`),
    frames: { [deniedUrl]: doc(`<main></main>`) },
    expected: {},
    incomplete: { "landmark-one-main": ["html"] },
    allowedMismatches: ["landmark-one-main:html"],
    unsupported:
      "Missing main cannot be established when denied frame might contain it; reference selected rules can report a top-document violation without inspecting that frame.",
  },
  {
    id: "zero-sized-target",
    html: doc(
      '<main><button id="zero-target" style="width:0;height:0;padding:0;border:0;overflow:hidden">Save</button><button id="normal-target">Save</button></main>',
    ),
    expected: {},
    incomplete: { "target-size": ["#zero-target"] },
    allowedMismatches: ["target-size:#zero-target"],
    unsupported:
      "Zero-sized focusable widgets remain evaluated as incomplete, not silently inapplicable.",
  },
  {
    id: "ancestor-transform",
    html: doc(
      '<main style="transform:translateX(10px)"><button id="transformed-target">Save</button></main>',
    ),
    expected: {},
    incomplete: { "target-size": ["#transformed-target"] },
    allowedMismatches: ["target-size:#transformed-target"],
    unsupported: "Transformed composed ancestry is outside the simple rectangle geometry proof.",
  },
  {
    id: "ancestor-clip-path",
    html: doc('<main style="clip-path:inset(0)"><button id="clipped-target">Save</button></main>'),
    expected: {},
    incomplete: { "target-size": ["#clipped-target"] },
    allowedMismatches: ["target-size:#clipped-target"],
    unsupported:
      "Clip-path ancestry is outside the simple rectangle geometry proof, even for a no-op shape.",
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
    incomplete: { "button-name": ["#generated"], "target-size": ["#generated"] },
    allowedMismatches: ["button-name:#generated", "target-size:#generated"],
    html: doc(
      `<style>#generated::before{content:'Save'}</style><main><button id="generated"></button></main>`,
    ),
    expected: {},
    unsupported:
      "CSS-generated naming and pseudo-element geometry not implemented: explicit incomplete instead of reference pass.",
  },
  {
    id: "pseudo-overlay-strip",
    html: doc(
      '<style>#pseudo-container::before{content:"";position:absolute;left:20px;top:0;width:4px;height:32px;background:black}</style><main id="pseudo-container" style="position:relative"><button id="pseudo-target" style="margin:0">Save</button></main>',
    ),
    expected: {},
    incomplete: { "target-size": ["#pseudo-target"] },
    allowedMismatches: ["target-size:#pseudo-target"],
    unsupported:
      "Generated boxes have no independently measurable DOM rectangles; geometry in their document is incomplete.",
  },
  {
    id: "overlay-strip",
    html: doc(
      `<main style="position:relative"><button id="strip-target" style="margin:0">Save</button><span aria-hidden="true" style="position:absolute;left:20px;top:0;width:4px;height:32px;background:black"></span></main>`,
    ),
    expected: {},
    incomplete: { "target-size": ["#strip-target"] },
    allowedMismatches: ["target-size:#strip-target"],
    unsupported:
      "An unrelated overlapping box between hit-test samples makes geometry uncertain; no fully unobscured rectangle is claimed.",
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
