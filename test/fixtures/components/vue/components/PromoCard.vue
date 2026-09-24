<script setup lang="ts">
import { useComponentIdentity } from "../bridge";
defineOptions({ name: "Card" });
const { root, part } = useComponentIdentity("PromoCard");
</script>
<template>
  <div v-bind="root"><button id="n17" v-bind="part('action')"></button></div>
</template>
