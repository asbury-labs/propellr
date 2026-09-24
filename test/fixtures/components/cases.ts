// Original component fixtures. The instrumented arm carries propellr-bridge/1 declarations;
// the uninstrumented arm has identical markup without bridge attributes, classes or oracle IDs.
// Expected outcomes live separately in ./oracle.ts and are never derived from this renderer.
import type {
  BuildRef,
  ComponentManifestInput,
  PartBinding,
} from "../../../src/components/contracts.js";
import type { Fixture } from "../slice.js";
import { frameUrl } from "../slice.js";
import { namingDocument } from "../naming.js";

export type Arm = "instrumented" | "uninstrumented";
export interface ComponentCase {
  readonly id: string;
  readonly rules: readonly [string, ...string[]];
  readonly manifests: readonly ComponentManifestInput[];
  readonly associate: readonly BuildRef[];
  readonly render: (arm: Arm) => Fixture;
}

const template = { kind: "template" } as const;
const callsite = { kind: "callsite" } as const;
const unreviewed = { kind: "unreviewed" } as const;
const storefront = { application: "storefront", build: "b1" } as const;
const icon = '<span aria-hidden="true">*</span>';
const range = (count: number) => Array.from({ length: count }, (_, index) => index);
export const manifest = (
  build: BuildRef,
  definitions: readonly ComponentManifestInput["definitions"][number][],
  callsites: ComponentManifestInput["callsites"] = [],
): ComponentManifestInput => ({
  schema: "propellr-component-manifest/1",
  ...build,
  definitions,
  callsites,
});
export const definition = (
  id: string,
  parts: Readonly<Record<string, PartBinding>>,
  variants: readonly string[] = [],
  sourceRef?: string,
): ComponentManifestInput["definitions"][number] => ({
  id,
  displayName: id,
  variants,
  parts: Object.entries(parts).map(([key, binding]) => ({ key, binding })),
  ...(sourceRef ? { sourceRef } : {}),
});
// Bridge attributes exist only in the instrumented arm.
function bridge(arm: Arm) {
  const attributes = (values: Readonly<Record<string, string | undefined>>) =>
    arm === "instrumented"
      ? Object.entries(values)
          .filter(([, value]) => value !== undefined)
          .map(([name, value]) => ` data-propellr-${name}="${value}"`)
          .join("")
      : "";
  return {
    root: (definition: string, instance: string, extra: Readonly<Record<string, string>> = {}) =>
      attributes({ app: "storefront", build: "b1", definition, instance, ...extra }),
    part: (part: string, owner?: string) => attributes({ part, owner }),
    raw: attributes,
  };
}
const page = (id: string, body: string, frames?: Readonly<Record<string, string>>): Fixture => ({
  id,
  html: namingDocument(body),
  expected: {},
  ...(frames ? { frames } : {}),
});

