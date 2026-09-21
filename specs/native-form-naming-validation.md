# Native form naming: implementation evidence

## Complete selected batch, September 16, 2026

Tony approved both intentional divergences on September 16, 2026. Exact assertions
now preserve the original Propellr expectations and canonical behavior separately,
not a blanket mismatch exemption. [Improvements ledger](propellr-improvements.md)
records IMP-001/002 and distinguishes shared rule coverage from Propellr-only rules.

Enabled local-form IPC/history coverage is implemented. Focused host/parity run
passed all seven tests in Chromium, Firefox and WebKit. Six complete naming states
and a narrower selection match fresh full and canonical results per engine; three
additional scans retain excluded-scope, nine-rule geometry and denied-frame gaps.
New/persistent/resolved/recurring history and fail/pass/indeterminate gates are real.
No controls disabled to hide target-size limits. Name/value/option sentinels are
absent from retained Propellr rule evidence.

**Pinned `pnpm validate` passed all 217 tests**: 62 contract, 44 host, 13 playbook,
80 parity/browser and 18 reporting, plus build, five strict type scopes, lint and
required Oxfmt. `test:host`, `test:parity` and `test:reporting` executed within that
command. Existing cancellation/stale-result and prior six-rule suites remain passing.
Final append-only plan validation, `pnpm format:check`, `git diff --check`, local
link checks and all final source/bundle/archive hashes passed. All 26 archived file
hashes verified; blocked evidence, canonical checkout, pins and unrelated worktrees
remain unchanged. No CI, external reviewer, screenshot or assistive-technology
certification claimed.

Per engine, 50 native-form fixtures now have 24 exact supported matches,
24 declared-limit comparisons and two **approved divergences**, with no undisposed
mismatch. Across engines: 72 exact matches, 72 declared limits and six approved
comparisons. Keep all three categories separate. Each engine also records ten new
IPC scans, seven with fresh-full/canonical comparison; 30 scans and 21 comparisons
in total. Six lifecycle states cover absent, whitespace, nonempty and empty value
attributes, alt/label repairs, unrelated edits and option text/selection changes.

Inventory: nine selected-partial implementations, 96 unimplemented out of 105,
89 stable defaults unchanged. **Not nine fully ported rules or full parity.**
Three/six-rule request memberships and capability compatibility remain intact.

Runtime bundle remains identical to the measured blocked-checkpoint bundle, so
its one three-rule benchmark run is retained, not rerun for test/docs-only changes.
At this completion checkpoint, implementation was uncommitted on
`feat/native-form-naming` and delivery was not yet authorized. Tony subsequently
authorized committing the open work and filing a PR, including the proposed
realtime/agent plan. Merge, publishing and next-phase implementation remain gated.
Selected native-form phase [x], no failed task remains; archived approval metadata
preserves its original checkpoint context.

### Completion artifacts

- [Completion manifest](native-form-evidence/completion-manifest.json): final source,
  fixture/bundle hashes, environments, command results, counts and every archived-file hash.
- [Completion raw archive](native-form-evidence/completion-results.tar.gz): 26 files,
  current raw original/new comparisons, native-form IPC/full/reference results,
  focused/global validation logs and retained three-rule benchmark. Extract into a
  disposable directory. Original blocked and foundation/Phase 4 archives unchanged.
- Source-tree SHA-256: `58df188368571a076beaede907263bf5bd234be9bfa07e1c84f50310e01523e9`.
- Browser bundle SHA-256: `ca7770ceaa274887e2aa8b436b38edc9464d01781a6da6bfe033cc64c175b1f4`.
- Archive SHA-256: `43e91d1542c4c224ef4a879175619db9f8561363889508a4f757e700b083df21`.

Runtime source and browser bundle exactly match the earlier measured checkpoint;
completion source-tree hash changes because tests changed. No benchmark rerun was
needed. Commands used unchanged Node 26.8.2 / PNPM 12.4.1 and existing project-local
browser cache. Final docs/metadata are outside the source-tree hash definition.

