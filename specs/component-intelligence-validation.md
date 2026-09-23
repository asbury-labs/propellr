# Component intelligence: phase 1 evidence

## Checkpoint, September 23, 2026

Phase 1 of the [component intelligence plan](propellr-component-intelligence.html):
identity contract and deterministic component proof on owned instrumented fixtures.
Branch `feat/component-intelligence`, base `42f7a47b927c1a5b40b3533f6666ad4d5c2e0312`.
**Work is uncommitted; review, commit, PR delivery and phase 2 are not authorized.**
No provider, model, Jev, dependency, framework, wire command or rule coverage changed.

[Protocol](component-intelligence-protocol.md) was written before implementation.
Two clarifications were made during implementation and are reflected there: an oversized
capture yields `unavailable` rather than `partial` evidence, and a scope-unavailable scan
yields `unavailable` evidence while cancellation/document change reject outright.

## What exists

- `propellr-bridge/1` data attributes, read by `src/browser/components.ts` from
  reader-visited elements in the same guarded browser call as the scan, after raw rules
  are fixed. Bounds: 128 KiB, 256 roots, 64 relations/instance, 32 candidates/target,
  2,000 additional visits.
- Host `ComponentRegistry`/`scanComponents` (`src/host/components.ts`): at most 16
  approved manifests, document-bound association, schema-validated capture. `scanTarget`
  now delegates to `collectScan`; its result is unchanged.
- Portable `resolveEvidence` and `buildRepairView` (`src/components/`): strict schemas,
  forged/unassociated/ambiguous/stale handling, exact-key repair scopes, split records,
  variant obligations and separate counts. Exact `reportScan`/`applyGate` untouched;
  `canonical` is now exported from reporting for shared key encoding.
- `pnpm test:components` in default `pnpm validate` and CI.

## Executed results

**Final pinned `pnpm validate` passed all 246 tests**: 62 contract, 44 host,
13 playbook, 80 parity/browser, 29 component and 18 reporting, plus build, five strict
type scopes (including new negative component examples), lint and required Oxfmt.
Node 26.8.2, PNPM 12.4.1, Playwright 1.63.0; Chromium 153.0.8010.12, Firefox 155.0,
WebKit 26.6 from the project-local cache.

Per engine, identical results in Chromium, Firefox and WebKit:

| Evidence                                         | Result                                                        |
| ------------------------------------------------ | ------------------------------------------------------------- |
| Owned cases matching the hand-authored oracle    | 10 of 10 (instrumented arm)                                   |
| 70 ProductCard + 10 RecommendationTile favorites | 80 violations, 80 exact issues, **2 supported repair scopes** |
| All owned cases                                  | 128 violations: 111 supported, 2 suggested, 15 unattributed   |
| Repair scopes across owned cases                 | 19 (18 supported, 1 suggested with 2 members)                 |
| Raw result, report and gate: capture on vs off   | identical, all owned, exhaustion and parity fixtures          |
| Raw result: instrumented vs uninstrumented arm   | identical for all 10 cases                                    |
| Uninstrumented arm                               | 0 instances, 0 scopes; every violation `unknown`              |
| Existing parity fixtures, nine rules, on vs off  | 127 fixtures identical; no instances or scopes                |
| Exhaustion cases                                 | 5 of 5 report the expected gap; raw findings unchanged        |
| Lifecycle scans                                  | 12 archived plus 1 narrowed; 3 rejected without evidence      |

Cases covered: template defects (70/10), desktop/mobile variants with an unobserved
`compact` obligation, IconButton split by caller callsite rather than blamed, two
sibling data-record defects kept separate, external caller label, identical-markup
lookalikes (one `suggested` via unreviewed binding), same definition ID and instance
tokens in two applications across a frame, two defects in one definition, 13 forged or
corrupt declarations, and open roots, fragments, same-origin frames, explicit
slot/portal owners, an ambiguous slotted target and an unobserved closed root.

