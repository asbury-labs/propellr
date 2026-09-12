# Phase 3: browser slice evidence

September 12, 2026. One agent: pi / gpt-6-astra,
session `01a096d5-6e32-7314-97d0-6eac44caafef`.
Branch `feat/browser-parity-slice`, base
`3dca4a5ee5f0dc60f90d3d486a1ef6147136c6b3`.
This records the original uncommitted implementation snapshot. Phase 3 only;
no publishing, production or customer data. Tony subsequently authorized PR delivery,
monitoring until clean and merge; GitHub records current-head CI/review status.

## Scope and provenance

`button-name`, `target-size`, `landmark-one-main`, with named branch limits.
[Protocol](slice-protocol.md) fixes expectations, identity/gate policy and sampling.
[Provenance](../PROVENANCE.md) identifies selectively adapted MPL 2.0 logic.
105 canonical rules inventoried: 89 stable default-active, nine opt-in and seven
experimental default-enabled metadata entries in a separate lane. Only three have
partial implementations; 102 remain unimplemented. Defaults never become a silent
three-rule scan. Unknown IDs/options and non-document scopes are not-evaluated.

Published axe-core 4.13.0 tarball SHA-512 verified; extracted `axe.min.js` SHA-256:
`c24f097bd2f451d4f933e8bc7d8d539f8672a2ebcb5cc9f9f3eec8ca9470a0c1`.
External cache: `~/.cache/propellr-reference/axe-core-4.13.0`. No dependency,
upstream build/install or canonical checkout change. Source and artifact provenance
are separately pinned, not a reproducible-build assertion.

## Executed validation

`pnpm validate` passed in this worktree and a fresh disposable source copy under
Node 26.8.2 / PNPM 12.4.1. Fresh `pnpm install --frozen-lockfile` installed 67
packages with lifecycle scripts disabled; no pin/lockfile changes. Fresh copy:
`/tmp/propellr-phase3-fresh.e8upOI` (not another Git worktree).

- [x] Host ESM/declarations and Vite browser build; five strict type scopes.
- [x] Oxlint with warnings denied; mandatory Oxfmt `format:check`.
- [x] 62 contract, 29 host, 11 playbook, 23 parity/browser and 16 reporting tests:
      **141 total**. Parity includes 13 fixtures per engine (39 comparisons), five
      mutation states, frame navigation, cancellation/evaluator errors, transfer
      staleness and identity/occurrence/evidence budgets.
- [x] `pnpm bench:slice`: three browser cases, four fixtures, five measured pairs
      per cold/warm/changed-full lane (originally mislabeled `changed-full-fallback`; see
      review correction below): **360 measured samples**, all correctness
      checks passed. Also 15 long-lived host journeys, 30 checkpoint scans and 15
      reconnect/idle observations. Initial 90 geometry-only samples retained separately.
- [x] Reference integrity re-verification and plan validation with pre-edit snapshot.
- [x] Git diff whitespace checks; canonical source and dependency pins unchanged.

Local environment: macOS 26.6.2 (25G83), arm64 Apple M4, 10 logical CPUs, 16 GiB
RAM; Playwright 1.63.0. Exact browser versions: Chromium 153.0.8010.12, Firefox
155.0, WebKit 26.6. Browser-provider tests ran through Vitest/Playwright, not a
manual visual or assistive-technology pass. `playwright-cli` was unavailable;
project-pinned programmatic browser tests executed instead. Vitest emits its
existing Vite mock-interceptor hook warning; no check was skipped or suppressed.

## Comparison treatment

Both implementations use separate equivalent contexts at fixed 1280x720, scale 1,
Arial/system fonts, intercepted resources, load plus font readiness. Raw results
precede grouping/gating. Compare rule outcomes, scoped frame/shadow targets, impact,
naming evidence source, geometry numbers/thresholds and related targets. Preserve
raw check data and relevant representation differences, not just grouped counts.

Eight supported fixtures per browser have complete selected coverage and matching
raw semantics/evidence. Three fixture cases per browser have classified differences:
CSS-generated names, overlap geometry, and absent main with a denied frame.
Propellr returns explicit incomplete rather than claiming unavailable evidence.
Only those exact rule/target mismatches are allowlisted, with reproduction and
unsupported-scope disposition. Overlap geometry numbers differ too and remain in
raw outputs; they are not normalized away. Negative-tabindex cases match reference incomplete
outcomes but remain partial here. Denied frame has explicit Propellr coverage gap;
selected canonical rules do not establish frame completeness even when their
visible occurrences match. No parity claim for these unavailable branches.

