// Fixture data with neutral element IDs. Tests mutate it through window.__propellrFixture.
import { reactive } from "vue";

export interface Product {
  readonly id: string;
  readonly name: string;
  readonly variant: "desktop" | "mobile";
  readonly favoriteId: string;
  readonly imageId: string;
  readonly imageAlt?: string | undefined;
}
export type Scenario = "grid" | "controls" | "list" | "twin";
export const product = (id: string, number: number, extra: Partial<Product> = {}): Product => ({
  id,
  name: `Item ${number}`,
  variant: "desktop",
  favoriteId: `n${number * 2 - 1}`,
  imageId: `n${number * 2}`,
  imageAlt: "Product photo",
  ...extra,
});
export const state = reactive({
  scenario: "controls" as Scenario,
  grid: Array.from({ length: 70 }, (_, index) => product(`g${index}`, index + 1)),
  tiles: Array.from({ length: 10 }, (_, index) => ({
    id: `t${index}`,
    favoriteId: `n${141 + index}`,
  })),
  products: [
    product("p1", 1),
    product("p2", 2, { imageAlt: undefined }),
    product("p3", 3, { variant: "mobile" }),
    product("p4", 4, { variant: "mobile", imageAlt: undefined }),
  ] as Product[],
  rows: [
    { id: "r1", removeId: "n9" },
    { id: "r2", removeId: "n10" },
  ],
  items: ["a", "b", "c"].map((id, index) => product(id, index + 1)) as Product[],
});
