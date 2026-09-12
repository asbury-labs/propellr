import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist/browser",
    emptyOutDir: true,
    lib: {
      entry: "src/browser/index.ts",
      name: "PropellrBrowser",
      formats: ["iife"],
      fileName: () => "propellr.js",
    },
    target: "es2024",
    sourcemap: true,
  },
});
