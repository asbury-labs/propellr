# Phase 4: naming/forms evidence

September 15, 2026. Phase 4 complete on `feat/naming-form-coverage`, based on
`main@0beec0b13cd25472cd5806d5e520bc0333352038`. Implementation remains uncommitted.
At this implementation checkpoint: no PR, push, merge, publishing or subsequent batch.
September 16 delivery authorization is recorded below. Existing local plan edits were
preserved; other worktrees and canonical axe-core were not changed.

## Result

Six selected-partial implementations: `button-name`, `target-size`,
`landmark-one-main`, `image-alt`, `link-name`, `label`. **Not full axe-core parity.**
99 of 105 catalog rules remain unimplemented. Defaults still resolve all 89 stable
default rules, with unsupported coverage explicit. `target-size` remains opt-in.
Engine revision: `propellr-slice@0.2`; canonical rule version remains 4.13.0.

`src/browser/naming.ts` extracts bounded shared naming/visibility work.
`src/browser/naming-rules.ts` preserves native applicability and canonical ANY/NONE
check combinations. Evidence retains check IDs, true/false/unknown results and
scoped related label paths, not name strings or control values. Host capabilities
and catalog were updated together. `sixRuleRequest` explicitly selects six rules;
existing three-rule requests, playbook selection and benchmark workload are unchanged.

[Protocol and expectations](naming-coverage-protocol.md) were written before
implementation/reference execution. [Provenance](../PROVENANCE.md) records reviewed
canonical files and MPL attribution. No package or tool pins changed.

## Executed verification

All commands used project-local Node **26.8.2**, PNPM **12.4.1** and installed
Playwright **1.63.0** browser revisions. No global upgrades or browser provisioning.

- [x] Plan validator before execution, then append-only validation against pre-edit copy.
- [x] `pnpm install --frozen-lockfile`: current worktree, lifecycle scripts disabled.
      This was not a new clean-room install; Phase 1's clean install evidence remains historical.
- [x] `pnpm validate`: build, five strict TypeScript scopes, lint, mandatory Oxfmt,
      **210 tests**: 62 contract, 41 host, 13 playbook, 76 parity/browser, 18 reporting.
- [x] Focused naming parity and IPC checks during implementation; specific failures
      repaired and rerun. Full `test:parity`, `test:host`, `test:reporting` passed in validate.
- [x] `pnpm bench:slice` once: three engine tests passed, unchanged three-rule workload.
- [x] `git diff --check`, `git diff --cached --check`; no dependency, canonical source,
      historical evidence/archive or unrelated worktree changes.

No CI dispatch, screenshot/visual review, assistive-technology certification or
independent reviewer pass is claimed. Existing documented dependency-declaration
TypeScript exceptions remain unchanged.

## Exact exercised coverage

| Work                                                            | Per engine | Across three engines |
| --------------------------------------------------------------- | ---------: | -------------------: |
| New rule/fixture comparisons, one selected naming rule each     |         39 |                  117 |
| Supported fixtures with matching raw semantics/evidence         |         21 |                   63 |
| Explicit unsupported/gap fixtures                               |         18 |                   54 |
| Dynamic six-rule states, each fallback + fresh full + canonical |          6 |                   18 |
| IPC six-rule/history/narrow/partial scan sequence               |          7 |                   21 |

Every new rule has positive, negative, inapplicable and incomplete controls.
Comparisons use separate equivalent contexts at 1280×720, device scale 1,
load plus fonts readiness, Arial/system fallback. Raw outcomes, scoped targets,
impact, applicability, decisive check IDs/results and related-label identities are
compared before grouping. Stable fixture IDs normalize selector representation,
not semantic differences. Original three-rule fixture suite remains passing.

Cases include alt presence/empty/whitespace, ARIA and title; presentation/global-ARIA
and focusability conflicts; href absence, negative tabindex, image-content and
hidden-content link names; explicit/wrapping/empty/hidden labels, own-value exclusion,
placeholder and input-type exclusions; malformed/missing/duplicate/special-character
IDREFs; hidden versus visible references, natively hidden script content, title
fallback, root-local shadow references/labels, slots, same-origin and denied frames.
Character (16,384), traversal-step (2,000) and depth (64) exhaustion are tested for
each new rule. Reader, occurrence, identity, transfer and stale/cancellation limits
remain covered by existing suites.

