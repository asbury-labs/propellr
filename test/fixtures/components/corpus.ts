// Frozen phase 2 corpus: 12 original families x 20 violation decision cases = 240. Splits are
// by family, so related variants never cross. Truth is taken only from the instrumented arm.
import { frameUrl } from "../slice.js";
import { namingDocument } from "../naming.js";
import type { ComponentCase } from "./cases.js";
import { bridge, definition, manifest, page } from "./cases.js";

export interface CorpusFamily extends ComponentCase {
  readonly split: "dev" | "holdout";
}
const template = { kind: "template" } as const;
const callsite = { kind: "callsite" } as const;
const store = { application: "storefront", build: "c1" } as const;
const icon = '<span aria-hidden="true">*</span>';
const range = (count: number, from = 0) =>
  Array.from({ length: count }, (_, index) => from + index);
type Bridge = ReturnType<typeof bridge>;
const root = (
  b: Bridge,
  definition: string,
  instance: string,
  extra: Record<string, string> = {},
) => b.raw({ app: store.application, build: store.build, definition, instance, ...extra });
const family = (
  id: string,
  split: CorpusFamily["split"],
  rules: CorpusFamily["rules"],
  definitions: Parameters<typeof manifest>[1],
  body: (b: Bridge) => string,
  callsites: Parameters<typeof manifest>[2] = [],
  frames?: (b: Bridge) => Readonly<Record<string, string>>,
): CorpusFamily => ({
  id,
  split,
  rules,
  manifests: [manifest(store, definitions, callsites)],
  associate: [store],
  render: (arm) => {
    const b = bridge(arm);
    return page(id, body(b), frames?.(b));
  },
});
const card = (b: Bridge, definition: string, k: number, id: string, extra = "") =>
  `<article${root(b, definition, `${definition[0]}${k}`)}><h3>Item</h3>${extra}<button id="${id}"${b.part("favorite-control", `${definition[0]}${k}`)}>${icon}</button></article>`;
const iconButton = (
  b: Bridge,
  id: string,
  instance: string,
  parent: string,
  site: string,
  label = "",
) =>
  `<button id="${id}"${label}${root(b, "IconButton", instance, { parent, callsite: site })}${b.part("control", instance)}>${icon}</button>`;

