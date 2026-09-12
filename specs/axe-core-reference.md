# Canonical axe-core reference

**Implementation update:** Greenfield phase 1 now exists; see
[foundation evidence](foundation-validation.md). Canonical source/artifact remain
untouched. Phase 3 obtained the published artifact independently in an external
cache and verified its tarball/bundle hashes; `reference.json` records both. See
[slice evidence](browser-slice-validation.md) for executed comparisons.
PR reassessment and other implementation-status prose below describe
the preparation checkout at capture time, not the new root project.

Propellr is the new project. Canonical axe-core is a separate comparison source,
not another workspace package or a legacy compatibility project to maintain here.

- Upstream: https://github.com/dequelabs/axe-core
- Local checkout: `~/code/axe-core`
- Cloned September 11, 2026 from upstream `develop`.
- Recorded commit: `4d306cbb7c456849c6f964444a6a7174d2be502a`.
- Clone verified clean. Dependencies, builds and upstream tests **not run**.

## Approved baseline policy

Approved by Tony September 11, 2026:

| Role                           | Version/ref             | Pinned commit                              |
| ------------------------------ | ----------------------- | ------------------------------------------ |
| Primary accessibility baseline | `v4.13.0`               | `1cc54b900413660610180d631feb73c9e74f4dc9` |
| Secondary upstream comparison  | `develop` at clone time | `4d306cbb7c456849c6f964444a6a7174d2be502a` |

[v4.13.0](https://github.com/dequelabs/axe-core/releases/tag/v4.13.0) was published
August 5, 2026. GitHub reported it as the latest non-draft, non-prerelease release
on September 11, 2026. The local tag resolves to the primary commit above and its
package manifest reports version `4.13.0`. The existing checkout stays on the
recorded development commit; selecting a baseline did not run or rebuild it.

Inventory the complete rule catalog, including best-practice and opt-in rules,
not only WCAG-tagged defaults. Track experimental rules explicitly in a separate
lane. Catalog scope and default rule activation are distinct. Keep comparisons
pinned; adopting a newer release requires reviewed baseline changes. Development
results are secondary evidence, not silent replacements for stable expectations.

For repeatable comparisons, use the selected commit in a disposable upstream
worktree. Follow upstream's own setup; do not add its dependencies, examples,
runner adapters or absolute local paths to Propellr's workspace or CI.
No parity or performance tests have run. Select relevant fixtures, pin both
implementations and review differences rather than treating upstream as an
infallible semantic oracle.

## Published baseline artifact

Registry metadata checked September 11, 2026. The proposed comparison harness
uses the published browser artifact, obtained into an external reference cache,
not a dependency of the Propellr project:

- Package: `axe-core@4.13.0` (no runtime dependencies reported).
- Tarball: https://registry.npmjs.org/axe-core/-/axe-core-4.13.0.tgz
- Integrity: `sha512-UzGt8zg7Ny8djbYMhxl2zuEevVa7r2gJjYY5Lwr1xM7+XU2nd6CkIWFTVcCIbAP63vSz71NaVyyuSk9lHKcy0A==`

The tarball has not been downloaded or executed by this planning step. Verify
integrity and record the extracted bundle hash before comparison. Source commit
and package artifact are separate provenance records; matching version labels
alone do not prove a reproducible build. Do not install upstream development
runners or use this artifact as Propellr's implementation.

## PR #9 reassessment

The compatibility-repair approach was rejected by Tony. Commit `42b655e4` preserves
that work for inspection; none of its engine, bundle, locale-builder or test
assertion changes belong in the revised PR. No runtime fixes are carried forward.
The fresh-schema cache fix remains because current source typechecking needs it.

Cleanup removes 20 direct legacy test dependencies, example packages, Karma
configuration/debugging and legacy CI/nightly lanes. Existing Vitest projects
remain unchanged. Legacy test cases and fixtures stay available for selective
reuse; removing their runners is **not** equivalent to migrating their coverage.

Current CI checks the existing source subset, not full axe-core conformance,
packed-consumer compatibility or a completed modernization phase. Source/bundle
limitations recorded in the preparation baseline remain limitations. Release and
deploy workflows are untouched and must not be dispatched.

## Next product work

Follow the [agreed product brief](propellr-product-brief.md), which supersedes the
incremental-modernization checklist. Build a greenfield workspace with axe-core
accessibility parity as the floor; custom enterprise rules do not replace that
baseline. A new public API and result model are allowed. The
[acceptance contract](propellr-acceptance-contract.md) defines the initial matrix,
parity, benchmark and reporting/deduplication requirements. The [greenfield foundation proposal](propellr-greenfield-foundation.html)
now selects tool pins and a bounded first implementation slice for review. Old runner migration, examples and legacy
packaging are not prerequisites.

PR #5 is unchanged. PR #8 overlaps CI routing and needs reconciliation before
merge; no pull request is merged by this cleanup.
