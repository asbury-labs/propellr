<script setup lang="ts">
import ProductCard from "./components/ProductCard.vue";
import { product } from "./store";
// Mounted without the bridge plugin: renders no declarations.
const item = product("q1", 12);
</script>
<template>
  <section><ProductCard :product="item" /></section>
</template>
