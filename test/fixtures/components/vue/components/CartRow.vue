<script setup lang="ts">
import { useComponentIdentity } from "../bridge";
import IconButton from "./IconButton.vue";
defineOptions({ name: "CartRow" });
defineProps<{ row: { id: string; removeId: string } }>();
const { root } = useComponentIdentity("CartRow");
</script>
<template>
  <div v-bind="root">
    <span>Cart item</span>
    <IconButton :id="row.removeId" callsite="cartrow-remove" />
  </div>
</template>
