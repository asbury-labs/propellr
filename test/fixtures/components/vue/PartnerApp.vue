<script setup lang="ts">
import ProductCard from "./components/ProductCard.vue";
import { product } from "./store";
const item = product("pp1", 11);
</script>
<template>
  <section><ProductCard :product="item" /></section>
</template>