Fixture controls were authored before comparisons and separately checked against
canonical rule definitions/WCAG semantics by the same agent. No second-person or
external independent review is claimed. First execution exposed a control bug:
`button { display:block }` overrode `[hidden]`; both engines correctly evaluated it.
Fixture now explicitly hides the control. An invalid empty axe context argument
was also repaired. Old phase-2 cancellation assertions expecting no scans were
updated to retain actual completed checkpoint scans, not remove evidence.

## Reporting and realtime limits

Exact rule-version/document-generation/ordered-target identity only. No shared-cause,
component, cross-page, cross-navigation or cross-build matching inference. Counts
are current-scan. Caller history is bounded; host retains eight prior raw scans.
Complete equivalent scope/configuration/rules are required before resolution;
partial, stale, narrower, changed-version or incomplete scans cannot resolve history.
Gate recomputes raw counts/membership, enforces explicit thresholds and validates
exception owner/expiry. Incomplete coverage/evidence remains indeterminate.

All realtime requests are full-scan fallback. Synchronous collection shares facts
per epoch; open-root mutation observers cover result transfer. Any frame navigation
invalidates aggregated document ID. Cancellation/loss cannot commit a current scan.
No incremental reuse/speedup, CSSOM/animation-wide atomicity or closed-root inspection
is claimed. Known complex naming, inline/obscured/overflowing/transformed geometry
and unsupported widgets stay incomplete. This is not full accessible-name or
WCAG coverage. Detector limits and undetectable closed roots remain capability limits.

Reader budgets: 2,000 elements, 32 boundary steps, 96 occurrences, 1,024 characters
per target path, 128 KiB raw evidence and 32 diagnostics.
Exhaustion is partial. Operation/event/report retention remains bounded. Page HTML,
name text and screenshots are not retained; selectors can still contain identifiers.
Controlled fixtures only, not hostile-page isolation or production redaction.

## Benchmarks and deferred work

Exploratory only. Browser launch, load/context, injection, scan/transfer, reporting,
gate, serialization and end-to-end timings are separated. Five samples per lane,
fixture and browser, alternating order; no exclusions or speed ratio. Initial small
corpus retained separately from expanded geometry/dense/shadow/frame collection.
Host dialog/reconnect/idle samples measure overhead, not canonical-equivalent
reporting. Process RSS/heap and CPU observations describe harness/host; comparable
browser CPU/memory collection is unavailable, represented as null rather than zero.
Corpus densities before injection: geometry 13 elements/5 buttons, dense 47
elements/40 buttons, shadow 14 elements/2 open roots, frames 23 elements/2 frames.
Each engine/fixture retains separate min/median/p95/max distributions and sample
counts in the manifest. No pooled speed ratio. No long-duration memory,
customer-site workload, statistical precision, mobile, assistive-technology,
Linux CI or full-catalog performance claim.

## Retained evidence and stop boundary

- [Evidence manifest](slice-evidence/manifest.json): source-tree and bundle hashes,
  per-browser environments, exact mismatch dispositions, distributions and archive
  member checksums. Source is pinned by content hash because this work is uncommitted.
- [Raw evidence archive](slice-evidence/raw-results.tar.gz): 19 files containing raw
  comparisons, dynamic results, all final/initial benchmark samples and validation/
  repair logs. Gzip integrity and member listing verified. Extract in a disposable
  directory; its paths begin with `artifacts/`.
- Generated working outputs remain in `artifacts/parity/`, `artifacts/bench/` and
  `artifacts/bench-initial/`. Re-running tests overwrites those working outputs,
  not the retained archive.

Reproduction: `pnpm reference:prepare`, `pnpm validate`, `pnpm bench:slice` under
README's isolated pins. CI recipe updated, not dispatched. Existing worktrees and
canonical source remain untouched; no global tools changed. Phase 3 [x], no
unresolved [f] task. Stop here. Full catalog/branch expansion, actual incremental
execution, general identity matching, enterprise adapters and production isolation
remain outside this slice. The original stop excluded PR delivery; subsequent approval
permits staging, commit, push, review repairs and merge, but not publishing.

## PR delivery verification

September 12, 2026: pinned `pnpm validate` rerun passed all 141 tests, build, five
strict type scopes, lint and mandatory formatting. Archive gzip integrity and diff
whitespace checks passed. No new benchmark or manual visual pass claimed.

