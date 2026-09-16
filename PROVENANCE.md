# Provenance and licenses

This worktree uses branch `feat/greenfield-foundation` in the existing Propellr
repository. Development began at preparation commit
`46df83acde9421908d9b962d39d70b2da203426e`; PR delivery rebases only the greenfield
implementation onto `main@3a9d1ff08d707f3b0a08c8543d0f2584718b7eaf`, without
carrying preparation repair commits into the PR. Git history and other worktrees remain
intact. Its root tree is intentionally rebuilt without inherited package graphs,
build plugins, tests or release automation.

Product/acceptance/architecture/reference documents and contract prototypes came
from Tony's uncommitted preparation files on September 12, 2026. They remain
requirements and historical design inputs. `src/contracts.ts` adopts the prototype
output model while deriving request shapes from new executable schemas. Negative
examples were retained in `test/types/`. The original prototype remains in `specs/`
for provenance, not as a second runtime schema or executable implementation.

The inherited axe-core MPL 2.0 license is retained verbatim at
`licenses/axe-core-MPL-2.0.txt` from
`packages/axe-core/LICENSE` at the preparation commit. No upstream engine logic,
fixtures, standards data or bundle is reused in phase 1. The private project does
not assert a new public distribution license; review licensing before publication
or selective source reuse.

Canonical source and future artifact pins are in `reference.json` and
`specs/axe-core-reference.md`. No canonical build/install or artifact download was
performed. Dependency licenses remain with their installed packages; exact resolved
versions and integrity values are recorded by the new lockfile.

## Phase 3 selective reuse

Canonical checkout remains on `4d306cbb7c456849c6f964444a6a7174d2be502a`, read-only.
Source below was read with `git show v4.13.0:<path>`, pinned to
`1cc54b900413660610180d631feb73c9e74f4dc9`; no upstream install/build ran.

- `src/catalog.json`: inventory derived from all 105 `lib/rules/*.json` definitions.
  IDs, activation flags and tags are upstream standards/rule data under MPL 2.0.
- `src/browser/geometry.ts`: TypeScript adaptation of
  `lib/commons/math/rect-has-minimum-size.js`, `get-offset.js` and rounding behavior
  in `lib/checks/mobile/target-offset-evaluate.js`. Retains 0.05px minimum-size
  margin and single-decimal radius rounding. Rect splitting, obscuration and
  overflowing-content algorithms are not ported; those branches stay incomplete.
- `src/browser/index.ts`: new reader/evaluator using selected rule/check semantics
  from `lib/rules/{button-name,target-size,landmark-one-main}.json`,
  `widget-not-inline-matches.js`, `no-explicit-name-required-matches.js`,
  `lib/checks/generic/has-descendant-{evaluate,after}.js`,
  `lib/checks/shared/aria-labelledby-evaluate.js`, and
  `lib/checks/mobile/target-{size,offset}-evaluate.js`. Main presence aggregates
  across accessible frames; multiple mains do not fail this rule. Naming checks
  are an OR, not a complete accessible-name computation API.

Adapted source files carry MPL 2.0 identifiers. Retained full license:
`licenses/axe-core-MPL-2.0.txt`. Original fixture HTML and expectation assertions
were authored here; no upstream fixture corpus or runtime shell was copied.

Published `axe-core@4.13.0` tarball was obtained independently in an external cache.
Both tarball SHA-512 and extracted `axe.min.js` SHA-256 are verified by
`tools/reference.ts`; tests verify bundle hash again before execution. Bundle,
package metadata and upstream license remain outside the workspace/dependencies.
Source and package artifact pins are separate provenance records, not a claim
that the published artifact was reproducibly built from the tagged commit.

## Phase 4 selective reuse

Same canonical source and published artifact pins, no upstream writes/install/build.
`src/browser/naming.ts` extracts the bounded Phase 3 helpers; `naming-rules.ts`
adapts selected semantics from:

- `lib/rules/{image-alt,link-name,label}.json`, `label-matches.js`,
  `no-explicit-name-required-matches.js`.
- `lib/checks/label/{alt-space-value,explicit,implicit,hidden-explicit-label}-evaluate.js`.
- `lib/checks/shared/{has-alt,presentational-role,aria-label,aria-labelledby}-evaluate.js`,
  `lib/checks/generic/has-text-content-evaluate.js`,
  `lib/checks/keyboard/focusable-no-name-evaluate.js`.
- `lib/commons/text/{accessible-text-virtual,subtree-text,label-text}.js`,
  `lib/commons/aria/arialabelledby-text.js`, `lib/commons/dom/{is-focusable,is-in-tab-order}.js`,
  and global attribute membership in `lib/standards/aria-attrs.js`.

Reviewed upstream integration fixtures at
`test/integration/rules/{image-alt,link-name,label}/` and focused hidden-label,
alt and focusability check tests. New HTML and expectations in
`test/fixtures/naming.ts` are original controls, not copied upstream files.
MPL 2.0 identifiers and retained license cover adapted logic/data. Runtime remains
independent; no canonical evaluator or bundle is loaded as Propellr implementation.

Rule-level impact overrides check metadata. Canonical accessible text falls through
empty IDREF text to later sources. Both details were confirmed against source/raw
outputs after the first differential run corrected initial protocol expectations.
Firefox exposes `-moz-alt-content` for native broken-image alt fallback; this is
handled as native alt, not arbitrary CSS-generated text. All other declared
Phase 3 geometry limits remain unchanged. Combined six-rule fixture uses a disabled
input so label applies without claiming enabled-input target-size support.

Engine revision is `propellr-slice@0.2`; catalog/version and activation remain
canonical 4.13.0. New rules are selected-partial, never full-catalog completion.
Phase 3 evidence archives remain historical and unchanged.