Deferred: broader naming/role/geometry branches, incremental optimization, remaining
96 rules, new playbooks and product/adapter work. None is implied by this completion.

## Historical blocked checkpoint, before approval

The remaining sections below preserve the pre-approval investigation and command
results. Their blocked/pending wording describes that checkpoint, not current approval.

September 16, 2026. Branch `feat/native-form-naming`, base
`c98d0a3ad76a75f7581abe0bed9b55a0778c1d68`. Work uncommitted.
**Batch not complete. No new supported-scope parity claim.**

Protocol and independently expected controls were authored before implementation
and differential execution: [protocol](native-form-naming-protocol.md).
Draft engine revision 0.3 adds three selected-partial rules, with nine entries
and 96 unimplemented catalog rules. Inventory remains 105, stable defaults 89.
Existing three/six-rule request memberships are fixed explicitly; new capability
is additive. Name/value strings are not retained in Propellr evidence.
No dependencies, tool pins, canonical checkout or original evidence changed.

## Blocking support decisions

Both cases reproduce in Chromium, Firefox and WebKit. Expectations remain unchanged;
no mismatch allowlist or incomplete substitute was added for these ordinary controls.

### 1. Uppercase input type selector

Fixture `input-button-uppercase`:

```html
<input type="SUBMIT" id="uppercase" />
```

Propellr: **pass**, decisive `non-empty-if-present=true`.
Canonical: **inapplicable**, no occurrence.

Native HTML selector matching includes this submit input. Pinned canonical
`lib/core/utils/matches.js` compares attribute equality using
`attributeValue === value`, without the HTML type attribute's case-insensitive
matching. `selector-cache.js` delegates attribute-value selectors to that matcher.
Canonical's default-name evaluator lowercases type, but this input never reaches it.

Classification: source-backed reference applicability discrepancy, pending support
decision. Recommendation: retain native matching, document narrow intentional
improvement rather than copy the reference selector defect. Not approved yet.

### 2. Empty label reuses image input's own default name

Fixture `input-image-empty-wrap`:

```html
<label id="empty-wrap-label"><input type="image" id="empty-wrap" /></label>
```

Propellr: **violation**, all canonical ANY checks false.
Canonical: **pass**, `implicit-label` reports `implicitLabel: "Submit"` and relates
`#empty-wrap-label` even though that label contains no authored text.

Pinned `implicit-evaluate.js` traverses the label with the input as startNode.
`subtree-text.js` visits the input again; `native-text-alternative.js` runs the image
naming methods from `html-elms.js`, ending in `buttonDefaultText` from
`native-text-methods.js`. Its image fallback is `Submit`. The startNode exclusion
in `form-control-value.js` does not prevent this earlier native-name step.

Classification: source-backed conflict between pinned reference behavior and the
approved plan's own-control exclusion/empty-label expectation. Recommendation:
retain violation and document narrow divergence after review. Do not silently
copy the circular label success or replace required violation with incomplete.

## Fixture correction, not regenerated expectations

Initial missing-reference fixture accidentally used `id="missing"` alongside
`aria-labelledby="missing"`, creating a self-reference. Another control's IDREF
list also named that control. Replaced intended missing token with `absent`;
expected pass/fail targets unchanged. Initial raw outputs/log are retained.
The uppercase and empty-image-label cases were split from larger fixtures into
single-control reproductions, preserving their original expected outcomes.
Raw-output review also corrected the initial disposition prose for generated,
embedded and nested-reference gaps: canonical violates those exact reproductions,
not passes. Propellr's independently expected incomplete outcomes did not change.
Explicit reference-outcome assertions now prevent stale disposition prose.

## Verification status

- Plan structural validator passed before execution and against pre-edit snapshot.
- Build and five strict TypeScript scopes passed during implementation.
- Initial differential run: all three engines executed; failed on the two conflicts
  and the accidental self-reference fixture. No passing parity claim from that run.