Combined page is original test-owned HTML, intercepted locally. Test owns browser;
IPC host borrows its explicitly registered page and detaches without closing it.
Its disabled input still requires a label but is excluded from target-size.
Enabled input naming is separately covered; enabled-input geometry is not newly
claimed. No new playbook or product UI.

Host scans show three new issues, persistence with stable IDs/current-only counts,
resolution after repair, recurrence after reintroduction, and failed/passing gates.
Narrower rules cannot resolve prior issues; unsupported excluded scope and denied
frames remain partial/indeterminate, with no false resolution. Realtime requests
remain full-scan fallback. Dynamic results equal fresh full and canonical scans.

## Mismatch dispositions and remaining limits

No unresolved mismatches in the claimed supported fixture scope. Unsupported
fixtures retain exact rule/target dispositions and both raw outputs in the archive.
They are not counted as parity passes:

| Fixture family, each new rule                  | Propellr                                             | Canonical / disposition                                                             |
| ---------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `*-generated`                                  | Incomplete                                           | Generated reference text passes canonical; CSS naming not implemented               |
| `*-embedded-control`                           | Incomplete                                           | Selected option's name passes canonical; embedded control values not implemented    |
| `*-budget`, `*-steps-budget`, `*-depth-budget` | Incomplete plus naming-limit                         | Canonical passes; explicit finite-work limit                                        |
| `*-denied`                                     | Matching visible occurrences, partial frame coverage | No cross-origin injection; canonical selected rules do not prove frame completeness |

Other declared limits: SVG/embedded content, complex ARIA ownership, unreviewed
explicit roles, full accessible-name computation, closed roots and generalized
visibility/geometry/incremental support. Read [Phase 3 limits](slice-protocol.md)
and current protocol together. Six named implementations are not six fully
ported canonical rules, complete WCAG coverage or an accessibility certification.

Initial failures and repairs:

1. Non-tabbable link impact was incorrectly inferred from individual check metadata.
   `lib/core/utils/finalize-result.js` applies rule impact; corrected to serious.
2. Empty IDREF text was incorrectly expected to suppress link contents.
   `accessible-text-virtual.js` selects the first nonempty source; corrected
   implementation and independently documented expectation after source inspection.
3. Firefox exposes native broken-image alt as `-moz-alt-content`. Treat that native
   fallback as alt, not arbitrary authored pseudo text. All three engines retested.
4. Combined enabled input exposed Phase 3's existing unsupported target-size branch.
   Kept that limit explicit and used a disabled form control for the combined
   complete six-rule fixture; separate enabled form-label comparisons remain.
5. Adding related-label evidence exposed selector spelling differences for unnamed
   labels. Added stable IDs to those fixture labels without changing semantics;
   exact related-path comparisons now pass, with no allowlisting of those differences.

## Benchmark scope

One invocation, four existing fixtures (geometry, dense, shadow, frames), three
engines, five measured pairs per cold/warm/changed-full lane: **360 measurements**.
Also retained five long-lived host journeys per engine. Correctness checks passed;
no failed samples or exclusions. Raw outputs retain startup/context load, injection,
scan/transfer, serialization, reporting/gate, host CPU/memory and reusable setup
observations. Browser CPU/memory remain unavailable, not zero. Distributions are
per fixture/engine/lane; five samples do not establish precise confidence intervals.
No six-rule measurement, incremental speedup, headline ratio or broad performance
claim. Benchmark was not rerun for final documentation edits.

## Environment and retained artifacts

macOS 26.6.2 build 25G83 / Darwin 25.6.0, arm64 Apple M4, 10 logical CPUs,
17,179,869,184 bytes RAM. Chromium 153.0.8010.12, Firefox 155.0, WebKit 26.6.
Source and artifact pins are separate; reference bundle integrity is rechecked by tests.

- [Manifest](naming-evidence/manifest.json): per-file source hashes, reference pin,
  browser environments, coverage/counts and every archived file hash.
- [Raw archive](naming-evidence/raw-results.tar.gz): 22 files, original/new raw parity,
  dynamic and IPC results, three benchmark outputs and validation logs. Paths begin
  with `artifacts/`; extract into a disposable directory, not over current outputs.
- Source-tree SHA-256: `25c296531fc63d8fc5ee085af0f4416456bb862f92b4fb2c8c59319a7d5bbc92`.
- Browser bundle SHA-256: `9b24be0466b8055be3c057d297e0891ef4e1323e40f11da336db4be824d3ffde`.
- Archive SHA-256: `f2c14dc9741de06fd67e1957cf215e34f783d245e30489f942988ec0af0889c4`.

