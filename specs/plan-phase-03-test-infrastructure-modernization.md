# Plan: Phase 3 — Test Infrastructure Modernization (Mocha/Karma → Vitest)

## Task Description
Migrate axe-core's entire test infrastructure from Mocha + Chai + Sinon + Karma to Vitest 4 with Browser Mode (Playwright). This covers ~642 test files across unit tests (`test/core/`, `test/commons/`, `test/checks/`, `test/rule-matches/`), browser integration tests (`test/integration/rules/` — 96 JSON+HTML rule tests, `test/integration/full/` — 53 scenarios, `test/integration/api/`, `test/integration/virtual-rules/`), node tests (`test/node/`), and ~335 HTML fixture files. Remove all legacy dependencies (Karma, Chai, Sinon, jQuery, http-server, IE polyfills) and establish coverage baselines.

## Objective
When complete:
- All 642+ tests pass under Vitest 4 with zero regressions
- Browser tests run in real Chromium/Firefox via Vitest Browser Mode + Playwright
- `karma.conf.js` and all `karma-*` dependencies are deleted
- Mocha, Chai, Sinon, jQuery, http-server dependencies removed
- Coverage baseline ≥85% line coverage for `lib/core/`
- Test suite: <15s unit, <30s browser on CI
- Turborepo pipelines wire `test`, `test:browser`, `test:integration`

## Problem Statement
axe-core uses three disparate test systems (Mocha/Chai/Sinon for assertions, Karma for browser test running, http-server for fixtures) with IE-era relics (`karma-ie-launcher`, polyfill tests). This creates maintenance burden, slow CI feedback, and prevents leveraging modern tooling like ESM imports, v8 coverage, and Playwright-powered browser testing. The Karma test preprocessor system (JSON → JS template injection) is especially fragile.

## Solution Approach
1. **Install Vitest 4 + Playwright** alongside existing stack (dual-running during migration)
2. **Create Vitest config** with workspace projects (unit, browser, integration)
3. **Migrate test utils** — convert `testutils.js` to ESM module with Vitest equivalents
4. **Migrate unit tests** (core, commons, checks, rule-matches) — mechanical Chai→expect, Sinon→vi conversion
5. **Migrate browser/integration tests** — replace Karma runner and JSON preprocessor with Vitest Browser Mode
6. **Migrate node tests** — convert `test/node/` tests
7. **Remove legacy deps** — delete Karma configs, polyfills, jQuery, old deps
8. **Wire Turborepo** — add `test:browser`, `test:integration` tasks
9. **Establish coverage** — set thresholds, CI enforcement

## Relevant Files

### Existing Files to Modify
- `packages/axe-core/package.json` — swap devDependencies (remove 14 legacy, add 4 modern)
- `turbo.json` — add `test:browser`, `test:integration` tasks
- `packages/axe-core/test/testutils.js` → rewrite as `test/testutils.ts` (ESM, Vitest-native)
- `packages/axe-core/test/karma.conf.js` — DELETE after migration complete
- `packages/axe-core/test/core/**/*.js` — 119 unit test files (mechanical conversion)
- `packages/axe-core/test/commons/**/*.js` — 145 unit test files (mechanical conversion)
- `packages/axe-core/test/checks/**/*.js` — 112 browser test files (need Vitest Browser Mode)
- `packages/axe-core/test/rule-matches/**/*.js` — 44 test files
- `packages/axe-core/test/integration/rules/runner.js` — DELETE, replace with Vitest runner
- `packages/axe-core/test/integration/rules/preprocessor.js` — DELETE
- `packages/axe-core/test/integration/rules/**/*.json` — 96 rule test definitions (keep data, new runner)
- `packages/axe-core/test/integration/full/**/*.js` — 53 full integration tests
- `packages/axe-core/test/integration/virtual-rules/**/*.js` — virtual rule tests
- `packages/axe-core/test/integration/api/` — API integration tests
- `packages/axe-core/test/node/*.js` — 2 node-specific tests
- `packages/axe-core/test/act-rules/` — ACT rules tests

