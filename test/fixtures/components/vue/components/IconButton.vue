<script setup lang="ts">
import { useComponentIdentity } from "../bridge";
defineOptions({ name: "IconButton" });
// The caller supplies the label; the primitive only renders it.
const props = defineProps<{ id: string; callsite: string; label?: string }>();
const { root, part } = useComponentIdentity("IconButton", () => ({ callsite: props.callsite }));
</script>
<template>
  <button :id="id" :aria-label="label" v-bind="{ ...root, ...part('control') }">
    <span aria-hidden="true">*</span>
  </button>
</template>