Initial GitHub CI rejected job-level `runner.temp` before any jobs ran. Reference
cache setup now uses `$RUNNER_TEMP` in a runner step. Reporting review reproduced
six false resolutions after two later scans changed scope/configuration. Resolution
now also requires compatibility with each issue's last observed scan. Extended
reporting cases failed before the repair and passed afterward; full pinned
`pnpm validate` passed all 141 tests again. Latest-head Linux CI/review status is
tracked on PR #12.

First review repairs add abort/document guards before unsupported-scope returns and
at both direct/checkpoint scan commits. Real browser tests interpose cancellation
after collection and verify no scan commits. Frame geometry uses each document's
viewport. Duplicate occurrences preserve their group's lifecycle; recurrence uses
the immediately prior scan without resolving incompatible older history.

New native-modal and ARIA-dialog controls exposed a real modal applicability defect:
a native modal makes the document root inaccessible, so main-presence is inapplicable,
not a fabricated pass. Repaired and cross-browser comparisons passed. An ARIA-button
control confirms canonical `button-name` is native-only; `aria-command-name` owns
ARIA command naming. No rule-selector expansion made for that false-positive finding.

Evidence selector normalization repaired; naming pass/failure booleans are compared,
while incomplete naming evidence is explicitly classified as unvalidated. Expanded
corpus has 16 fixtures per engine (48 comparisons). Original archive/manifest retain
13-fixture pre-review results and must not be treated as evidence for repaired code.
Focused host, parity/browser and reporting cases passed. Full pinned `pnpm validate`
then passed 147 tests: 62 contracts, 31 host, 11 playbook, 26 parity/browser and
17 reporting, plus build, five strict type scopes, lint and mandatory formatting.

Second review reproduced stale checkpoint emission after a completed scan's child
frame navigated, and false group resolution when the same target reappeared under
a different configuration. Checkpoint recording now rechecks current document and
permissions without discarding completed evidence merely for later cancellation.
Group lifecycle comparison requires compatibility with every retained member's raw
scan, not only the newest member. Both reproductions failed before repair and passed
afterward; a later-cancellation control also passed. Full pinned `pnpm validate`
passed 150 tests: 62 contracts, 31 host, 13 playbook, 26 parity/browser and 18 reporting.
Latest-head CI and review remain tracked on PR #12.

Third review repairs make pass impact null and compare raw impact without semantic
masking, bound the oversized-rule fallback itself, and support redundant native
`role="button"` naming. A 1,024-rule case verifies fallback remains within 128 KiB
in all three engines. Existing ARIA-control fixture now also proves unfocusable
role widgets are inapplicable to canonical target-size, whose matcher explicitly
requires focusability. Full pinned `pnpm validate` passed 153 tests: 62 contracts,
31 host, 13 playbook, 29 parity/browser and 18 reporting.

Closed-root inspection remains outside the approved observable-DOM slice, as declared
before implementation. A late attachShadow hook cannot discover pre-existing closed
roots on borrowed pages. No such hook, page-start instrumentation or closed-root
inspection claim was added. README clarifies that complete selected coverage applies
under declared capabilities, not to undetectable closed-root contents.

Fourth review repairs preserve id-less shadow-sibling ordinals, use composed modal
containment, and classify any unrelated overlapping element box as uncertain geometry,
including narrow non-widget overlays missed by point sampling. Transfer guards now
check document/visual viewport state, element scroll offsets and newly attached open
roots; bounded guards release references at finish. Actual scroll/open-root transfer
cases return stale coverage. Modal-shadow and overlay-strip controls expand the corpus
to 18 fixtures per engine (54 comparisons). Full pinned `pnpm validate` passed 164
tests: 62 contracts, 31 host, 13 playbook, 40 parity/browser and 18 reporting.

The occurrence budget limits retained occurrences, not candidate applicability checks.
An exhausted scan remains partial; a later rule with no candidates is still genuinely
inapplicable. The disabled-button budget control verifies that distinction. Portable
reporting is producer-independent, not another browser evaluator: caller-supplied
coverage must be truthful, while scope/configuration compatibility and raw membership
are checked. Browser-only whole-document limits are not imposed on other producers.
Counts above are per executed revision, not conflicting claims for one revision;
GitHub's PR description identifies the latest verified head and run.

Fifth review's new-root concern was already fixed by transfer guards. Additional
repairs reject old request-scope document generations even when scanTarget's expected
argument defaults to the current target, and stop naming/geometry evaluation when
the 96-occurrence budget is exhausted. Geometry now evaluates at most 96 target rows
against at most 2,000 facts instead of continuing through all widget pairs after
output is full. A real 120-button case confirms exactly 96 geometry evaluations in
all engines; applicability still runs for later rules with no candidates. No spatial
index or speedup claim added. Full pinned `pnpm validate` passed 167 tests: 62 contracts,
31 host, 13 playbook, 43 parity/browser and 18 reporting.

