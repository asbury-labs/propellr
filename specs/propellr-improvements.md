# Propellr improvements over axe-core

Evidence ledger, started September 16, 2026. Baseline: **axe-core 4.13.0**, source
`1cc54b900413660610180d631feb73c9e74f4dc9`; published artifact pinned separately in
[reference.json](../reference.json). Claims apply only to the named cases/version,
not every axe-core release or full accessibility coverage.

## Confirmed semantic improvements

Tony approved both intentional divergences on September 16, 2026. Both behaviors
were reproduced in Chromium, Firefox and WebKit before approval. Focused tests
with exact divergence assertions pass in all three engines. Pinned `pnpm validate`
passed all 217 tests, including enabled native-form IPC/history. Raw failing
checkpoint evidence remains preserved, not relabeled as a passing parity run.

| ID      | Rule / case                                                             | axe-core 4.13.0                                                                                | Propellr 0.3                                         | Why better                                                                |
| ------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------- |
| IMP-001 | `input-button-name`: `<input type="SUBMIT">`                            | Inapplicable; uppercase type skipped by virtual selector's case-sensitive attribute comparison | Evaluated, passes via absent-value default name      | Honors native HTML type matching instead of silently omitting the control |
| IMP-002 | `input-image-alt`: image input inside an otherwise empty wrapping label | Pass; `implicit-label` borrows the input's own default `Submit` text                           | Violation; empty label does not name its own control | Avoids circular naming success caused solely by adding an empty label     |

Evidence for both: [source investigation and raw archives](native-form-naming-validation.md),
[original fixtures](../test/fixtures/native-form-naming.ts),
[three-engine differential assertions](../test/parity/native-form-naming.test.ts).
Fixture IDs: `input-button-uppercase`, `input-image-empty-wrap`.
These are approved, narrow semantic improvements, **not exact parity matches**.
No upstream issue/acceptance/fix is claimed; no upstream report has been filed.

## Rule coverage ledger

Current inventory: **105** canonical rules, **89** stable defaults,
**9 selected-partial implementations**, **96 unimplemented**.
Selected-partial means reviewed branches only, not a fully ported canonical rule.

| Implemented rule IDs                                  | Scope / evidence                                                                                                              |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `button-name`, `target-size`, `landmark-one-main`     | [Foundation browser slice](browser-slice-validation.md); bounded naming, geometry and main-presence branches                  |
| `image-alt`, `link-name`, `label`                     | [Naming/forms batch](naming-coverage-validation.md); native controls with explicit branch limits                              |
| `input-button-name`, `input-image-alt`, `select-name` | [Native form batch](native-form-naming-validation.md); selected batch complete with explicit branch limits; IMP-001/002 apply |

**Propellr-only rule IDs: 0.** All nine exist in the canonical catalog. Porting three
more canonical rules expands Propellr coverage, not coverage beyond axe-core.
The two fixes above improve behavior within shared rules. Unknown roles, complex
names, generated content, exhausted budgets and inaccessible scope remain explicit
gaps, not additional coverage or passing results. No speed advantage is claimed.

## Recording future improvements

Append stable IDs with baseline/source pin, minimal reproduction, both raw outcomes,
reason, implementation revision, verification scope and approval/disposition.
Separate semantic bug fixes, genuinely additional rule coverage and host/reporting
capabilities. An internal Propellr repair is not automatically an improvement over
axe-core. A proposed idea or untested claim belongs below, not in the confirmed list.
Keep historical evidence when later reference releases fix a discrepancy; record
that version rather than silently deleting the entry.

## Candidates awaiting evidence

None recorded. No inferred wins from rule counts, API differences or benchmark timings.
