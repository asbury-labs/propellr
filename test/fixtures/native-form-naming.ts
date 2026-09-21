// Original expectations authored from pinned source before differential execution.
import type { Fixture } from "./slice.js";
import { deniedUrl, frameUrl } from "./slice.js";
import { namingDocument } from "./naming.js";

export const nativeFormRules = ["input-button-name", "input-image-alt", "select-name"] as const;
export interface NativeFormFixture extends Fixture {
  readonly rule: (typeof nativeFormRules)[number];
  readonly passes: readonly string[];
  readonly referenceOutcome?: "pass" | "violation";
  readonly approvedDivergence?: "native-type-case" | "own-label-default";
}
const control = (rule: NativeFormFixture["rule"], id: string, attrs = "") =>
  rule === "select-name"
    ? `<select id="${id}" ${attrs}><option selected>Own option</option><option>Other option</option></select>`
    : `<input type="${rule === "input-button-name" ? "button" : "image"}" id="${id}" ${attrs}>`;
export const nativeFormFixtures: readonly NativeFormFixture[] = [
  {
    id: "input-button-values",
    rule: "input-button-name",
    html: namingDocument(
      `<main>${["button", "submit", "reset"]
        .map(
          (type) =>
            `<input type="${type}" id="${type}-absent"><input type="${type}" id="${type}-empty" value=""><input type="${type}" id="${type}-spaces" value=" \t "><input type="${type}" id="${type}-named" value="Send">`,
        )
        .join("")}<input type="text" id="other"></main>`,
    ),
    expected: {
      "input-button-name": [
        "#button-absent",
        "#button-empty",
        "#button-spaces",
        "#submit-empty",
        "#submit-spaces",
        "#reset-empty",
        "#reset-spaces",
      ],
    },
    passes: ["#button-named", "#submit-absent", "#submit-named", "#reset-absent", "#reset-named"],
  },
  {
    id: "input-button-uppercase",
    rule: "input-button-name",
    html: namingDocument('<main><input type="SUBMIT" id="uppercase"></main>'),
    expected: {},
    passes: ["#uppercase"],
    approvedDivergence: "native-type-case",
  },
  {
    id: "input-image-empty-wrap",
    rule: "input-image-alt",
    html: namingDocument(
      '<main><label id="empty-wrap-label"><input type="image" id="empty-wrap"></label></main>',
    ),
    expected: { "input-image-alt": ["#empty-wrap"] },
    passes: [],
    approvedDivergence: "own-label-default",
  },
  {
    id: "input-image-alternatives",
    rule: "input-image-alt",
    html: namingDocument(
      '<main><input type="image" id="missing"><input type="image" id="empty" alt=""><input type="image" id="spaces" alt=" \t "><input type="image" id="named" alt="Send"><input type="image" id="spaces-aria" alt=" " aria-label="Send"><input type="image" id="present" role="presentation" disabled><input type="image" id="none" role="none" disabled><img id="other" alt=""></main>',
    ),
    expected: { "input-image-alt": ["#missing", "#empty", "#spaces", "#present", "#none"] },
    passes: ["#named", "#spaces-aria"],
  },
  {
    id: "select-options-labels",
    rule: "select-name",
    html: namingDocument(
      '<main><select id="single"><option selected>Own option</option></select><select id="multiple" multiple><option selected>Own option</option></select><select id="empty-option"><option selected></option></select><select id="placeholder" placeholder="Not a label"></select><label id="own-wrap"><select id="wrapped"><option selected>Own option</option></select></label><label id="own-explicit" for="explicit"><select id="explicit"><option selected>Own option</option></select></label><div id="own-reference"><select id="reference" aria-labelledby="own-reference"><option selected>Own option</option></select></div><label id="multi-label">Choice<select id="named-multiple" multiple><option selected>Own option</option></select></label></main>',
    ),
    expected: {
      "select-name": [
        "#single",
        "#multiple",
        "#empty-option",
        "#placeholder",
        "#wrapped",
        "#explicit",
        "#reference",
      ],
    },
    passes: ["#named-multiple"],
  },
  ...nativeFormRules.flatMap((rule): NativeFormFixture[] => {
    const node = (id: string, attrs = "") => control(rule, id, attrs);
    const scoped = `<span id="same">Local</span>${node("named", 'aria-labelledby="same"')}${node("empty")}`;
    return [
      {
        id: `${rule}-names`,
        rule,
        html: namingDocument(
          `<main><label id="explicit-label" for="explicit">Name</label>${node("explicit")}<label id="wrap-label">Name${node("wrap")}</label>${rule === "input-image-alt" ? "" : `<label id="empty-wrap-label">${node("empty-wrap")}</label>`}<label id="empty-label" for="empty"></label>${node("empty")}${node("aria", 'aria-label="Name"')}${node("title", 'title="Name"')}${node("missing")}${node("empty-aria", 'aria-label=" "')}${node("disabled", "disabled")}</main>`,
        ),
        expected: {
          [rule]: [
            ...(rule === "input-image-alt" ? [] : ["#empty-wrap"]),
            "#empty",
            "#missing",
            "#empty-aria",
            "#disabled",
          ],
        },
        passes: ["#explicit", "#wrap", "#aria", "#title"],
      },
      {
        id: `${rule}-roles`,
        rule,
        html: namingDocument(
          `<main>${node("enabled-none", 'role="none"')}${node("disabled-none", 'role="none" disabled')}${node("enabled-present", 'role="presentation"')}${node("disabled-present", 'role="presentation" disabled')}${node("global-conflict", 'role="none" disabled aria-live="polite"')}${rule === "select-name" ? `${node("combo", 'role="combobox"')}${node("list", 'role="listbox" multiple')}` : `${node("required", 'role="img" disabled')}${node("button-role", 'role="button"')}${node("grid", 'role="gridcell"')}${node("disabled-grid", 'role="gridcell" disabled')}${node("separator", 'role="separator"')}${node("disabled-separator", 'role="separator" disabled')}`}</main>`,
        ),
        expected: {
          [rule]: [
            "#enabled-none",
            "#enabled-present",
            ...(rule === "input-image-alt" ? ["#disabled-none", "#disabled-present"] : []),
            "#global-conflict",
            ...(rule === "select-name"
              ? ["#combo", "#list"]
              : ["#required", "#button-role", "#grid", "#separator"]),
          ],
        },
        passes: rule === "input-image-alt" ? [] : ["#disabled-none", "#disabled-present"],
      },
      {
        id: `${rule}-hidden-labels`,
        rule,
        html: namingDocument(
          `<main><div hidden><label id="hidden-label" for="hidden-label-control">Name</label><label id="hidden-title-label" for="hidden-title">Name</label></div>${node("hidden-label-control")}${node("hidden-title", 'title="Name"')}<label id="aria-hidden-label" for="aria-hidden" aria-hidden="true">Name</label>${node("aria-hidden")}<label id="hidden-aria-label" for="hidden-aria" hidden>Name</label>${node("hidden-aria", 'aria-label="Name"')}</main>`,
        ),
        expected: {
          [rule]: ["#aria-hidden", ...(rule === "select-name" ? ["#hidden-label-control"] : [])],
        },
        passes: [
          "#hidden-title",
          "#hidden-aria",
          ...(rule !== "select-name" ? ["#hidden-label-control"] : []),
        ],
      },
      {
        id: `${rule}-references`,
        rule,
        html: namingDocument(
          `<main><span id="visible-ref"><span hidden>Hidden</span></span><span id="hidden-ref" hidden><span hidden>Name</span></span><span id="special:ref">Name</span><span id="empty-ref"></span>${node("visible-empty", 'aria-labelledby="visible-ref"')}${node("hidden-named", 'aria-labelledby="hidden-ref"')}${node("special", 'aria-labelledby="special:ref special:ref absent"')}${node("malformed", 'aria-labelledby="[bad"')}${node("empty", 'aria-labelledby="empty-ref"')}${node("missing", 'aria-labelledby="absent"')}${node("empty-attribute", 'aria-labelledby=""')}</main>`,
        ),
        expected: {
          [rule]: ["#visible-empty", "#malformed", "#empty", "#missing", "#empty-attribute"],
        },
        passes: ["#hidden-named", "#special"],
      },
      {
        id: `${rule}-shadow-slots`,
        rule,
        html: namingDocument(
          `<main><span id="same"></span><label for="root-local">Outside</label><div id="host">${node("slotted", 'aria-labelledby="same"')}${node("implicit-slotted", 'slot="labelled"')}</div></main><script>document.querySelector('#host').attachShadow({mode:'open'}).innerHTML=${JSON.stringify(scoped + node("root-local") + `<label id="local-label" for="local">Local</label>${node("local")}<label id="slot-label">Composed<slot name="labelled"></slot></label><slot></slot>`)};</script>`,
        ),
        expected: { [rule]: ["#host / #empty", "#host / #root-local", "#slotted"] },
        passes: ["#host / #named", "#host / #local", "#implicit-slotted"],
      },
      {
        id: `${rule}-frame`,
        rule,
        html: namingDocument(
          `<main><span id="same"></span><iframe id="frame" src="${frameUrl}" title="Child"></iframe></main>`,
        ),
        frames: { [frameUrl]: namingDocument(scoped) },
        expected: { [rule]: ["#frame / #empty"] },
        passes: ["#frame / #named"],
      },
      {
        id: `${rule}-denied`,
        rule,
        html: namingDocument(
          `<main>${node("named", 'aria-label="Name"')}<iframe id="denied" src="${deniedUrl}" title="Denied"></iframe></main>`,
        ),
        frames: { [deniedUrl]: namingDocument(scoped) },
        expected: {},
        passes: ["#named"],
        unsupported:
          "Denied cross-origin frame not injected. Visible occurrences match; Propellr records frame-unavailable; selected canonical rules do not prove frame completeness.",
      },
      {
        id: `${rule}-inapplicable`,
        rule,
        html: namingDocument(
          `<main>${node("hidden", "hidden")}<input type="text"><button>Other</button><img alt=""><div role="combobox"></div></main>`,
        ),
        expected: {},
        passes: [],
      },
      ...(["generated", "embedded", "role", "nested-reference"] as const).map(
        (kind): NativeFormFixture => ({
          id: `${rule}-${kind}`,
          rule,
          html: namingDocument(
            `<main>${kind === "generated" ? '<style>#ref::before{content:"Name"}</style><span id="ref"></span>' : kind === "embedded" ? '<select id="ref" hidden><option selected>Name</option></select>' : kind === "nested-reference" ? '<span id="name">Name</span><span id="ref"><span aria-labelledby="name"></span></span>' : ""}${node("complex", kind === "role" ? 'role="switch" aria-label="Name"' : 'aria-labelledby="ref"')}</main>`,
          ),
          expected: {},
          passes: [],
          incomplete: { [rule]: ["#complex"] },
          allowedMismatches: [`${rule}:#complex`],
          referenceOutcome: kind === "role" ? "pass" : "violation",
          unsupported: `${kind} naming branch not implemented. Canonical ${kind === "role" ? "passes" : "violates"} this reproduction; Propellr incomplete with unsupported evidence.`,
        }),
      ),
      ...(["characters", "steps", "depth"] as const).map((limit): NativeFormFixture => ({
        id: `${rule}-${limit}-budget`,
        rule,
        html: namingDocument(
          `<main><span id="long">${limit === "characters" ? "Name ".repeat(4000) : limit === "steps" ? "<span>Name</span>".repeat(600) : "<span>".repeat(66) + "Name" + "</span>".repeat(66)}</span>${node("bounded", 'aria-labelledby="long"')}</main>`,
        ),
        expected: {},
        passes: [],
        incomplete: { [rule]: ["#bounded"] },
        allowedMismatches: [`${rule}:#bounded`],
        referenceOutcome: "pass",
        unsupported: `${limit} naming budget exhausted. Canonical passes; Propellr incomplete with naming-limit.`,
      })),
    ];
  }),
];

// Enabled local controls: naming can be complete; nine-rule geometry remains partial.
export const nativeFormHtml = namingDocument(
  '<main><form><input id="action" type="submit" value=""><input id="image" type="image"><label id="choice-label" for="choice"></label><select id="choice"><option id="first" selected>First</option><option id="second">Second</option></select></form><p id="unrelated">Unrelated</p></main>',
);
export const repairNativeForm = `document.querySelector('#action').removeAttribute('value');document.querySelector('#image').setAttribute('alt','Send');document.querySelector('#choice-label').textContent='Choice';document.querySelector('#choice').selectedIndex=1`;
export const breakNativeForm = `document.querySelector('#action').setAttribute('value',' ');document.querySelector('#image').setAttribute('alt','');document.querySelector('#choice-label').textContent='';document.querySelector('#choice').selectedIndex=0`;
