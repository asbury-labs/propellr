# Phase 3: Test Infrastructure Modernization

**PRD Version:** 2.0
**Date:** February 16, 2026
**Status:** Draft
**Phase Duration:** 6–8 weeks
**Dependencies:** Phase 2 (partial — Vite config must exist for Vitest)
**Team:** 2 engineers

---

## 1. Overview

### 1.1 Executive Summary

axe-core's test infrastructure is split across three systems: Mocha + Chai + Sinon for Node.js unit tests, Karma (with Mocha adapter) for browser tests, and a collection of HTML fixture files served by `http-server`. The Karma configuration still references `karma-ie-launcher`, a relic from IE support days that was never removed.

**important**: Be critical of the _what_ and _how_ each test is doing. We do not want to update unnecessary files, this is a modernization effort, pick the most efficient methodology using the most modern testing strategy. We should eliminate all polyfill tests that are unnecessary due to having a real browser to test with.

This phase replaces the entire test stack with Vitest 4 — a single test framework that handles both Node.js and real-browser testing through its stable Browser Mode (powered by Playwright). The migration is straightforward because Vitest provides a Jest-compatible API, and Mocha's `describe/it` pattern maps directly.

### 1.2 Objectives

- Replace Mocha + Chai + Sinon with Vitest 4 for all unit tests
- Replace Karma + browser launchers with Vitest Browser Mode + Playwright provider
- Remove all IE/legacy browser polyfills and shims
- Consolidate test configuration into `packages/axe-core/vitest.config.ts`
- Maintain or improve test coverage (currently not formally tracked — establish baseline)
- Achieve <15s unit test suite, <30s browser test suite on CI
- Wire test tasks through Turborepo for caching and parallel execution

### 1.3 Success Criteria

- All existing tests pass under Vitest (zero regressions)
- `karma.conf.js` is deleted, all `karma-*` devDependencies removed
- No polyfills for IE, Edge Legacy, or pre-Chromium browsers remain
- Browser tests run in Chromium and Firefox via Playwright
- CI pipeline runs unit, browser, and integration tests in parallel via Turborepo
- Test execution time reduced by ≥50% compared to current
- Code coverage baseline established (target: ≥85% line coverage for `lib/core/`)

---

## 2. Technical Specification

### 2.1 Vitest Configuration

```typescript
// packages/axe-core/vitest.config.ts
import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
  test: {
    // --- Shared settings ---
    globals: true, // Provides describe, it, expect without imports (Mocha compat)
    include: ["test/**/*.{test,spec}.ts"],
    exclude: ["test/integration/**", "node_modules"],
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts"],
      exclude: ["lib/core/generated/**"],
      thresholds: {
        lines: 85,
        branches: 80,
        functions: 85,
        statements: 85,
      },
      reporter: ["text", "lcov", "html"],
    },
    reporters: ["default"],
    typecheck: {
      enabled: true,
    },

    // --- Browser test configuration ---
    browser: {
      enabled: false, // Enabled via workspace or CLI flag
      provider: playwright(),
      instances: [{ browser: "chromium" }, { browser: "firefox" }],
    },
  },
});
```

### 2.2 Workspace Configuration (Unit + Browser Split)

```typescript
// packages/axe-core/vitest.workspace.ts
import { defineWorkspace } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";

export default defineWorkspace([
  // Unit tests (Node.js)
  {
    test: {
      name: "unit",
      include: ["test/unit/**/*.test.ts"],
      environment: "node",
    },
  },

  // Browser tests (real browser via Playwright)
  {
    test: {
      name: "browser",
      include: ["test/browser/**/*.test.ts"],
      browser: {
        enabled: true,
        provider: playwright(),
        instances: [{ browser: "chromium" }],
      },
    },
  },

  // Integration tests (browser — full axe.run() against fixtures)
  {
    test: {
      name: "integration",
      include: ["test/integration/**/*.test.ts"],
      browser: {
        enabled: true,
        provider: playwright(),
        instances: [{ browser: "chromium" }, { browser: "firefox" }],
      },
    },
  },
]);
```

### 2.3 Test Migration Patterns

#### 2.3.1 Mocha → Vitest (Syntax)

The migration is largely mechanical. Vitest's API is Jest-compatible, and both Jest and Mocha share the `describe/it` pattern.

