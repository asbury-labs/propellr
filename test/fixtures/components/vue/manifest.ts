// Hand-authored source mapping for the Vue fixture, written from the SFC sources, not generated.
import type { ComponentManifestInput } from "../../../../src/components/contracts.js";

const source = (file: string) => `test/fixtures/components/vue/${file}`;
const template = { kind: "template" } as const;
export const vueStorefront: ComponentManifestInput = {
  schema: "propellr-component-manifest/1",
  application: "storefront",
  build: "vue-1",
  definitions: [
    {
      id: "StorefrontPage",
      displayName: "StorefrontPage",
      sourceRef: source("App.vue"),
      variants: [],
      parts: [{ key: "panel-action", binding: template }],
    },
    {
      id: "ProductCard",
      displayName: "ProductCard",
      sourceRef: source("components/ProductCard.vue"),
      variants: ["desktop", "mobile"],
      parts: [
        { key: "favorite-control", binding: template },
        { key: "image", binding: { kind: "data-record", field: "imageAlt" } },
      ],
    },
    {
      id: "RecommendationTile",
      displayName: "RecommendationTile",
      sourceRef: source("components/RecommendationTile.vue"),
      variants: [],
      parts: [{ key: "favorite-control", binding: template }],
    },
    {
      id: "IconButton",
      displayName: "IconButton",
      sourceRef: source("components/IconButton.vue"),
      variants: [],
      parts: [{ key: "control", binding: { kind: "callsite" } }],
    },
    {
      id: "CartRow",
      displayName: "CartRow",
      sourceRef: source("components/CartRow.vue"),
      variants: [],
      parts: [],
    },
    {
      id: "SiteHeader",
      displayName: "SiteHeader",
      sourceRef: source("components/SiteHeader.vue"),
      variants: [],
      parts: [],
    },
    {
      id: "SlotPanel",
      displayName: "SlotPanel",
      sourceRef: source("components/SlotPanel.vue"),
      variants: [],
      parts: [],
    },
    {
      id: "QuickView",
      displayName: "QuickView",
      sourceRef: source("components/QuickView.vue"),
      variants: [],
      parts: [{ key: "close", binding: template }],
    },
    {
      id: "FragmentPair",
      displayName: "FragmentPair",
      sourceRef: source("components/FragmentPair.vue"),
      variants: [],
      parts: [{ key: "control", binding: template }],
    },
    {
      id: "LegacyCard",
      displayName: "Card",
      sourceRef: source("components/LegacyCard.vue"),
      variants: [],
      parts: [{ key: "action", binding: template }],
    },
    {
      id: "PromoCard",
      displayName: "Card",
      sourceRef: source("components/PromoCard.vue"),
      variants: [],
      parts: [{ key: "action", binding: template }],
    },
  ],
  callsites: [
    {
      id: "cartrow-remove",
      caller: "CartRow",
      renders: "IconButton",
      sourceRef: source("components/CartRow.vue"),
    },
    {
      id: "header-search",
      caller: "SiteHeader",
      renders: "IconButton",
      sourceRef: source("components/SiteHeader.vue"),
    },
  ],
};
export const vuePartner: ComponentManifestInput = {
  schema: "propellr-component-manifest/1",
  application: "partner",
  build: "p7",
  definitions: [
    {
      id: "ProductCard",
      displayName: "ProductCard",
      variants: ["desktop", "mobile"],
      parts: [
        { key: "favorite-control", binding: template },
        { key: "image", binding: { kind: "data-record", field: "imageAlt" } },
      ],
    },
  ],
  callsites: [],
};
// Page HTML for one scenario, with the compiled bundle inlined.
export const vuePage = (scenario: "grid" | "controls" | "list", bundle: string) =>
  `<!doctype html><html lang="en"><meta charset="utf-8"><title>Vue fixture</title><style>body{margin:32px;font-family:Arial,sans-serif}img{width:32px;height:32px}button{display:block;box-sizing:border-box;width:180px;min-height:32px;margin:16px 0;padding:0;border:0}</style><body><div id="storefront"></div><div id="partner"></div><div id="plain"></div><script>globalThis.__propellrScenario=${JSON.stringify(scenario)}</script><script>${bundle.replaceAll("</script", "<\\/script")}</script></body></html>`;