Lifecycle, all engines: reorder, removal, rerender, virtualized row reuse, slot
reassignment, owner removal (ambiguous `sb`/`pg0` candidates), portal move, mutation
during transfer (`stale`, zero attributions), cancellation before and during the call,
narrowed scope (`unavailable`), frame navigation (old request rejected, association
lapses to `unassociated-build`, reassociation restores scopes). Earlier evidence never
attaches to a later scan: all three tested cross-step `buildRepairView` calls are rejected.

No-browser contract tests exercise manifest/capture/evidence schema rejection, source
reference traversal, all instance and part reason codes except the defensive
`attribution-collision` merge (not exercised), document-scoped tokens,
non-transitive exclusion of a conflicting look-alike, caller/defect splits, related-path
stripping, frozen inputs with byte-identical report/gate, and scan/epoch/document mismatch.

`pnpm bench:slice` ran once on the final bundle (hash matches) with the unchanged
three-rule workload: 3 engine tests passed, 0 failures. **No component performance or
overhead claim**; `bench:components` belongs to phase 4.

## Failures and corrections

- Validate attempt 2 failed one existing host test
  (`session.test.ts`, "disconnected journey continues": `failed` not `completed`). Not
  reproduced: 12/12 isolated, 5/5 full host project on this branch and on untouched
  `main@42f7a47b`, 8/8 per tree under CPU stress. Likely cause, not confirmed: the test
  re-enables a control while a checkpoint scan may be transferring, which stales it. The
  log is archived. It is recorded as an unreproduced existing timing sensitivity, not fixed.
- Oracle authoring error: `forged` omitted the declared, unexercised `desktop` variant
  obligation. Corrected before the first full pass; implementation unchanged.
- The `visit-limit` fixture was reworked twice because the reader's own identity and naming
  budgets pre-empted the component visit budget. The final fixture exhausts visits
  through detached owned parts.
- A contract test found the evidence schema accepted a self-parent instance; the schema
  now rejects it.

## Review repair 1, PR #16

Copilot found order-dependent parent resolution: a child declared before a parent that
fails only the callsite-caller check stayed `supported`, producing evidence the schema
rejects. The resolver now checks callsites against pass-one status and propagates
`parent-conflicting` to a fixed point. A new contract test failed before the fix and
passes after it. Pinned `pnpm validate` then passed all 247 tests (30 component). The
browser bundle is unchanged, so the benchmark was not rerun. The archive and manifest
below describe the pre-review head `2cc3e09`; `src/components/attribution.ts` and
`test/components/contracts.test.ts` changed afterward.

## Evidence artifacts

- [Manifest](component-intelligence-evidence/phase-1-manifest.json): environments,
  command results, per-engine counts, source hashes and archived-file hashes.
- [Raw archive](component-intelligence-evidence/phase-1-results.tar.gz): 19 files:
  oracle, exhaustion, parity-inert and lifecycle records per engine, all validate logs
  including the failed attempt, and the three-rule benchmark. All hashes re-verified
  after extraction.
- Source-tree SHA-256: `2c49f9877c59fe5cc72e2f55ddd1e9be4b896dc226699db1a1c07e3b550fa4fc`.
- Browser bundle SHA-256: `5f78f9b50072788c7411bcc66a8d65f290e315ce496a9f1f505a084fcc8642e2`.
- Archive SHA-256: `4658ef80f96f1000ec81e707233f75cda159e2d9ce009b728ffc87d1d6db4d30`.

## Limits

Cooperative instrumented fixtures only. Page markers can impersonate registrations;
`source-linked` is manifest provenance, not a security guarantee. A verified mapping is
membership, not common cause: supported scopes are candidate fixes backed by reviewed
bindings, never confirmed defects. No scope closure, repair receipts, uninstrumented
inference, real framework integration, SDK/CLI/wire delivery or overhead measurement.
Deferred to later approved phases 2–4.