### New Files to Create
- `packages/axe-core/vitest.config.ts` — main Vitest configuration
- `packages/axe-core/vitest.workspace.ts` — workspace split (unit, browser, integration)
- `packages/axe-core/test/testutils.ts` — modernized test utilities (ESM)
- `packages/axe-core/test/integration/rules/vitest-rule-runner.ts` — replaces Karma preprocessor+runner pattern

## Implementation Phases

### Phase 1: Foundation (Tasks 1–3)
Install Vitest 4 + Playwright, create configs, convert testutils, validate with representative tests.

### Phase 2: Bulk Unit Migration (Tasks 4–6)
Systematic conversion of all unit test files (~308 files across core, commons, checks, rule-matches). This is the largest phase by file count but most mechanical — Chai→expect, Sinon→vi, require→import.

### Phase 3: Browser & Integration Migration (Tasks 7–9)
Convert Karma browser tests and the custom JSON preprocessor system to Vitest Browser Mode. This is the most architecturally complex phase.

### Phase 4: Cleanup & Hardening (Tasks 10–12)
Remove legacy deps, wire Turborepo, establish coverage, validate CI.

## Team Orchestration

- You operate as the team lead and orchestrate the team to execute the plan.
- You're responsible for deploying the right team members with the right context to execute the plan.
- IMPORTANT: You NEVER operate directly on the codebase. You use `Task` and `Task*` tools to deploy team members to to the building, validating, testing, deploying, and other tasks.
  - This is critical. You're job is to act as a high level director of the team, not a builder.
  - You're role is to validate all work is going well and make sure the team is on track to complete the plan.
  - You'll orchestrate this by using the Task* Tools to manage coordination between the team members.
  - Communication is paramount. You'll use the Task* Tools to communicate with the team members and ensure they're on track to complete the plan.
- Take note of the session id of each team member. This is how you'll reference them.

### Team Members

- Builder
  - Name: foundation-builder
  - Role: Install Vitest + Playwright, create configuration files, convert testutils.ts
  - Agent Type: general-purpose
  - Resume: true

- Builder
  - Name: unit-migrator-core
  - Role: Migrate `test/core/` and `test/commons/` unit tests from Mocha/Chai/Sinon to Vitest
  - Agent Type: general-purpose
  - Resume: true

- Builder
  - Name: unit-migrator-checks
  - Role: Migrate `test/checks/` and `test/rule-matches/` tests from Mocha/Chai/Sinon to Vitest
  - Agent Type: general-purpose
  - Resume: true

- Builder
  - Name: integration-migrator
  - Role: Replace Karma runner/preprocessor with Vitest Browser Mode for integration tests, migrate `test/integration/` and `test/node/`
  - Agent Type: general-purpose
  - Resume: true

- Builder
  - Name: cleanup-builder
  - Role: Remove legacy dependencies, delete Karma configs, remove polyfills, wire Turborepo, set coverage thresholds
  - Agent Type: general-purpose
  - Resume: true

- Builder
  - Name: validator
  - Role: Run all tests, verify zero regressions, check coverage thresholds, validate CI config
  - Agent Type: general-purpose
  - Resume: false

## Step by Step Tasks

- IMPORTANT: Execute every step in order, top to bottom. Each task maps directly to a `TaskCreate` call.
- Before you start, run `TaskCreate` to create the initial task list that all team members can see and execute.

### 1. Install Vitest + Playwright Dependencies
- **Task ID**: install-deps
- **Depends On**: none
- **Assigned To**: foundation-builder
- **Agent Type**: general-purpose
- **Parallel**: false
- In `packages/axe-core/`, install: `vitest@^4.0`, `@vitest/browser-playwright@^4.0`, `@vitest/coverage-v8@^4.0`, `playwright@^1.50` as devDependencies
- Do NOT remove legacy deps yet — both stacks must coexist during migration
- Verify `pnpm install` succeeds cleanly

