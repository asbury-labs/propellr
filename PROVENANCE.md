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