export const componentCases: readonly ComponentCase[] = [
  {
    id: "grid-70-10",
    rules: ["button-name"],
    manifests: [
      manifest(storefront, [
        definition(
          "ProductCard",
          { "favorite-control": template },
          [],
          "src/cards/ProductCard.vue",
        ),
        definition("RecommendationTile", { "favorite-control": template }),
      ]),
    ],
    associate: [storefront],
    render: (arm) => {
      const b = bridge(arm);
      const cards = range(70).map(
        (k) =>
          `<article${b.root("ProductCard", `p${k}`)}><button id="n${k}"${b.part("favorite-control", `p${k}`)}>${icon}</button></article>`,
      );
      const tiles = range(10).map(
        (k) =>
          `<article${b.root("RecommendationTile", `r${k}`)}><button id="n${70 + k}"${b.part("favorite-control", `r${k}`)}>${icon}</button></article>`,
      );
      return page("grid-70-10", `<main>${cards.join("")}${tiles.join("")}</main>`);
    },
  },
  {
    id: "variants",
    rules: ["button-name"],
    manifests: [
      manifest(storefront, [
        definition("ProductCard", { "favorite-control": template }, [
          "desktop",
          "mobile",
          "compact",
        ]),
      ]),
    ],
    associate: [storefront],
    render: (arm) => {
      const b = bridge(arm);
      const desktop = range(3).map(
        (k) =>
          `<article${b.root("ProductCard", `p${k}`, { variant: "desktop" })}><div><button id="n${k}"${b.part("favorite-control", `p${k}`)}>${icon}</button></div></article>`,
      );
      const mobile = range(2).map(
        (k) =>
          `<section${b.root("ProductCard", `m${k}`, { variant: "mobile" })}><p>Item</p><button id="n${3 + k}"${b.part("favorite-control", `m${k}`)}></button></section>`,
      );
      return page("variants", `<main>${desktop.join("")}${mobile.join("")}</main>`);
    },
  },
  {
    id: "primitive-caller",
    rules: ["button-name"],
    manifests: [
      manifest(
        storefront,
        [
          definition("IconButton", { control: callsite }),
          definition("Toolbar", {}),
          definition("CartRow", {}),
          definition("SiteHeader", {}),
        ],
        [
          { id: "toolbar-share", caller: "Toolbar", renders: "IconButton" },
          { id: "cartrow-remove", caller: "CartRow", renders: "IconButton" },
          { id: "header-search", caller: "SiteHeader", renders: "IconButton" },
        ],
      ),
    ],
    associate: [storefront],
    render: (arm) => {
      const b = bridge(arm);
      const button = (id: string, instance: string, parent: string, site: string, label = "") =>
        `<button id="${id}"${label}${b.root("IconButton", instance, { parent, callsite: site })}${b.part("control", instance)}>${icon}</button>`;
      const rows = range(3).map(
        (k) =>
          `<div${b.root("CartRow", `c${k}`)}><span>Item</span>${button(`n${2 + k}`, `ib-c${k}`, `c${k}`, "cartrow-remove")}</div>`,
      );
      return page(
        "primitive-caller",
        `<header${b.root("SiteHeader", "h0")}>${button("n0", "ib-h", "h0", "header-search")}</header><main><div${b.root("Toolbar", "t0")}>${button("n1", "ib-t", "t0", "toolbar-share", ' aria-label="Share"')}</div>${rows.join("")}</main>`,
      );
    },
  },
  {
    id: "data-defect",
    rules: ["image-alt"],
    manifests: [
      manifest(storefront, [
        definition("ProductCard", {
          image: { kind: "data-record", field: "imageAlt" },
          "favorite-control": template,
        }),
      ]),
    ],
    associate: [storefront],
    render: (arm) => {
      const b = bridge(arm);
      const cards = range(5).map(
        (k) =>
          `<article${b.root("ProductCard", `p${k}`, { record: `sku-${k + 1}` })}><img id="n${k}"${b.part("image", `p${k}`)}${k === 2 || k === 4 ? "" : ' alt="Product photo"'}></article>`,
      );
      return page("data-defect", `<main>${cards.join("")}</main>`);
    },
  },
  {
    id: "external-label",
    rules: ["label"],
    manifests: [
      manifest(
        storefront,
        [
          definition("SignupForm", { "field-label": template }),
          definition("TextField", { input: callsite }),
        ],
        [
          { id: "signup-email", caller: "SignupForm", renders: "TextField" },
          { id: "signup-phone", caller: "SignupForm", renders: "TextField" },
        ],
      ),
    ],
    associate: [storefront],
    render: (arm) => {
      const b = bridge(arm);
      const field = (id: string, instance: string, site: string) =>
        `<div${b.root("TextField", instance, { parent: "s0", callsite: site })}><input id="${id}"${b.part("input", instance)}></div>`;
      return page(
        "external-label",
        `<main><form${b.root("SignupForm", "s0")}><label for="n0"${b.part("field-label", "s0")}>Email</label>${field("n0", "tf0", "signup-email")}${field("n1", "tf1", "signup-phone")}</form></main>`,
      );
    },
  },
  {
    id: "lookalikes",
    rules: ["button-name"],
    manifests: [
      manifest(storefront, [
        definition("WishlistButton", { control: unreviewed }),
        definition("ProductCard", { "favorite-control": template }),
      ]),
    ],
    associate: [storefront],
    render: (arm) => {
      const b = bridge(arm);
      const wishlist = (id: string, instance: string) =>
        `<button id="${id}"${b.root("WishlistButton", instance)}${b.part("control", instance)}>${icon}</button>`;
      const cards = range(2).map(
        (k) =>
          `<article${b.root("ProductCard", `p${k}`)}><button id="n${1 + k}"${b.part("favorite-control", `p${k}`)}>${icon}</button></article>`,
      );
      return page(
        "lookalikes",
        `<header>${wishlist("n0", "w0")}</header><main>${cards.join("")}${wishlist("n3", "w1")}</main>`,
      );
    },
  },
  {
    id: "cross-app",
    rules: ["button-name"],
    manifests: [
      manifest(storefront, [definition("ProductCard", { "favorite-control": template })]),
      manifest({ application: "partner", build: "p7" }, [
        definition("ProductCard", { "favorite-control": template }),
      ]),
    ],
    associate: [storefront, { application: "partner", build: "p7" }],
    render: (arm) => {
      const b = bridge(arm);
      const cards = (offset: number, extra: Readonly<Record<string, string>>) =>
        range(2)
          .map(
            (k) =>
              `<article${b.root("ProductCard", `p${k}`, extra)}><button id="n${offset + k}"${b.part("favorite-control", `p${k}`)}>${icon}</button></article>`,
          )
          .join("");
      return page(
        "cross-app",
        `<main>${cards(0, {})}<iframe src="${frameUrl}" title="Embedded offers"></iframe></main>`,
        { [frameUrl]: namingDocument(`<main>${cards(2, { app: "partner", build: "p7" })}</main>`) },
      );
    },
  },
  {
    id: "multi-defect",
    rules: ["button-name", "image-alt"],
    manifests: [
      manifest(storefront, [
        definition("ProductCard", { "favorite-control": template, image: template }),
      ]),
    ],
    associate: [storefront],
    render: (arm) => {
      const b = bridge(arm);
      const cards = range(3).map(
        (k) =>
          `<article${b.root("ProductCard", `p${k}`)}><img id="n${2 * k}"${b.part("image", `p${k}`)}><button id="n${2 * k + 1}"${b.part("favorite-control", `p${k}`)}>${icon}</button></article>`,
      );
      return page("multi-defect", `<main>${cards.join("")}</main>`);
    },
  },
  {
    id: "forged",
    rules: ["button-name"],
    manifests: [
      manifest(
        storefront,
        [
          definition("ProductCard", { "favorite-control": template }, ["desktop"]),
          definition("Banner", { cta: template }),
        ],
        [{ id: "hero-cta", caller: "Banner", renders: "Banner" }],
      ),
      manifest({ application: "outlet", build: "o1" }, [
        definition("ProductCard", { "favorite-control": template }),
      ]),
    ],
    associate: [storefront],
    render: (arm) => {
      const b = bridge(arm);
      const card = (
        id: string,
        instance: string,
        extra: Readonly<Record<string, string>> = {},
        part = b.part("favorite-control", instance),
        definition = "ProductCard",
      ) =>
        `<article${b.root(definition, instance, extra)}><button id="${id}"${part}>${icon}</button></article>`;
      return page(
        "forged",
        `<main>${[
          card("n0", "f0", { build: "b2" }),
          card("n1", "f1", { app: "outlet", build: "o1" }),
          card("n2", "f2", {}, undefined, "AdminPanel"),
          card("n3", "f3", {}, b.part("delete-control", "f3")),
          card("n4", "dup", { variant: "desktop" }),
          card("n5", "dup"),
          card("n6", "f6", {}, b.part("favorite-control")),
          card("n7", "f7", {}, b.part("favorite-control", "ghost")),
          card("n8", "f8", {}, b.raw({ part: "favorite-control", owner: "bad token!" })),
          card("n9", "f9", { variant: "tablet" }),
          card("n10", "f10", { callsite: "hero-cta" }),
          card("n11", "ok"),
          card("n13", "f13", { parent: "f2" }),
        ].join("")}</main><aside><button id="n12">${icon}</button></aside>`,
      );
    },
  },
  {
    id: "boundaries",
    rules: ["button-name"],
    manifests: [
      manifest(storefront, [
        definition("PageShell", { action: template }),
        definition("ShadowWidget", { control: template }),
        definition("FragmentPair", { control: template }),
        definition("FrameCard", { control: template }),
        definition("SlotCard", {}),
      ]),
    ],
    associate: [storefront],
    render: (arm) => {
      const b = bridge(arm);
      const shadow = `<button id="n0"${b.part("control", "w0")}>${icon}</button>`;
      const fragment = (id: string) =>
        `<div${b.root("FragmentPair", "f0")}><button id="${id}"${b.part("control", "f0")}>${icon}</button></div>`;
      return page(
        "boundaries",
        `<main${b.root("PageShell", "pg0")}><div id="host-a"${b.root("ShadowWidget", "w0")}></div>${fragment("n1")}${fragment("n2")}<iframe src="${frameUrl}" title="Embedded card"></iframe><div id="host-b"${b.root("SlotCard", "s0")}><button id="n4"${b.part("action", "pg0")}>${icon}</button><button id="n5">${icon}</button></div><div id="host-c"></div></main><div id="portal"><button id="n6"${b.part("action", "pg0")}>${icon}</button><button id="n7">${icon}</button></div><script>document.querySelector('#host-a').attachShadow({mode:'open'}).innerHTML=${JSON.stringify(shadow)};document.querySelector('#host-b').attachShadow({mode:'open'}).innerHTML='<div><slot></slot></div>';document.querySelector('#host-c').attachShadow({mode:'closed'}).innerHTML='<button></button>';</script>`,
        {
          [frameUrl]: namingDocument(
            `<main><div${b.root("FrameCard", "fr0")}><button id="n3"${b.part("control", "fr0")}>${icon}</button></div></main>`,
          ),
        },
      );
    },
  },
];

