import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['lib/**'],
      thresholds: {
        lines: 85,
        branches: 80,
        functions: 85,
        statements: 85
      }
    },
    testTimeout: 4000,
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['test/unit/**/*.{test,spec}.{ts,js}'],
          environment: 'node'
        }
      },
      {
        extends: true,
        test: {
          name: 'browser',
          include: ['test/browser/**/*.{test,spec}.{ts,js}'],
          browser: {
            enabled: true,
            provider: 'playwright',
            instances: [{ browser: 'chromium' }]
          }
        }
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['test/integration/**/*.{test,spec}.{ts,js}'],
          browser: {
            enabled: true,
            provider: 'playwright',
            instances: [{ browser: 'chromium' }]
          }
        }
      }
    ]
  },
  resolve: {
    alias: {
      'axe-core': resolve(__dirname, 'dist/axe.js')
    }
  }
});
