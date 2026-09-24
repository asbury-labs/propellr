<script setup lang="ts">
import { useComponentIdentity } from "../bridge";
defineOptions({ name: "RecommendationTile" });
defineProps<{ tile: { id: string; favoriteId: string } }>();
const { root, part } = useComponentIdentity("RecommendationTile");
</script>
<template>
  <article v-bind="root">
    <button :id="tile.favoriteId" v-bind="part('favorite-control')">
      <span aria-hidden="true">*</span>
    </button>
  </article>
</template>