// Mutated by the lifecycle test between scans; never scored against the static oracle.
export const lifecycleCase: ComponentCase = {
  id: "lifecycle",
  rules: ["button-name"],
  manifests: [
    manifest(storefront, [
      definition("PageShell", { action: template }),
      definition("ProductCard", { "favorite-control": template }),
      definition("SlotCard", {}),
    ]),
  ],
  associate: [storefront],
  render: (arm) => {
    const b = bridge(arm);
    const cards = range(3).map(
      (k) =>
        `<article id="card-${k}"${b.root("ProductCard", `p${k}`)}><button id="n${k}"${b.part("favorite-control", `p${k}`)}>${icon}</button></article>`,
    );
    return page(
      "lifecycle",
      `<main${b.root("PageShell", "pg0")}><section id="list">${cards.join("")}</section><div id="slot-a"${b.root("SlotCard", "sa")}><button id="n10"${b.part("action", "pg0")}>${icon}</button></div><div id="slot-b"${b.root("SlotCard", "sb")}></div><iframe src="${frameUrl}" title="Embedded card"></iframe></main><script>for (const id of ['slot-a','slot-b']) document.getElementById(id).attachShadow({mode:'open'}).innerHTML='<div><slot></slot></div>';</script>`,
      {
        [frameUrl]: namingDocument(
          `<main><article${b.root("ProductCard", "fp0")}><button id="n20"${b.part("favorite-control", "fp0")}>${icon}</button></article></main>`,
        ),
      },
    );
  },
};