**Before (Mocha + Chai + Sinon):**

```javascript
const { assert } = require("chai");
const sinon = require("sinon");

describe("axe.utils.getSelector", function () {
  afterEach(function () {
    sinon.restore();
  });

  it("should return a CSS selector for a given element", function () {
    const node = document.createElement("div");
    node.id = "test";
    document.body.appendChild(node);
    const selector = axe.utils.getSelector(node);
    assert.equal(selector, "#test");
    document.body.removeChild(node);
  });

  it("should handle elements without IDs", function () {
    const node = document.createElement("span");
    node.className = "foo bar";
    document.body.appendChild(node);
    const selector = axe.utils.getSelector(node);
    assert.include(selector, "span");
    document.body.removeChild(node);
  });
});
```

**After (Vitest):**

```typescript
import { describe, it, expect, afterEach, vi } from "vitest";
import { getSelector } from "../../lib/core/utils/get-selector";

describe("getSelector", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return a CSS selector for a given element", () => {
    const node = document.createElement("div");
    node.id = "test";
    document.body.appendChild(node);
    const selector = getSelector(node);
    expect(selector).toBe("#test");
    document.body.removeChild(node);
  });

  it("should handle elements without IDs", () => {
    const node = document.createElement("span");
    node.className = "foo bar";
    document.body.appendChild(node);
    const selector = getSelector(node);
    expect(selector).toContain("span");
    document.body.removeChild(node);
  });
});
```

**Key migration patterns:**

| Mocha/Chai/Sinon            | Vitest Equivalent                    |
| --------------------------- | ------------------------------------ |
| `assert.equal(a, b)`        | `expect(a).toBe(b)`                  |
| `assert.deepEqual(a, b)`    | `expect(a).toEqual(b)`               |
| `assert.include(a, b)`      | `expect(a).toContain(b)`             |
| `assert.isTrue(a)`          | `expect(a).toBe(true)`               |
| `assert.throws(fn)`         | `expect(fn).toThrow()`               |
| `sinon.stub(obj, 'method')` | `vi.spyOn(obj, 'method')`            |
| `sinon.fake.returns(val)`   | `vi.fn().mockReturnValue(val)`       |
| `sinon.restore()`           | `vi.restoreAllMocks()`               |
| `this.timeout(5000)`        | `{ timeout: 5000 }` option on `it()` |

#### 2.3.2 Karma Browser Tests → Vitest Browser Mode

**Current Karma pattern:** Tests are bundled and served to real browsers via Karma. HTML fixtures are loaded from `test/fixtures/`.

**Vitest Browser Mode pattern:** Tests run in real browsers via Playwright. Fixture loading uses standard DOM manipulation or Vitest's `page` API.

**Before (Karma + fixture):**

```javascript
describe("color-contrast", function () {
  var fixture;

  before(function () {
    fixture = document.getElementById("fixture");
  });

  afterEach(function () {
    fixture.innerHTML = "";
  });

  it("should detect insufficient contrast", function () {
    fixture.innerHTML =
      '<p style="color: #ccc; background: #fff">Low contrast</p>';
    var node = fixture.querySelector("p");
    var result = axe.testUtils.getCheckEvaluate("color-contrast")(node);
    assert.isFalse(result);
  });
});
```

