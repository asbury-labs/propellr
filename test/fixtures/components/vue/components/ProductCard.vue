<script setup lang="ts">
import { useComponentIdentity } from "../bridge";
import type { Product } from "../store";
defineOptions({ name: "ProductCard" });
const props = defineProps<{ product: Product }>();
const { root, part } = useComponentIdentity("ProductCard", () => ({
  variant: props.product.variant,
  record: props.product.id,
}));
</script>
<template>
  <article v-if="product.variant === 'desktop'" v-bind="root">
    <img
      :id="product.imageId"
      v-bind="part('image')"
      :alt="product.imageAlt"
      width="32"
      height="32"
    />
    <h3>{{ product.name }}</h3>
    <footer>
      <button :id="product.favoriteId" v-bind="part('favorite-control')">
        <span aria-hidden="true">*</span>
      </button>
    </footer>
  </article>
  <section v-else v-bind="root">
    <button :id="product.favoriteId" v-bind="part('favorite-control')"></button>
    <p>{{ product.name }}</p>
    <img
      :id="product.imageId"
      v-bind="part('image')"
      :alt="product.imageAlt"
      width="32"
      height="32"
    />
  </section>
</template>