### 2. Create Vitest Configuration Files
- **Task ID**: create-vitest-config
- **Depends On**: install-deps
- **Assigned To**: foundation-builder
- **Agent Type**: general-purpose
- **Parallel**: false
- Create `packages/axe-core/vitest.config.ts` with shared settings per PRD Section 2.1:
  - `globals: true` for Mocha compat
  - `include: ["test/**/*.{test,spec}.ts"]`
  - Coverage: v8 provider, thresholds (lines: 85, branches: 80, functions: 85, statements: 85)
  - Browser: Playwright provider, chromium + firefox instances (disabled by default)
- Create `packages/axe-core/vitest.workspace.ts` with three projects per PRD Section 2.2:
  - `unit`: `test/unit/**/*.test.ts`, environment: node
  - `browser`: `test/browser/**/*.test.ts`, browser mode with chromium
  - `integration`: `test/integration/**/*.test.ts`, browser mode with chromium + firefox
- Add scripts to `packages/axe-core/package.json`:
  - `"test:vitest": "vitest run --project unit"`
  - `"test:browser": "vitest run --project browser"`
  - `"test:integration": "vitest run --project integration"`

### 3. Convert testutils.js to testutils.ts
- **Task ID**: convert-testutils
- **Depends On**: create-vitest-config
- **Assigned To**: foundation-builder
- **Agent Type**: general-purpose
- **Parallel**: false
- Read `packages/axe-core/test/testutils.js` (809 lines) thoroughly
- Create `packages/axe-core/test/testutils.ts` as ESM module exporting all utilities:
  - `MockCheckContext` — keep same shape, typed
  - `shadowSupport` — keep detection logic
  - `getFixture()` — keep
  - `fixtureSetup(content)` — keep, uses `axe.setup()`
  - `checkSetup(content, options, target)` — keep
  - `shadowCheckSetup(...)` — keep
  - `queryFixture(html, query)` — convert `assert.exists` → Vitest `expect`
  - `getCheckEvaluate(checkId)` — keep wrapper, convert `assert.*` → `expect`
  - `awaitNestedLoad(win, cb)` — keep for iframe tests
  - `addStyleSheet/addStyleSheets/removeStyleSheets` — keep
  - `assertStylesheet` — convert assertions
  - `html` tagged template — keep
  - `createNestedShadowDom` — keep
  - `assertResultsDeepEqual` — keep, convert `axe.utils.assert` → `expect`
  - `runPartialRecursive` — keep
  - `shadowQuerySelector` — keep
- Replace `assert.*` (Chai) calls inside testutils with `expect` (Vitest)
- Keep `beforeEach/afterEach` registration for fixture cleanup
- The global `checks` and `commons` vars pattern needs to be reworked as module exports
- Validate: migrate 3 representative core tests to import from `testutils.ts` and pass

### 4. Migrate test/core/ Unit Tests (119 files)
- **Task ID**: migrate-core-tests
- **Depends On**: convert-testutils
- **Assigned To**: unit-migrator-core
- **Agent Type**: general-purpose
- **Parallel**: true (can run alongside task 5)
- Rename each `.js` → `.test.ts` (or keep as `.test.js` if TypeScript conversion is too risky for this phase)
- Apply mechanical transformations per PRD Section 2.3.1:
  - `assert.equal(a, b)` → `expect(a).toBe(b)`
  - `assert.deepEqual(a, b)` → `expect(a).toEqual(b)`
  - `assert.include(a, b)` → `expect(a).toContain(b)`
  - `assert.isTrue(a)` → `expect(a).toBe(true)`
  - `assert.isFalse(a)` → `expect(a).toBe(false)`
  - `assert.isNull(a)` → `expect(a).toBeNull()`
  - `assert.isUndefined(a)` → `expect(a).toBeUndefined()`
  - `assert.isDefined(a)` → `expect(a).toBeDefined()`
  - `assert.throws(fn)` → `expect(fn).toThrow()`
  - `assert.lengthOf(a, n)` → `expect(a).toHaveLength(n)`
  - `assert.property(o, k)` → `expect(o).toHaveProperty(k)`
  - `assert.exists(a)` → `expect(a).toBeDefined()`
  - `sinon.stub(obj, 'method')` → `vi.spyOn(obj, 'method')`
  - `sinon.fake.returns(val)` → `vi.fn().mockReturnValue(val)`
  - `sinon.restore()` → `vi.restoreAllMocks()`
  - `this.timeout(n)` → `{ timeout: n }` option on `it()`
