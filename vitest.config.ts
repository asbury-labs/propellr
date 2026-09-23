import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
  test: {
    passWithNoTests: false,
    projects: [
      {
        test: {
          name: "parity",
          environment: "node",
          include: ["test/parity/**/*.test.ts"],
          testTimeout: 60_000,
          hookTimeout: 30_000,
          fileParallelism: false,
        },
      },
      {
        test: { name: "reporting", environment: "node", include: ["test/reporting/**/*.test.ts"] },
      },
      {
        test: {
          name: "components",
          environment: "node",
          include: ["test/components/**/*.test.ts"],
          testTimeout: 180_000,
          hookTimeout: 30_000,
          fileParallelism: false,
        },
      },
      {
        test: {
          name: "bench",
          environment: "node",
          include: ["bench/**/*.test.ts"],
          testTimeout: 240_000,
          hookTimeout: 30_000,
          fileParallelism: false,
        },
      },
      {
        test: {
          name: "browser",
          include: ["test/browser/**/*.test.ts"],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }, { browser: "firefox" }, { browser: "webkit" }],
          },
        },
      },
      {
        test: {
          name: "contracts",
          environment: "node",
          include: ["test/contracts/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "host",
          environment: "node",
          include: ["test/host/**/*.test.ts"],
          testTimeout: 30_000,
          hookTimeout: 30_000,
        },
      },
      {
        test: {
          name: "playbooks",
          environment: "node",
          include: ["test/playbooks/**/*.test.ts"],
          testTimeout: 30_000,
          hookTimeout: 30_000,
        },
      },
    ],
  },
});
