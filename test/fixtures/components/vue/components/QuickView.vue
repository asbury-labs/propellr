<script setup lang="ts">
import { useComponentIdentity } from "../bridge";
defineOptions({ name: "QuickView" });
const { root, part } = useComponentIdentity("QuickView");
</script>
<template>
  <div v-bind="root">
    <p>Preview</p>
    <Teleport to="body">
      <button id="n13" v-bind="part('close')"><span aria-hidden="true">*</span></button>
    </Teleport>
  </div>
</template>