**After (Vitest Browser Mode):**

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("color-contrast", () => {
  let fixture: HTMLDivElement;

  beforeEach(() => {
    fixture = document.createElement("div");
    fixture.id = "fixture";
    document.body.appendChild(fixture);
  });

  afterEach(() => {
    fixture.remove();
  });

  it("should detect insufficient contrast", async () => {
    fixture.innerHTML =
      '<p style="color: #ccc; background: #fff">Low contrast</p>';
    const node = fixture.querySelector("p")!;

    // Import the check evaluator directly (now possible with proper modules)
    const { evaluate } =
      await import("../../lib/checks/color/color-contrast-evaluate");
    const result = evaluate(
      node,
      {},
      {
        /* virtualNode */
      },
    );
    expect(result).toBe(false);
  });
});
```

**Key differences:**

- No Karma server, no fixture HTML files that need HTTP serving
- Fixtures are created in-test via DOM APIs (or imported as HTML strings)
- Tests run in a real Chromium/Firefox instance via Playwright
- Direct module imports instead of global `axe` object (thanks to Phase 1 TypeScript + Phase 2 Vite)

### 2.4 Polyfill Removal

The following polyfills and compatibility shims are candidates for removal. Each is verified against the Baseline Widely Available target (Chrome 111+, Firefox 114+, Safari 16.4+):

| Polyfill/Shim                    | Purpose         | Safe to Remove?               |
| -------------------------------- | --------------- | ----------------------------- |
| `Array.from` polyfill            | IE11            | Yes — baseline since ES2015   |
| `Array.prototype.includes`       | IE11            | Yes — baseline since 2016     |
| `Array.prototype.find/findIndex` | IE11            | Yes — baseline since 2015     |
| `Object.assign`                  | IE11            | Yes — baseline since 2015     |
| `Promise` polyfill (if any)      | IE11            | Yes — baseline since 2015     |
| `WeakMap/WeakSet`                | IE11            | Yes — baseline since 2015     |
| `NodeList.prototype.forEach`     | IE11            | Yes — baseline since 2016     |
| `Element.prototype.closest`      | IE11            | Yes — baseline since 2018     |
| `Element.prototype.matches`      | IE11 (prefixed) | Yes — baseline since 2015     |
| `String.prototype.includes`      | IE11            | Yes — baseline since 2015     |
| `window.requestAnimationFrame`   | IE9             | Yes — baseline since 2012     |
| `karma-ie-launcher`              | IE testing      | Yes — IE is completely dead   |
| `jQuery` (devDep for tests)      | Test fixtures   | Yes — replace with native DOM |

**Audit process:** Run `grep -r "polyfill\|shim\|ponyfill"` across the codebase and test fixtures. Each hit is evaluated individually.

### 2.5 HTML Fixture Strategy

axe-core has extensive HTML fixtures for integration tests. These are currently served via `http-server` and loaded into Karma browsers.

**New approach:**

1. **Simple fixtures:** Inline in test files as template literals
2. **Complex fixtures:** Stored as `.html` files in `packages/axe-core/test/fixtures/`, loaded via Vitest's asset import or `fs.readFileSync` in Node tests
3. **Full-page fixtures (integration):** Served by Vite's dev server and loaded into Playwright pages via `page.goto()`

```typescript
// For integration tests that need a full page
import { page } from "@vitest/browser/context";

it("should find violations in a page with missing alt text", async () => {
  // Vite serves static files from test/fixtures/
  await page.goto("/test/fixtures/missing-alt.html");

  // Run axe against the page
  const results = await page.evaluate(async () => {
    const axe = await import("/lib/index.ts");
    return axe.run();
  });

  expect(results.violations).toHaveLength(1);
  expect(results.violations[0].id).toBe("image-alt");
});
```

### 2.6 CI Configuration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo run test --filter=axe-core -- --project unit --coverage

  browser:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install chromium firefox
      - run: pnpm turbo run test:browser --filter=axe-core -- --project browser

  integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install chromium firefox
      - run: pnpm turbo run test:browser --filter=axe-core -- --project integration

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo run typecheck
```

All jobs run in parallel on CI. Turborepo caching ensures that if `@axe-core/schemas` hasn't changed, its typecheck/build is served from cache.

---

## 3. Migration Plan

### Sprint 1: Foundation (Weeks 1–2)

- Install Vitest 4, `@vitest/browser-playwright`, Playwright in `packages/axe-core/`
- Create `vitest.config.ts` and `vitest.workspace.ts` in `packages/axe-core/`
- Set up workspace projects (unit, browser, integration)
- Migrate 5–10 representative unit tests to validate the pattern
- Migrate 2–3 browser tests to validate Browser Mode works with axe checks
- Run both old (Karma/Mocha) and new (Vitest) tests in CI in parallel

### Sprint 2: Bulk Unit Test Migration (Weeks 3–4)

- Systematic conversion of all `test/unit/` tests
- Use codemod/find-replace for Chai assertions → Vitest assertions
- Use codemod for Sinon stubs → Vitest mocks (`vi.spyOn`, `vi.fn`)
- Remove all `require()` calls, replace with ESM `import`
- Establish code coverage baseline