Sixth review adds a 192 KiB serialized reported-scan cap so duplicated two-checkpoint
results stay below the 1 MiB IPC limit. Oversized history is explicitly omitted from
comparison, preserving current raw findings/counts; oversized current-only results
fail before commit. Real IPC tests exercise growing distinct-target history, fallback,
current-result failure and continued connection usability. Stale coverage retains
at most 32 diagnostics, including its stale marker.

Parity now preserves axe's frame/shadow grouping as typed target steps, not only flat
display labels. Main-presence check ID, present/expected evidence and independent modal
fixture expectations are checked. Canonical check data exposes no modal boolean, so
that field is verified from fixtures rather than claimed as a raw reference field.
Contenteditable-only controls were verified in canonical Chromium and the three-engine
fixture: without widget semantics they are not target-size candidates; that suggested
selector expansion was rejected. Native modals rooted in shadow DOM now explicitly
block selected evaluation pending cross-root visibility support. The exact three
reference/unsupported mismatches are retained; no parity claimed for this branch.

Expanded corpus: 19 fixtures per engine, 57 comparisons. Full pinned `pnpm validate`
passed 170 tests: 62 contracts, 32 host, 13 playbook, 45 parity/browser and 18 reporting.

Seventh review corrected a measurement claim: archived `changed-full-fallback` samples
ran direct browser full scans after mutation; their incremental metadata was constructed,
not observed through the host. They do not measure host fallback. Current runner uses
`changed-full` with full/full metadata. Archive bytes remain unchanged; manifest and
protocol carry this correction. Actual request-fallback correctness remains separately
verified through scanTarget. Pinned `pnpm bench:slice` rerun passed three engine cases,
360 measured samples with no failures; all 60 Propellr changed-lane samples record
full/full execution. Working outputs are in `artifacts/bench/`, not the original archive.
No new speedup claim.

Document/open-root focus changes now invalidate transfer, and generated pseudo-element
boxes make geometry in their document incomplete. A generated strip control includes
empty-string CSS content. Catalog checks compare all 105 defaultEnabled/experimental
flags to the pinned reference runtime. The suggested non-modal dialog restriction was
rejected: canonical passForModal/isModalOpen also accepts a visible non-modal native
dialog. Direct reference observation plus a three-engine fixture verifies that behavior;
`observed.modal` denotes the canonical exception predicate, not native :modal state.

Corpus: 21 fixtures per engine, 63 comparisons. Full pinned `pnpm validate` passed 176
tests: 62 contracts, 32 host, 13 playbook, 51 parity/browser and 18 reporting.

Eighth review adds memoized enclosing-frame geometry checks. Parent overlays,
generated boxes, clipping or transformed ancestry make descendant target geometry
incomplete. Checks stop at the authorized scan root, not an embedding test runner's
outer document. New parent-overlay/clip controls retain exact unsupported mismatches.
The supported nested-frame control now fully fits its parent viewport; both engines
use the same revised fixture. Old archived timings are not evidence for repaired code.

Three findings were disproved: canonical button-name passes descendant aria-label
content; real typed-path comparisons already retain frame/element boundaries without
an extra html step; and real history.pushState invalidates BrowserTarget's document
generation before the existing pre-report commit guard. A new real host interruption
case rejects that completed-but-uncommitted checkpoint scan. Host policy remains fixed;
no new transactional layer was added for an unobserved mutable-policy path.

Current corpus: 23 fixtures per engine, 69 comparisons. Full pinned `pnpm validate`
passed 177 tests: 62 contracts, 33 host, 13 playbook, 51 parity/browser and 18 reporting.
Pinned `pnpm bench:slice` also passed all three engine cases after the frame-control
revision; no new speed claim.

Follow-up source review reproduced false complete geometry when the strip overlay
was marked aria-hidden. Such elements still paint. Occlusion and generated-box checks
now use visual CSS/rect evidence rather than accessibility visibility; rule candidates
keep their accessibility visibility filter. The revised strip control failed in all
three engines before repair and passed afterward. Full pinned `pnpm validate` passed
all 177 tests again, and `pnpm bench:slice` passed all three engine cases.

Ninth review moves reference loading before browser launch in parity/benchmark setup.
An empty external cache made all selected setup cases reject with ENOENT and no
Playwright launch events; the successful benchmark run emitted those events and
closed its browsers. Zero-sized focusable widgets now produce incomplete geometry
rather than disappearing. Shared composed-ancestor checks cover same-document
transforms, clip paths and actual clipping bounds as well as enclosing frames.

