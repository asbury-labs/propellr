import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// Production SFC build: minified, no devtools hooks. Output is test-only, never published.
export default defineConfig({
  plugins: [vue()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    __VUE_OPTIONS_API__: "false",
    __VUE_PROD_DEVTOOLS__: "false",
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: "false",
  },
  build: {
    outDir: fileURLToPath(new URL("../../../../dist/fixtures/vue", import.meta.url)),
    emptyOutDir: true,
    lib: {
      entry: fileURLToPath(new URL("main.ts", import.meta.url)),
      name: "PropellrVueFixture",
      formats: ["iife"],
      fileName: () => "app.js",
    },
    target: "es2024",
    minify: true,
  },
});