### Sprint 3: Browser & Integration Test Migration (Weeks 5–6)

- Convert all Karma browser tests to Vitest Browser Mode
- Migrate HTML fixture loading strategy
- Implement Playwright-based integration tests for full `axe.run()` scenarios
- Remove jQuery devDependency (replace with native DOM in test code)
- Audit and remove all polyfills (see Section 2.4)

### Sprint 4: Cleanup & Hardening (Weeks 7–8)

- Remove Karma, Mocha, Chai, Sinon, and all related devDependencies
- Remove `karma.conf.js`
- Remove `http-server` devDependency (Vite's dev server handles fixtures)
- Set coverage thresholds in CI (fail build if coverage drops)
- Performance benchmarking: measure test execution times
- Update `CONTRIBUTING.md` with new `pnpm test` instructions

---

## 4. Dependency Changes

### DevDependencies Removed (from `packages/axe-core/`)

```diff
- "karma": "^6.4.1"
- "karma-chai": "^0.1.0"
- "karma-chrome-launcher": "^3.1.1"
- "karma-firefox-launcher": "^2.1.2"
- "karma-ie-launcher": "^1.0.0"
- "karma-mocha": "^2.0.1"
- "karma-sinon": "^1.0.5"
- "karma-spec-reporter": "^0.0.36"
- "mocha": "^11.1.0"
- "chai": (transitive)
- "sinon": (transitive)
- "http-server": "^14.1.1"
- "jquery": "^3.6.3"
```

### DevDependencies Added (to `packages/axe-core/`)

```diff
+ "vitest": "^4.0"
+ "@vitest/browser-playwright": "^4.0"
+ "@vitest/coverage-v8": "^4.0"
+ "playwright": "^1.50"
```

**Net dependency reduction:** ~12 packages removed, ~4 added.

---

## 5. Technical Considerations

### 5.1 Vitest Browser Mode CI Stability

There is a known intermittent issue in Vitest 4.0.8 Browser Mode on CI (GitHub Actions Ubuntu) where tests randomly fail with "Vitest failed to find the current suite" (vitest-dev/vitest#9635). Mitigation: pin to a patched version, use `retry: 2` in CI configuration, and monitor the upstream fix.

### 5.2 JSDOM Deprecation — Resolved

Resolved in PRD-00 Section 4.4. JSDOM is formally deprecated with a runtime `console.warn()` when detected. Full removal in axe-core v5. Vitest Browser Mode with Playwright is the recommended replacement for real-browser testing.

### 5.3 Test Data Validation with Zod

With Zod schemas from `@axe-core/schemas` (Phase 1), test assertions can use schema matching:

```typescript
import { expect } from "vitest";
import { AxeResultsSchema } from "@axe-core/schemas";

it("should return valid results", async () => {
  const results = await axe.run(document);

  // Vitest 4 supports Zod schema matching natively
  expect(results).toMatchSchema(AxeResultsSchema);
});
```

This replaces tedious manual assertions about result shape and provides automatic regression detection if the result schema changes.

### 5.4 Coverage Tool — Resolved

**Decision: v8 coverage for all test types.**

v8 is faster, more accurate for both Node and browser tests (via Playwright's CDP coverage), and is the Vitest default. Istanbul is only needed if v8 coverage produces incorrect branch coverage for specific patterns — start with v8 and evaluate.

### 5.5 Parallel Test Execution

Vitest runs tests in parallel by default. axe-core browser tests that modify `document.body` need isolation. **Strategy:** Each test creates its own fixture container (`<div id="fixture-{testId}">`) rather than sharing a global one. For tests that truly require full-page control, use Vitest's `test.sequential` annotation. This is preferred over disabling parallelism globally, which would significantly increase CI time.

---

## 6. Open Questions

1. **Playwright Traces:** Vitest 4 supports generating Playwright Traces for failed tests. Should we enable this in CI for debugging? Adds trace file upload overhead but provides excellent debuggability. **Leaning yes** — upload traces as CI artifacts only on failure.
2. **color-contrast in Vitest Browser Mode:** The `color-contrast` check requires real CSS rendering (computed styles). Vitest Browser Mode with Playwright should handle this correctly since it runs in a real browser. Needs explicit validation during Sprint 1.