- Replace `var` with `const/let` where trivial
- Replace references to global `axe.utils.X` with direct imports where possible (only where safe — some tests explicitly test the global `axe` object)
- Add `import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'` at top
- Move files into `test/unit/core/` directory structure to match workspace config
- Run `pnpm test:vitest` after each batch of ~20 files to catch issues early
- Key files to pay attention to:
  - `test/core/utils/respondable.js` — complex async patterns
  - `test/core/utils/preload.js` — async loading
  - `test/core/base/` — Rule, Check, Audit classes

### 5. Migrate test/commons/ Unit Tests (145 files)
- **Task ID**: migrate-commons-tests
- **Depends On**: convert-testutils
- **Assigned To**: unit-migrator-core
- **Agent Type**: general-purpose
- **Parallel**: true (can run alongside task 4)
- Same mechanical transformation as task 4
- Move files into `test/unit/commons/` directory structure
- Key subdirectories: `color/` (31 files), `dom/` (28 files), `text/` (25 files), `aria/` (24 files), `table/`, `math/`, `forms/`, `matches/`, `standards/`, `utils/`
- Special attention to `test/commons/color/` — these tests require real CSS rendering, some may need to move to browser tests instead of unit tests

### 6. Migrate test/checks/ and test/rule-matches/ Tests (156 files)
- **Task ID**: migrate-checks-tests
- **Depends On**: convert-testutils
- **Assigned To**: unit-migrator-checks
- **Agent Type**: general-purpose
- **Parallel**: true (can run alongside tasks 4 and 5)
- Same mechanical Chai→Vitest transformation
- These tests heavily use `document.getElementById('fixture')`, `checkSetup()`, `MockCheckContext()`, `getCheckEvaluate()` — they run in a browser context
- Move to `test/browser/checks/` and `test/browser/rule-matches/` since they need DOM
- Key subdirectories: `color/` (requires real CSS rendering — validate color-contrast works), `aria/`, `keyboard/`, `forms/`, `tables/`, `navigation/`, `label/`, `language/`, `landmarks/`, `lists/`, `media/`, `mobile/`, `parser/`, `shared/`, `visibility/`
- The `rule-matches/` tests (44 files) also use DOM — move to `test/browser/rule-matches/`

### 7. Build Vitest Integration Rule Runner
- **Task ID**: build-rule-runner
- **Depends On**: create-vitest-config
- **Assigned To**: integration-migrator
- **Agent Type**: general-purpose
- **Parallel**: true (can start alongside unit migration)
- Replace the Karma preprocessor + runner.js pattern with a Vitest-native approach
- Current system: `preprocessor.js` reads `.json` test definitions + companion `.html` fixtures, injects them into `runner.js` template, Karma serves to browser
- New system: Create `test/integration/rules/vitest-rule-runner.ts` that:
  - Dynamically discovers all `test/integration/rules/*/` directories
  - For each: reads the `.json` test definition, reads the `.html` fixture
  - Creates a Vitest `describe` block per rule using the same test pattern as `runner.js`
  - Injects fixture HTML into a `#fixture` div
  - Runs `axe.run(fixture, { runOnly: { type: 'rule', values: [ruleId] } })`
  - Asserts passes/violations/incomplete match the JSON expectations
  - Handles iframes with `waitForFrames` pattern