Source-tree hash covers runtime, test/tool/benchmark sources and pinned project
configuration, not final documentation timestamps. Archive records actual runtime
checks before final documentation updates. Generated working results can be
replaced by later runs; this retained archive and Phase 3 archives are separate.

**Implementation stop boundary reached.** Phase 4 complete; no failed task remains.
Further rules, optimization, playbooks, UI/adapters and publishing await approval.

## September 16: browser-cache repair and PR delivery authorization

Tony's bare `pnpm test:parity` failed before Firefox launched because Playwright
searched its global cache rather than the installed project-local revision.
Browser-backed test/benchmark scripts now default `PLAYWRIGHT_BROWSERS_PATH` to
`.tools/browsers`, preserving explicit overrides. Added matching `browsers:install`
and aligned CI/README. No download, dependency update or rule change.

Retested the exact failing Firefox epoch test with the variable unset: passed.
Default/custom install paths verified with `--dry-run`, including a path containing
spaces. Pinned `pnpm validate` with the variable unset passed all 210 tests,
build, strict types, lint and Oxfmt. CI has not yet run for this delivery.

Evidence review rechecked all 22 archived file hashes, 63 supported raw comparisons,
18 dynamic states, host lifecycle/gate sequences and benchmark correctness records.
The current built browser bundle still matches the archived bundle hash. The
archived source manifest predates the browser-cache repair: its `package.json`
hash is historical, not the current script revision. Original archive/manifest
remain immutable; benchmark was not rerun for this tooling/documentation repair.

Tony authorized a ready PR, monitoring until CI/review are clean, then merge.
Delivery is limited to Phase 4 plus the browser-cache repair, at most two autonomous
repair pushes under the plan's review-freeze policy. Current-head CI/review and
final merge status will be recorded on the PR. No next coverage batch is included;
its separate plan follows delivery.

## PR #13: first review repair, September 16

Initial head `b4d563f477319af74f95377f6b031faf2cfd9b67` passed
[Ubuntu CI](https://github.com/asbury-labs/propellr/actions/runs/35099406244).
Completed Copilot review produced three inline findings and two suppressed findings.
Verified and handled the complete batch before one repair push:

- **Repaired:** explicit image roles in shared text traversal regressed button
  naming. Native `role=img` descendants now contribute their alternatives; valid
  none/presentation descendants contribute no name; focus/global-ARIA conflicts
  restore native semantics. Shared reviewed predicate also serves new naming rules.
  Button and link fixtures cover five controls each in all three engines.
- **Repaired:** preserve `three-rule-slice` alongside `six-rule-slice`, since the
  existing three-rule request/playbook path remains supported. IPC assertions cover both.
- **False positive:** canonical aria-labelledby check has no relatedNodes output.
  Existing evidence compares scoped native label-check relationships; root-local
  IDREF resolution is tested with opposite-name shadow/light-root controls. No
  invented canonical relation data or weakened comparison.
- **False positive against pinned baseline:** contenteditable-only presentational
  images pass both engines in Chromium/Firefox/WebKit. Canonical
  `is-natively-focusable.js` does not treat contenteditable alone as native focusability.
- **Deferred optimization:** replacing root-local native label queries with an
  index. Explicit JS iteration/retention is bounded; native query internals are
  already documented as not constant time. No adversarial-page timing guarantee.

Focused image-role reproductions and IPC capability tests passed. Full pinned
`pnpm validate` passed all 210 tests, including **40 naming fixtures** (22 supported,
18 unsupported/gap) plus **37 original-slice fixtures** per engine. Shared naming
changed, so one new three-rule `bench:slice` run passed all 360 measurements and
15 long-lived journeys. Repaired-head CI and fresh review remain required before merge.

[Repair manifest](naming-evidence/review-1-manifest.json) and
[repair raw archive](naming-evidence/review-1-results.tar.gz) pin repaired sources,
raw results and logs separately from the original immutable archive. Initial-head
CI/reproductions in that archive are explicitly labeled historical; they are not
repaired-head evidence. Current measured browser bundle SHA-256:
`69fb0c6a9c671ad57df27acdc95c95a81e7e95ef8c068e8cc30c92e5e59dc23f`.
One autonomous repair push prepared; one remains under the delivery policy.