- `pnpm validate`: **failed**, reaching parity after passing build, five strict type
  scopes, lint, required Oxfmt, 62 contract, 41 existing host and 13 playbook tests.
  Parity/browser: 77 passed, 3 failed aggregate tests (one per engine), solely on
  the two cases above. All 76 prior parity/browser tests passed; new inventory
  assertion passed. Validation short-circuited before reporting.
- Separate `pnpm test:reporting`: 18 passed. **211 passed / 3 failed** total across
  current suites, not a green validation result.
- One `pnpm bench:slice`: three engine tests passed on the unchanged three-rule
  workload. No nine-rule performance claim. No benchmark rerun for docs/test-only edits.
- Final plan append-only validation, `pnpm format:check`, `git diff --check`, and
  source/bundle/archive plus all 29 archived-file hash checks passed. Canonical
  checkout remains clean at its original development commit; historical archives,
  tool pins and unrelated worktrees unchanged.
- No browser provisioning, global upgrades, CI, screenshot/visual/a11y reviewer pass
  or independent normative adjudication claimed.

## Exact comparison scope

Per engine: **50** new fixtures, comprising 24 exact raw supported comparisons,
24 declared-limit comparisons and two unresolved blocking comparisons. Across
three engines: 72 matching supported controls, 72 declared-limit comparisons,
six blocking comparisons. This describes executed fixtures, not batch acceptance.

Declared limits per engine: three denied-frame fixtures have matching visible
occurrences plus explicit frame-unavailable; twelve role/budget fixtures are
Propellr incomplete versus canonical pass; nine generated/embedded/nested-reference
fixtures are Propellr incomplete versus canonical violation. Each has an exact
fixture/rule/target disposition, never counted as a parity pass.

Raw comparison preserves occurrence state, typed frame/shadow/element target,
critical/null impact and decisive canonical ANY/NONE checks/related label paths.
No grouping or gate normalization suppresses either blocking result.

## Environment and retained artifacts

Node 26.8.2, PNPM 12.4.1, Playwright 1.63.0. Darwin 25.6.0, arm64 Apple M4,
10 logical CPUs, 17,179,869,184 bytes memory. Chromium 153.0.8010.12,
Firefox 155.0, WebKit 26.6. Equivalent isolated contexts, 1280×720, scale 1,
Arial/system fallback, load plus fonts readiness. External reference bundle hash
is checked before each comparison run.

New archive/manifest retain final source and fixture hashes, current/initial raw
outputs, prior-suite reruns, benchmark data and command logs separately from
immutable foundation/Phase 4 archives. Initial raw outputs are explicitly historical
and predate the fixture correction; they are not final source evidence.

- [Manifest](native-form-evidence/manifest.json): source pins, environment, command
  outcomes and every archived file hash.
- [Blocked-checkpoint archive](native-form-evidence/blocked-results.tar.gz): 29 files.
  Extract into a disposable directory, not over current artifacts.
- Source-tree SHA-256: `b1c1f6e6545c68632f982da9091972e1940c9926d3c02ad15d0a6c444f9a10b9`.
- Browser bundle SHA-256: `ca7770ceaa274887e2aa8b436b38edc9464d01781a6da6bfe033cc64c175b1f4`.
- Archive SHA-256: `26194272ea07d6c76967ec336a723b30954cca23b202c3208e2579279b4f053e`.

Source-tree hashing covers runtime/tests/tools/benchmark and pinned config, not
final documentation or metadata timestamps. The manifest specifies its exact hash
algorithm. Benchmark retains 360 measurements plus 15 long-lived host journeys;
all original-workload correctness checks passed, with no exclusions. Browser
CPU/memory remain unavailable; no new-rule speed, full parity or incremental claim.

## Historical deferrals at blocker (completed after approval)

Enabled IPC form/history mutation sequence, fresh-full/canonical dynamic comparisons,
separate nine-rule partial geometry gate, and batch acceptance remain unfinished.
No new playbook, enabled-control geometry expansion, PR, push, publishing or next batch.
The original suites remain mandatory; new-rule implementation is provisional until
the above support decisions and remaining host/reporting work are complete.