// Capture bounds. Raw findings must be unchanged when enrichment is exhausted.
export const exhaustionCases: readonly ComponentCase[] = [
  {
    id: "instance-limit",
    rules: ["button-name"],
    manifests: [
      manifest(storefront, [definition("ProductCard", { "favorite-control": template })]),
    ],
    associate: [storefront],
    render: (arm) => {
      const b = bridge(arm);
      // A root beyond the bound reuses x0 with another build; x0 must stop owning parts.
      const roots = range(300).map((k) =>
        k === 0 || k === 1 || k === 299
          ? `<div${b.root("ProductCard", `x${k}`)}><button id="n${k}"${b.part("favorite-control", `x${k}`)}>${icon}</button></div>`
          : `<div${b.root("ProductCard", `x${k}`)}></div>`,
      );
      return page(
        "instance-limit",
        `<main>${roots.join("")}<div${b.root("ProductCard", "x0", { build: "b9" })}></div></main>`,
      );
    },
  },
  {
    id: "relation-limit",
    rules: ["button-name"],
    manifests: [
      manifest(storefront, [definition("ProductCard", { "favorite-control": template })]),
    ],
    associate: [storefront],
    render: (arm) => {
      const b = bridge(arm);
      const buttons = range(70).map(
        (k) => `<button id="n${k}"${b.part("favorite-control", "x0")}>${icon}</button>`,
      );
      return page(
        "relation-limit",
        `<main${b.root("ProductCard", "x0")}>${buttons.join("")}</main>`,
      );
    },
  },
  {
    id: "visit-limit",
    rules: ["button-name"],
    manifests: [
      manifest(storefront, [definition("ProductCard", { "favorite-control": template })]),
    ],
    associate: [storefront],
    // 100 detached parts each walk ~38 ancestors, exhausting 2,000 visits before containment.
    // Neutral IDs keep deep targets within the reader's 1,024-character identity bound.
    render: (arm) => {
      const b = bridge(arm);
      const parts = range(100)
        .map((k) => `<span id="s${k}"${b.part("favorite-control", `x${k % 2}`)}></span>`)
        .join("");
      const depth = range(35)
        .map((k) => `<div id="d${k}">`)
        .join("");
      return page(
        "visit-limit",
        `<div${b.root("ProductCard", "x0")}></div><div${b.root("ProductCard", "x1")}></div><main>${depth}${parts}${"</div>".repeat(35)}<button id="n0"></button></main>`,
      );
    },
  },
  {
    id: "candidate-limit",
    rules: ["button-name"],
    manifests: [
      manifest(storefront, [definition("ProductCard", { "favorite-control": template })]),
    ],
    associate: [storefront],
    render: (arm) => {
      const b = bridge(arm);
      const open = range(40)
        .map((k) => `<div${b.root("ProductCard", `x${k}`)}>`)
        .join("");
      return page(
        "candidate-limit",
        `<main>${open}<button id="n0">${icon}</button>${"</div>".repeat(40)}</main>`,
      );
    },
  },
  {
    id: "byte-limit",
    rules: ["button-name"],
    manifests: [
      manifest(storefront, [definition("ProductCard", { "favorite-control": template })]),
    ],
    associate: [storefront],
    render: (arm) => {
      const b = bridge(arm);
      const roots = range(150).map(
        (k) =>
          `<div id="${`r${k}-`.padEnd(900, "x")}"${b.root("ProductCard", `x${k}`)}>${k === 0 ? `<button id="n0"${b.part("favorite-control", "x0")}>${icon}</button>` : ""}</div>`,
      );
      return page("byte-limit", `<main>${roots.join("")}</main>`);
    },
  },
];
