<script setup lang="ts">
import { useComponentIdentity } from "../bridge";
defineOptions({ name: "FragmentPair" });
const { root, part } = useComponentIdentity("FragmentPair");
</script>
<template>
  <div v-bind="root"><button id="n14" v-bind="part('control')"></button></div>
  <div v-bind="root"><button id="n15" v-bind="part('control')"></button></div>
</template>
