<script setup lang="ts">
import { useComponentIdentity } from "../bridge";
// Display name is shared with PromoCard; the manifest definition ID is the identity.
defineOptions({ name: "Card" });
const { root, part } = useComponentIdentity("LegacyCard");
</script>
<template>
  <div v-bind="root"><button id="n16" v-bind="part('action')"></button></div>
</template>
