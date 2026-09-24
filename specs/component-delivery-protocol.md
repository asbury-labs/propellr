# Component delivery protocol, phase 3

September 24, 2026. Authored before implementation. Plan:
[component intelligence](propellr-component-intelligence.html), phase 3. Base `main@ae10343a`,
branch `feat/component-delivery`. Builds on the [phase 1 protocol](component-intelligence-protocol.md);
bridge, capture, evidence and grouping versions are unchanged.

**No-Jev decision:** Tony directed phase 3 before phase 2 on September 24. Delivery is
deterministic and does not depend on any provider result. The realtime/agent plan is not
implemented here; this protocol adds one operation and does not change existing scheduling.

## Vue integration (fixture-scoped)

- Dependencies: `vue@3.5.43` and `@vitejs/plugin-vue@6.0.9`, exact devDependency pins. Neither
  package, nor any of the 19 new transitive packages, declares install lifecycle scripts;
  `.npmrc` still disables them. No runtime dependency is added to Propellr.
- The bridge lives with the fixture (`test/fixtures/components/vue/bridge.ts`). It is an opt-in
  Vue plugin plus a composable that use only public APIs: `app.provide`, `provide`/`inject`,
  `useId` and attribute binding. Apps that do not install the plugin render no markers.
- Ownership follows the Vue component tree, not the DOM. A component's parts carry its own
  `useId()` token as owner. `inject` gives the parent instance token. Slot content is owned by the
  template that wrote it (the caller). Teleported parts keep their component owner. Multiple root
  nodes bind the same root declaration (a fragment instance).
- The plugin sets `app.config.idPrefix` to the application token so two apps in one document
  cannot collide. Callsite and data-record tokens come from explicit props, never inferred.
- The fixture is compiled with the real Vue SFC compiler in production mode, with no devtools
  hooks and minified output. Display names are not identity; two components share `name: "Card"`.
- The expected manifest is hand-authored with relative source references. Source references stay
  in the host registry; props, input values and text are never captured.
- Limitation: `.vue` script blocks are compiled by the Vue plugin, not type-checked by `tsc`
  (no `vue-tsc` for TypeScript 7). The bridge, entry and host code remain strictly checked.

## Wire operation, `analyzeComponents`

- Capability `component-analysis@1` appears in `Session.capabilities` only when the host is
  constructed with `components` options. Existing commands, inputs and outputs are unchanged.
- Input: the `scan` input shape (`propellr/0.1`, `requestId`, `sessionId`, `scan`), validated by
  the shared schema map. The same admission, origin, document and one-active-operation rules apply.
- A host without component support returns `capability-unavailable`. A pre-phase-3 host rejects
  the unknown command as `invalid-request`. Events of the new kind reach only sessions where
  a client requested it. Clients must ignore unknown operation kinds and never treat them as scans.
- Host-owned configuration maps attached target IDs to approved builds. Before each analysis the
  host associates those builds with the current document ID; navigation still invalidates
  in-flight evidence through the existing scan guards. Managed targets have no builds.
- Execution: one guarded `scanComponents` call. Stale, cancelled or document-changed scans fail
  like `scan` and commit neither raw results nor enrichment. Otherwise the host first commits the
  exact reported scan to session history and emits a `raw-scan` event. It then completes the
  operation with `{ scan, enrichment }`.
- Enrichment carries scan ID, document ID, epoch and a per-session generation counter, then
  either `available` with the repair view, or `unavailable`/`evicted` with a reason. The repair
  view is computed by the portable `buildRepairView`; raw counts, report and gate are those of the
  exact scan and are never altered.
- Bounds: scan result 192 KiB (existing). Serialized view at most 192 KiB (host limit
  `componentViewBytes`, 1,024–196,608, default 196,608); a larger view is `unavailable`
  (`component-result-limit`), while the raw scan is still delivered. At most eight available views
  per session; older ones are rewritten to `evicted` with an operation event. Replies stay at
  1 MiB and requests at 65,536 bytes. Reconnect never replays browser actions.
- Session end releases the association; borrowed pages, contexts and browsers stay open.

## Verification

Real Vue fixture collection in Chromium, Firefox and WebKit, compared with the hand-authored
oracle: the 80-occurrence/two-scope grid through the SDK and CLI; different-DOM/same-cause
variants; same-definition/different-cause data records; caller-owned slots and callsites;
teleport; fragment; reused display names; two applications in one document; an app without the
plugin. Manifest cases: missing, stale build and conflicting definitions. IPC cases: opt-in off,
stale transfer, cancellation, page loss, reconnect, event gap, view byte limit, view eviction,
borrowed cleanup, and re-observation after rerender. `pnpm validate` includes all of these. If
browser analysis changes, `pnpm bench:slice` runs once. No performance or agent-usefulness claim.

Stop after evidence review. No React adapter, framework introspection, rollout or automatic repair.
