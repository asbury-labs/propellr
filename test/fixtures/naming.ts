// Original controls, reviewed against pinned check definitions before differential execution.
import { deniedUrl, frameUrl } from "./slice.js";
import type { Fixture } from "./slice.js";
import type { namingRules } from "../../src/analysis.js";
export const namingDocument = (body: string) =>
  `<!doctype html><html lang="en"><meta charset="utf-8"><title>Naming fixture</title><style>body{margin:32px;font-family:Arial,sans-serif}img{width:32px;height:32px}a,button,input,textarea{display:block;box-sizing:border-box;width:180px;min-height:32px;margin:16px 0;padding:0;border:0}iframe{width:600px;height:400px;border:0}[hidden]{display:none!important}</style><body>${body}</body></html>`;
export interface NamingFixture extends Fixture {
  readonly rule: (typeof namingRules)[number];
  readonly passes: readonly string[];
}
export const namingFixtures: readonly NamingFixture[] = [
  {
    id: "images-native",
    rule: "image-alt",
    html: namingDocument(
      `<main><img id="named" alt="Photo"><img id="decorative" alt=""><img id="missing"><img id="spaces" alt=" \t "><img id="spaces-named" alt=" " aria-label="Photo"><img id="aria" aria-label="Photo"><span id="ref-text" hidden>Photo</span><img id="reference" aria-labelledby="ref-text"><img id="bad-ref" aria-labelledby="absent"><img id="malformed" aria-labelledby="[bad"><img id="title" title="Photo"><img id="present" role="presentation"><img id="none-spaces" role="none" alt=" "><img id="global-conflict" role="none" aria-live="polite"><img id="focus-conflict" role="presentation" tabindex="-1"><img id="separator" role="separator"><img id="focus-separator" role="separator" tabindex="0"><img id="button-image" role="button"><img id="hidden" hidden></main>`,
    ),
    expected: {
      "image-alt": [
        "#missing",
        "#spaces",
        "#spaces-named",
        "#bad-ref",
        "#malformed",
        "#global-conflict",
        "#focus-conflict",
        "#focus-separator",
        "#button-image",
      ],
    },
    passes: ["#named", "#decorative", "#aria", "#reference", "#title", "#present", "#none-spaces"],
  },
  {
    id: "links-native",
    rule: "link-name",
    html: namingDocument(
      `<main><a id="text" href="#">Open</a><a id="image" href="#"><img alt="Open"></a><a id="aria" href="#" aria-label="Open"></a><a id="title" href="#" title="Open"></a><span id="ref-text">Open</span><a id="reference" href="#" aria-labelledby="ref-text"></a><a id="empty" href="#"></a><a id="negative" href="#" tabindex="-1"></a><a id="missing-ref" href="#" aria-labelledby="missing"></a><a id="hidden-content" href="#"><span hidden>Open</span></a><a id="no-href"></a><a id="hidden" href="#" hidden></a><span id="empty-ref"></span><a id="overridden" href="#" aria-labelledby="empty-ref">Open</a><a id="none" href="#" role="none"></a><a id="present" href="#" role="presentation">Open</a></main>`,
    ),
    expected: {
      "link-name": ["#empty", "#negative", "#missing-ref", "#hidden-content", "#none"],
    },
    passes: ["#text", "#image", "#aria", "#title", "#reference", "#present", "#overridden"],
  },
  {
    id: "forms-native",
    rule: "label",
    html: namingDocument(
      `<main><form><label for="explicit" id="explicit-label">Email</label><input id="explicit"><label id="wrap-label">Email<input id="wrap"></label><label id="empty-wrap-label"><textarea id="empty-wrap">Own value</textarea></label><label id="empty-explicit-label" for="empty-explicit"></label><input id="empty-explicit"><input id="missing"><textarea id="textarea" aria-label="Notes"></textarea><input id="aria" aria-label="Email"><span id="ref-text" hidden>Email</span><input id="reference" aria-labelledby="ref-text"><input id="bad-ref" aria-labelledby="absent"><input id="title" title="Email"><input id="placeholder" placeholder="Email"><input id="empty-placeholder" placeholder=" "><label id="hidden-label-source" for="hidden-label" hidden>Email</label><input id="hidden-label"><label id="hidden-with-title-source" for="hidden-with-title" hidden>Email</label><input id="hidden-with-title" title="Email"><label id="aria-hidden-label-source" for="aria-hidden-label" aria-hidden="true">Email</label><input id="aria-hidden-label"><input id="present" role="presentation" disabled><input id="present-enabled" role="none"><input id="disabled" disabled><input id="hidden-type" type="HIDDEN"><input id="button" type="button"><input id="image-type" type="image"><input id="submit" type="submit"><input id="reset" type="reset"><input id="invisible" hidden><select id="select"><option>Choose</option></select></form></main>`,
    ),
    expected: {
      label: [
        "#empty-wrap",
        "#empty-explicit",
        "#missing",
        "#bad-ref",
        "#empty-placeholder",
        "#hidden-label",
        "#aria-hidden-label",
        "#present-enabled",
        "#disabled",
      ],
    },
    passes: [
      "#explicit",
      "#wrap",
      "#textarea",
      "#aria",
      "#reference",
      "#title",
      "#placeholder",
      "#hidden-with-title",
      "#present",
    ],
  },
  ...(["image-alt", "link-name", "label"] as const).flatMap((rule): NamingFixture[] => {
    const control = (id: string, attrs = "") =>
      rule === "image-alt"
        ? `<img id="${id}" ${attrs}>`
        : rule === "link-name"
          ? `<a href="#" id="${id}" ${attrs}></a>`
          : `<input id="${id}" ${attrs}>`;
    const scopeBody = `<span id="same">Local</span>${control("named", 'aria-labelledby="same"')}${control("empty")}`;
    return [
      {
        id: `${rule}-references`,
        rule,
        html: namingDocument(
          `<main><span id="visible-ref"><span hidden>Hidden</span></span><span id="hidden-ref" hidden><span hidden>Name</span></span><span id="special:ref">Name</span>${control("visible-empty", 'aria-labelledby="visible-ref"')}${control("hidden-named", 'aria-labelledby="hidden-ref"')}${control("special", 'aria-labelledby="special:ref special:ref missing"')}${control("malformed", 'aria-labelledby="[bad"')}</main>`,
        ),
        expected: { [rule]: ["#visible-empty", "#malformed"] },
        passes: ["#hidden-named", "#special"],
      },
      {
        id: `${rule}-shadow-slots`,
        rule,
        html: namingDocument(
          `<main><span id="same"></span><div id="host">${control("slotted", 'aria-labelledby="same"')}</div></main><script>document.querySelector('#host').attachShadow({mode:'open'}).innerHTML=${JSON.stringify(scopeBody + "<slot></slot>")};</script>`,
        ),
        expected: { [rule]: ["#host / #empty", "#slotted"] },
        passes: ["#host / #named"],
      },
      {
        id: `${rule}-frame`,
        rule,
        html: namingDocument(
          `<main><span id="same"></span><iframe id="frame" src="${frameUrl}" title="Child"></iframe></main>`,
        ),
        frames: { [frameUrl]: namingDocument(scopeBody) },
        expected: { [rule]: ["#frame / #empty"] },
        passes: ["#frame / #named"],
      },
      {
        id: `${rule}-denied`,
        rule,
        html: namingDocument(
          `<main>${control("named", 'aria-label="Name"')}<iframe id="denied" src="${deniedUrl}" title="Denied"></iframe></main>`,
        ),
        frames: { [deniedUrl]: namingDocument(scopeBody) },
        expected: {},
        passes: ["#named"],
        unsupported:
          "Denied cross-origin frame not injected; selected canonical rule does not expose full frame coverage. Propellr records frame-unavailable.",
      },
      {
        id: `${rule}-inapplicable`,
        rule,
        html: namingDocument(
          `<main>${control("hidden", "hidden")}<a id="no-href"></a><select><option>Choose</option></select><div role="link"></div></main>`,
        ),
        expected: {},
        passes: [],
      },
      {
        id: `${rule}-reference-fallbacks`,
        rule,
        html: namingDocument(
          `<main><span id="title-ref" title="Name"></span><script id="script-ref" type="text/plain">Not a name</script>${control("title-reference", 'aria-labelledby="title-ref"')}${control("script-reference", 'aria-labelledby="script-ref"')}</main>`,
        ),
        expected: { [rule]: ["#script-reference"] },
        passes: ["#title-reference"],
      },
      {
        id: `${rule}-embedded-control`,
        rule,
        html: namingDocument(
          `<main><select id="embedded" hidden><option selected>Name</option></select>${control("complex", 'aria-labelledby="embedded"')}</main>`,
        ),
        expected: {},
        passes: [],
        incomplete: { [rule]: ["#complex"] },
        allowedMismatches: [`${rule}:#complex`],
        unsupported:
          "Embedded select value in a direct reference is not implemented. Canonical passes; Propellr incomplete instead of guessing its value.",
      },
      {
        id: `${rule}-generated`,
        rule,
        html: namingDocument(
          `<style>#generated::before{content:'Name'}</style><main><span id="generated"></span>${control("complex", 'aria-labelledby="generated"')}</main>`,
        ),
        expected: {},
        passes: [],
        incomplete: { [rule]: ["#complex"] },
        allowedMismatches: [`${rule}:#complex`],
        unsupported:
          "CSS-generated reference text is not implemented. Canonical passes; Propellr incomplete with explicit unsupported-evidence.",
      },
      ...(["steps", "depth"] as const).map((limit): NamingFixture => ({
        id: `${rule}-${limit}-budget`,
        rule,
        html: namingDocument(
          `<main><span id="long">${limit === "steps" ? "<span>Name</span>".repeat(600) : "<span>".repeat(66) + "Name" + "</span>".repeat(66)}</span>${control("bounded", 'aria-labelledby="long"')}</main>`,
        ),
        expected: {},
        passes: [],
        incomplete: { [rule]: ["#bounded"] },
        allowedMismatches: [`${rule}:#bounded`],
        unsupported: `${limit === "steps" ? "2,000-step" : "64-level depth"} naming budget exceeded. Canonical passes; Propellr incomplete and naming-limit.`,
      })),
      {
        id: `${rule}-budget`,
        rule,
        html: namingDocument(
          `<main><span id="long">${"Name ".repeat(4000)}</span>${control("bounded", 'aria-labelledby="long"')}</main>`,
        ),
        expected: {},
        passes: [],
        incomplete: { [rule]: ["#bounded"] },
        allowedMismatches: [`${rule}:#bounded`],
        unsupported:
          "Reference text exceeds 16,384-character scan budget. Canonical passes; Propellr incomplete and naming-limit.",
      },
    ];
  }),
  {
    id: "label-hidden-ancestor",
    rule: "label",
    html: namingDocument(
      '<main><div hidden><label id="hidden-field-label" for="field">Name</label></div><input id="field"><div hidden><label id="hidden-title-label" for="title-field">Name</label></div><input id="title-field" title="Name"></main>',
    ),
    expected: { label: ["#field"] },
    passes: ["#title-field"],
  },
  {
    id: "label-shadow-relationships",
    rule: "label",
    html: namingDocument(
      `<main><label for="input">Outside</label><div id="host"></div></main><script>document.querySelector('#host').attachShadow({mode:'open'}).innerHTML='<input id="input"><label for="local" id="local-label">Local</label><input id="local"><label id="wrap-label">Wrap<input id="wrap"></label>';</script>`,
    ),
    expected: { label: ["#host / #input"] },
    passes: ["#host / #local", "#host / #wrap"],
  },
  {
    id: "link-slot-contents",
    rule: "link-name",
    html: namingDocument(
      `<main><div id="host">Open</div></main><script>document.querySelector('#host').attachShadow({mode:'open'}).innerHTML='<a id="link" href="#"><slot></slot></a>';</script>`,
    ),
    expected: {},
    passes: ["#host / #link"],
  },
];

// Test-owned page, served only by intercepted local fixture requests. No product UI.
export const combinedNamingHtml = namingDocument(
  `<main><img id="photo"><a id="link" href="#"></a><form><label id="form-label" for="field"></label><input id="field" disabled></form><button id="action">Save</button><p id="unrelated">Unrelated</p></main>`,
);
export const repairNaming = `document.querySelector('#photo').setAttribute('alt','Photo');document.querySelector('#link').textContent='Open';document.querySelector('#form-label').textContent='Email'`;
export const breakNaming = `document.querySelector('#photo').removeAttribute('alt');document.querySelector('#link').textContent='';document.querySelector('#form-label').textContent=''`;
