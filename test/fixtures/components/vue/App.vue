<script setup lang="ts">
import { useComponentIdentity } from "./bridge";
import { state } from "./store";
import ProductCard from "./components/ProductCard.vue";
import RecommendationTile from "./components/RecommendationTile.vue";
import CartRow from "./components/CartRow.vue";
import SiteHeader from "./components/SiteHeader.vue";
import SlotPanel from "./components/SlotPanel.vue";
import QuickView from "./components/QuickView.vue";
import FragmentPair from "./components/FragmentPair.vue";
import LegacyCard from "./components/LegacyCard.vue";
import PromoCard from "./components/PromoCard.vue";
defineOptions({ name: "StorefrontPage" });
const { root, part } = useComponentIdentity("StorefrontPage");
</script>
<template>
  <main v-bind="root">
    <template v-if="state.scenario === 'grid'">
      <ProductCard v-for="item in state.grid" :key="item.id" :product="item" />
      <RecommendationTile v-for="tile in state.tiles" :key="tile.id" :tile="tile" />
    </template>
    <template v-else-if="state.scenario === 'list'">
      <ProductCard v-for="item in state.items" :key="item.id" :product="item" />
    </template>
    <template v-else>
      <SiteHeader />
      <ProductCard v-for="item in state.products" :key="item.id" :product="item" />
      <CartRow v-for="row in state.rows" :key="row.id" :row="row" />
      <!-- Slot content belongs to this caller's template, not to SlotPanel. -->
      <SlotPanel><button id="n12" v-bind="part('panel-action')"></button></SlotPanel>
      <QuickView />
      <FragmentPair />
      <LegacyCard />
      <PromoCard />
    </template>
  </main>
</template>
