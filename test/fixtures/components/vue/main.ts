// Fixture entry. Scenario and test controls are set on the page before this bundle runs.
import { createApp } from "vue";
import App from "./App.vue";
import PartnerApp from "./PartnerApp.vue";
import PlainApp from "./PlainApp.vue";
import { propellrBridge } from "./bridge";
import { state } from "./store";
import type { Product, Scenario } from "./store";

const page = globalThis as typeof globalThis & {
  __propellrScenario?: Scenario;
  __propellrFixture?: { readonly setItems: (items: readonly Product[]) => void };
};
state.scenario = page.__propellrScenario ?? "controls";
page.__propellrFixture = {
  setItems: (items) => {
    state.items = [...items];
  },
};
createApp(App)
  .use(propellrBridge, { application: "storefront", build: "vue-1" })
  .mount("#storefront");
if (state.scenario === "controls") {
  createApp(PartnerApp)
    .use(propellrBridge, { application: "partner", build: "p7" })
    .mount("#partner");
  createApp(PlainApp).mount("#plain");
}