export const corpusFamilies: readonly CorpusFamily[] = [
  // ---- dev (80) ----
  family(
    "favorites-grid",
    "dev",
    ["button-name"],
    [definition("ProductCard", { "favorite-control": template })],
    (b) =>
      `<main>${range(20)
        .map((k) => card(b, "ProductCard", k, `n${k}`))
        .join("")}</main>`,
  ),
  family(
    "cart-callsites",
    "dev",
    ["button-name"],
    [
      definition("IconButton", { control: callsite }),
      definition("CartRow", {}),
      definition("SiteHeader", {}),
    ],
    (b) =>
      `<header${root(b, "SiteHeader", "h0")}>${iconButton(b, "s0", "ib-h", "h0", "header-search", ' aria-label="Search"')}</header><main>${range(
        20,
      )
        .map(
          (k) =>
            `<div${root(b, "CartRow", `r${k}`)}><span>Item</span>${iconButton(b, `n${k}`, `ib${k}`, `r${k}`, "cartrow-remove")}</div>`,
        )
        .join("")}</main>`,
    [
      { id: "cartrow-remove", caller: "CartRow", renders: "IconButton" },
      { id: "header-search", caller: "SiteHeader", renders: "IconButton" },
    ],
  ),
  family(
    "lookalikes",
    "dev",
    ["button-name"],
    [
      definition("ProductCard", { "favorite-control": template }),
      definition("WishlistCard", { "favorite-control": template }),
    ],
    // Identical markup, unrelated definitions, interleaved.
    (b) =>
      `<main>${range(20)
        .map((k) => card(b, k % 2 ? "WishlistCard" : "ProductCard", k, `n${k}`))
        .join("")}</main>`,
  ),
  family(
    "fragments",
    "dev",
    ["button-name"],
    [definition("FragmentPair", { control: template })],
    (b) =>
      `<main>${range(10)
        .map((k) =>
          [0, 1]
            .map(
              (half) =>
                `<div${root(b, "FragmentPair", `f${k}`)}><button id="n${k * 2 + half}"${b.part("control", `f${k}`)}></button></div>`,
            )
            .join(""),
        )
        .join("")}</main>`,
  ),
  // ---- holdout (160), sealed until all approved arms run together ----
  family(
    "recommendation-rail",
    "holdout",
    ["button-name"],
    [definition("RecommendationTile", { "favorite-control": template })],
    (b) =>
      `<main><section>${range(20)
        .map(
          (k) =>
            `<div${root(b, "RecommendationTile", `t${k}`)}><div><button id="n${k}"${b.part("favorite-control", `t${k}`)}>${icon}</button></div></div>`,
        )
        .join("")}</section></main>`,
  ),
  family(
    "variants",
    "holdout",
    ["button-name"],
    [definition("ProductCard", { "favorite-control": template }, ["desktop", "mobile"])],
    (b) =>
      `<main>${range(20)
        .map((k) =>
          k % 2
            ? `<section${root(b, "ProductCard", `p${k}`, { variant: "mobile" })}><button id="n${k}"${b.part("favorite-control", `p${k}`)}></button><p>Item</p></section>`
            : `<article${root(b, "ProductCard", `p${k}`, { variant: "desktop" })}><h3>Item</h3><footer><button id="n${k}"${b.part("favorite-control", `p${k}`)}>${icon}</button></footer></article>`,
        )
        .join("")}</main>`,
  ),
  family(
    "data-records",
    "holdout",
    ["image-alt"],
    [definition("ProductCard", { image: { kind: "data-record", field: "imageAlt" } })],
    // 20 of 30 records lack alternative text.
    (b) =>
      `<main>${range(30)
        .map(
          (k) =>
            `<article${root(b, "ProductCard", `p${k}`, { record: `sku-${k}` })}><img id="${k < 20 ? `n${k}` : `ok${k}`}"${b.part("image", `p${k}`)}${k < 20 ? "" : ' alt="Photo"'}></article>`,
        )
        .join("")}</main>`,
  ),
  family(
    "external-labels",
    "holdout",
    ["label"],
    [definition("SignupForm", {}), definition("TextField", { input: callsite })],
    (b) =>
      `<main><form${root(b, "SignupForm", "s0")}>${range(20)
        .map(
          (k) =>
            `<div${root(b, "TextField", `tf${k}`, { parent: "s0", callsite: k < 10 ? "signup-email" : "signup-phone" })}><input id="n${k}"${b.part("input", `tf${k}`)}></div>`,
        )
        .join("")}</form></main>`,
    [
      { id: "signup-email", caller: "SignupForm", renders: "TextField" },
      { id: "signup-phone", caller: "SignupForm", renders: "TextField" },
    ],
  ),
  family(
    "two-caller-primitive",
    "holdout",
    ["button-name"],
    [
      definition("IconButton", { control: callsite }),
      definition("Toolbar", {}),
      definition("CartRow", {}),
    ],
    (b) =>
      `<main>${range(10)
        .map(
          (k) =>
            `<div${root(b, "Toolbar", `tb${k}`)}>${iconButton(b, `n${k}`, `ibt${k}`, `tb${k}`, "toolbar-share")}</div>`,
        )
        .join("")}${range(10)
        .map(
          (k) =>
            `<div${root(b, "CartRow", `r${k}`)}><span>Item</span>${iconButton(b, `n${10 + k}`, `ibr${k}`, `r${k}`, "cartrow-remove")}</div>`,
        )
        .join("")}</main>`,
    [
      { id: "toolbar-share", caller: "Toolbar", renders: "IconButton" },
      { id: "cartrow-remove", caller: "CartRow", renders: "IconButton" },
    ],
  ),
  family(
    "shadow-widgets",
    "holdout",
    ["button-name"],
    [definition("ShadowWidget", { control: template })],
    (b) => {
      const hosts = range(20)
        .map((k) => `<div id="h${k}"${root(b, "ShadowWidget", `w${k}`)}></div>`)
        .join("");
      const inner = range(20).map(
        (k) => `<button id="n${k}"${b.part("control", `w${k}`)}></button>`,
      );
      return `<main>${hosts}</main><script>${JSON.stringify(inner)}.forEach((html, k) => { document.getElementById('h' + k).attachShadow({ mode: 'open' }).innerHTML = html; });</script>`;
    },
  ),
  family(
    "frame-cards",
    "holdout",
    ["button-name"],
    [definition("ProductCard", { "favorite-control": template })],
    (b) =>
      `<main>${range(10)
        .map((k) => card(b, "ProductCard", k, `n${k}`))
        .join("")}<iframe src="${frameUrl}" title="Embedded offers"></iframe></main>`,
    [],
    (b) => ({
      [frameUrl]: namingDocument(
        `<main>${range(10, 10)
          .map((k) => card(b, "ProductCard", k, `n${k}`))
          .join("")}</main>`,
      ),
    }),
  ),
  family(
    "multi-defect",
    "holdout",
    ["button-name", "image-alt"],
    [definition("ProductCard", { "favorite-control": template, image: template })],
    (b) =>
      `<main>${range(10)
        .map(
          (k) =>
            `<article${root(b, "ProductCard", `p${k}`)}><img id="n${k * 2}"${b.part("image", `p${k}`)}><button id="n${k * 2 + 1}"${b.part("favorite-control", `p${k}`)}>${icon}</button></article>`,
        )
        .join("")}</main>`,
  ),
];
