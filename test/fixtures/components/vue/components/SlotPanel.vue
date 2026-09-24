<script setup lang="ts">
import { useComponentIdentity } from "../bridge";
defineOptions({ name: "SlotPanel" });
const { root } = useComponentIdentity("SlotPanel");
</script>
<template>
  <aside v-bind="root"><slot /></aside>
</template>