Both proposed dialog changes contradict pinned source: isModalOpen explicitly selects
`dialog, [role=dialog], [aria-modal=true]`, and has-descendant-after propagates any true
check across frame results, including dialog exceptions. Updated role-only and new
child-dialog controls match canonical results in all three engines. No incompatible
rule-semantic change made. Corpus now has 27 fixtures per engine (81 comparisons).
Full pinned `pnpm validate` passed all 177 tests; `pnpm bench:slice` passed three cases.

Tenth review's ancestor concern was already fixed. Default resolution now asserts the
entire rule/version/options set, backed by reference activation checks, instead of a
loose count. Geometry neighbors retain typed frame/shadow/element paths, including
empty-neighbor comparisons. New shadow/frame small-target controls failed the former
comparator: canonical related paths were already fully scoped, so its prefixing was
wrong. Typed comparison now passes without flattening or invented prefixes.

Whitespace/fallback role-token lists are explicitly not-evaluated with partial coverage,
not silently omitted widgets. Full ARIA fallback parsing and case reinterpretation are
not added to this slice. New role-token controls verify the limitation. Current corpus
has 30 fixtures per engine (90 comparisons); all 177 validation tests and three benchmark
cases passed under pinned tools.

Eleventh review preserves scan-document-changed diagnostics through direct-scan and
journey failure reporting, including the final commit guard. Real history.pushState
interruption cases reproduced the generic-code problem and now assert the dedicated
code with no completed scans. Full pinned validation passed 178 tests (34 host tests);
the 30-fixture/90-comparison corpus is unchanged. Browser/comparator code has not
changed since the preceding successful three-engine benchmark run.

The other finding was disproved by source: changedKeys and evidence differences are
always checked against allowedMismatches, even on unsupported fixtures. Undefined
allowlists fail those checks. The later unsupported exemption only avoids an additional
unclassified-mismatch error after explicit allowlist checking; it does not bypass it.

Twelfth review replaces page-global analyzer lookup with lexical bundle injection and
a host-held handle, released after each scan. Three-engine controls preinstall a fake
empty analyzer and then replace it with a throwing analyzer; real findings remain intact.
Mutation-transfer tests still interpose actual DOM changes, and evaluator-error tests now
throw from an actual DOM method rather than the intentionally ignored analyzer global.
This closes the namespace trust bug, not all hostile main-world tampering.

Unread-subtree state now stays separate from capped diagnostics, including identity
limits that could conceal main landmarks. A real 32-identity-gap plus opaque-frame control
returns incomplete even though no frame diagnostic fits. The suggested benchmark leak
was disproved: context close and warm.clear are inside the fixture loop, before the next
fixture can replace either entry. No benchmark code change was needed.

Full pinned validation passed 184 tests: 62 contracts, 34 host, 13 playbook, 57 parity/browser
and 18 reporting. The 30-fixture/90-comparison corpus remains unchanged. Pinned benchmark
rerun passed all three engine cases, including the host/session lane.

Thirteenth review distinguishes any direct slot assignment (including text) from
rendered fallback. The unflattened assignedNodes check decides whether fallback is
suppressed; assigned elements still retain light-DOM identities. Text-only and real
fallback controls both match canonical results in three engines.

Stale checkpoint scans now block progression and remain outside report history, with
the stale reason preserved. A real transfer-time DOM mutation verifies blocked/skipped
checkpoints, no completed scan, successful cleanup and a later direct scan with no stale
history baseline. Partial but stable coverage remains distinct from stale coverage.
Pinned validation passed 185 tests (35 host, other suite counts unchanged), covering
32 fixtures per engine / 96 comparisons. All three benchmark engine cases passed again.

Fourteenth review's four navigation findings share one rejection path: browser awaits
can reject before their following guard. scanTarget now rechecks cancellation/document
generation on rejection across bundle loading, injection, scan and finish; only created
handles are cleaned up. Direct operation mapping also gives known document changes
priority over generic evaluator errors. Three real destroyed-context tests cover the
injection, collection and finish boundaries.

Generic tabindex was another canonical-candidate false positive. widget-not-inline-matches
requires widget role type as well as focusability; an unroled div with tabindex remains
inapplicable for target-size. A new three-engine control verifies that behavior. No rule
broadening made. Pinned validation passed 188 tests (60 parity/browser); corpus now has
33 fixtures per engine / 99 comparisons. Browser/comparator code is unchanged since the
preceding benchmark run; no new timing claim.
