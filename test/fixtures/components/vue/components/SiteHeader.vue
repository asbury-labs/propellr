<script setup lang="ts">
import { useComponentIdentity } from "../bridge";
import IconButton from "./IconButton.vue";
defineOptions({ name: "SiteHeader" });
const { root } = useComponentIdentity("SiteHeader");
</script>
<template>
  <header v-bind="root">
    <IconButton id="n11" label="Search" callsite="header-search" />
  </header>
</template>