- Keep all 96 existing `.json` + `.html` fixture pairs unchanged
- Move to `test/integration/rules/` in the integration workspace project

### 8. Migrate Full Integration Tests (53 dirs)
- **Task ID**: migrate-full-integration
- **Depends On**: build-rule-runner
- **Assigned To**: integration-migrator
- **Agent Type**: general-purpose
- **Parallel**: false
- Convert `test/integration/full/*/` tests to Vitest Browser Mode
- Each has an `.html` fixture + `.js` test file
- Tests use `axe.run()`, `axe.testUtils.awaitNestedLoad()`, `assert.*`
- Apply same Chai→Vitest assertion conversions
- Fixture HTML files stay as-is, served by Vite's dev server
- Move test files to use Vitest Browser Mode API where needed (e.g., `page.goto()` for full-page tests)

### 9. Migrate Node + Virtual Rules + API + ACT Tests
- **Task ID**: migrate-remaining-tests
- **Depends On**: convert-testutils
- **Assigned To**: integration-migrator
- **Agent Type**: general-purpose
- **Parallel**: true (can run alongside tasks 7–8)
- `test/node/node.js` (93 lines) — convert to Vitest, stays as Node environment test
- `test/node/jsdom.js` (196 lines) — convert, add deprecation note per PRD-00 Section 4.4
- `test/integration/virtual-rules/**/*.js` — mechanical conversion, these are Node-only (no DOM)
- `test/integration/api/` — convert
- `test/act-rules/` — convert
- `test/aria-practices/apg.spec.js` — convert

### 10. Remove Legacy Dependencies
- **Task ID**: remove-legacy-deps
- **Depends On**: migrate-core-tests, migrate-commons-tests, migrate-checks-tests, migrate-full-integration, migrate-remaining-tests
- **Assigned To**: cleanup-builder
- **Agent Type**: general-purpose
- **Parallel**: false
- Remove from `packages/axe-core/package.json` devDependencies:
  - `karma`, `karma-chai`, `karma-chrome-launcher`, `karma-firefox-launcher`, `karma-ie-launcher`, `karma-mocha`, `karma-sinon`, `karma-spec-reporter`
  - `mocha`, `chai`, `sinon`
  - `http-server`, `start-server-and-test`
  - `jquery`
- Delete files:
  - `packages/axe-core/test/karma.conf.js`
  - `packages/axe-core/test/integration/rules/preprocessor.js`
  - `packages/axe-core/test/integration/rules/runner.js`
  - `packages/axe-core/test/testutils.js` (old version, replaced by `.ts`)
- Audit and remove polyfills per PRD Section 2.4 (grep for polyfill/shim/ponyfill)
- Run `pnpm install` to clean lockfile

### 11. Wire Turborepo + Update Scripts
- **Task ID**: wire-turborepo
- **Depends On**: remove-legacy-deps
- **Assigned To**: cleanup-builder
- **Agent Type**: general-purpose
- **Parallel**: false
- Update `turbo.json` to add:
  - `test:browser` task (depends on build, inputs: test/browser/**)
  - `test:integration` task (depends on build, inputs: test/integration/**)
- Update root `package.json` scripts:
  - `"test"` → runs unit tests via turbo
  - `"test:browser"` → runs browser tests via turbo
  - `"test:integration"` → runs integration tests via turbo
- Update `packages/axe-core/package.json` scripts:
  - Replace old `test` script with Vitest commands
  - Add `"test:coverage": "vitest run --project unit --coverage"`
- Verify turbo caching works (run twice, second should be cached)

### 12. Final Validation
- **Task ID**: validate-all
- **Depends On**: wire-turborepo
- **Assigned To**: validator
- **Agent Type**: general-purpose
- **Parallel**: false
- Run `pnpm test` — all unit tests pass
- Run `pnpm test:browser` — all browser tests pass in Chromium
- Run `pnpm test:integration` — all integration tests pass
- Run `pnpm lint` — no lint errors
- Run `pnpm format:check` — no format issues
- Verify coverage meets thresholds (≥85% lines for `lib/core/`)
- Verify no references to Karma, Mocha, Chai, Sinon remain in codebase (grep)
- Verify no `karma-*` packages in `pnpm-lock.yaml`
- Verify `pnpm build` still works
- Verify the build output (`axe.js`, `axe.min.js`) is unchanged

## Acceptance Criteria
- [ ] All existing tests pass under Vitest 4 with zero regressions
- [ ] `karma.conf.js` is deleted, all `karma-*` devDependencies removed
- [ ] Mocha, Chai, Sinon, jQuery, http-server dependencies removed
- [ ] No polyfills for IE, Edge Legacy, or pre-Chromium browsers remain
- [ ] Browser tests run in Chromium via Playwright (Firefox optional for this phase)
- [ ] Unit, browser, and integration tests wired through Turborepo
- [ ] Code coverage baseline ≥85% line coverage for `lib/core/`
- [ ] Test execution time comparable or better than current
- [ ] `pnpm build` produces identical output
- [ ] No references to legacy test infrastructure remain

## Validation Commands
Execute these commands to validate the task is complete:

- `cd /Users/tk/Code/axe-core && pnpm install` — clean install succeeds
- `cd /Users/tk/Code/axe-core && pnpm build` — build succeeds
- `cd /Users/tk/Code/axe-core && pnpm test` — all unit tests pass
- `cd /Users/tk/Code/axe-core/packages/axe-core && pnpm test:browser` — browser tests pass
- `cd /Users/tk/Code/axe-core/packages/axe-core && pnpm test:integration` — integration tests pass
- `cd /Users/tk/Code/axe-core && pnpm lint` — no lint errors
- `cd /Users/tk/Code/axe-core && pnpm format:check` — formatting clean
- `cd /Users/tk/Code/axe-core/packages/axe-core && pnpm test:coverage` — coverage ≥85%
- `grep -r "karma\|mocha\|chai\|sinon" packages/axe-core/package.json` — should return no matches
- `grep -r "karma.conf" packages/axe-core/test/` — should return no matches

## Notes
- **Dual-running strategy**: During migration, both Karma and Vitest run in CI. Remove Karma only after all tests pass under Vitest.
- **File naming**: Vitest expects `*.test.ts` or `*.spec.ts` — all migrated files must follow this convention.
- **Global `axe` object**: Many tests rely on the global `axe` object being available. In Vitest Browser Mode, this needs to be loaded via a setup file that imports the built `axe.js`. Consider a `test/setup.ts` that does `import '../axe.js'` or `globalThis.axe = await import('../lib/index')`.
- **The `checks` and `commons` globals**: testutils.js sets `var checks = axe._audit.checks` at the module level. This pattern must be preserved for browser tests that use `getCheckEvaluate()`.
- **Integration test preprocessor**: The most complex piece is replacing the Karma preprocessor that converts JSON→JS. The new Vitest runner should use `import.meta.glob` or `fs.readdirSync` to discover test definitions.
- **color-contrast validation**: Per PRD Open Question #2, explicitly validate that color-contrast checks work in Vitest Browser Mode during Phase 1 (it should, since Playwright runs a real browser).
- **Playwright traces**: Enable trace collection on CI failure per PRD Open Question #1. Configure as `trace: 'retain-on-failure'` in Playwright config.
- **Parallel test isolation**: Per PRD Section 5.5, each test should create its own fixture container rather than sharing a global `#fixture`. The current testutils pattern already manages this — ensure it's preserved.
