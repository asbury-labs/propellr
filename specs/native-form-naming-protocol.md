# Native form-control naming protocol

September 16, 2026. Authored before implementation/new differential runs.
Baseline source: axe-core v4.13.0, `1cc54b900413660610180d631feb73c9e74f4dc9`.
Published bundle/integrity remain separately pinned by `reference.json`.

## Reviewed semantics

| Rule              | Selector / matcher                                                                     | ANY in canonical order                                                                                                                   | NONE                  |
| ----------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| input-button-name | `input[type=button], input[type=submit], input[type=reset]`; no-explicit-name-required | non-empty-if-present, non-empty-value, aria-label, aria-labelledby, non-empty-title, implicit-label, explicit-label, presentational-role | none                  |
| input-image-alt   | `input[type=image]`; no-explicit-name-required                                         | non-empty-alt, aria-label, aria-labelledby, non-empty-title, implicit-label, explicit-label                                              | none                  |
| select-name       | `select`; no additional matcher                                                        | implicit-label, explicit-label, aria-label, aria-labelledby, non-empty-title, presentational-role                                        | hidden-explicit-label |

All three have critical rule impact; passes have null impact. No ALL checks.
ANY success never waives a failing NONE. Retain decisive check IDs, booleans and
canonical related-label paths, not name or control-value strings.

Read-only source review: rule JSON; no-explicit-name-required matcher;
non-empty-if-present, attr-non-space-content, implicit, explicit,
hidden-explicit-label evaluators; accessible-text-virtual, label-text,
native-text-alternative and is-natively-focusable; corresponding integration
HTML/expectations, matcher unit cases and non-empty-if-present unit tests.
Original test controls are authored separately, not copied upstream fixtures.

## Independently expected controls

- Input button without value fails; submit/reset without a value attribute pass
  the default-name check. Present empty/whitespace value fails for all three;
  nonempty attribute passes. Read the attribute, never arbitrary input `.value`.
  ARIA, title, explicit/wrapping labels pass. Empty labels/references fail.
- Empty/missing/whitespace image-input alt fails (unlike decorative `img`).
  Nonempty alt, ARIA, title and labels pass. No presentational-role ANY exemption:
  disabled presentation image-input with no alternative still fails.
- Select single/multiple: explicit/wrapping labels, ARIA and title pass. Empty
  labels fail; selected option text never labels its own select, including when
  nested in its own label or referenced ancestor. Placeholder is not a naming check.
  Hidden explicit labels can pass explicit-label but independently fail
  hidden-explicit-label; title/ARIA restores the accessible name.
- Enabled presentation controls still require naming. Disabled presentation
  input buttons/selects pass; global ARIA conflicts remove that exemption.
  Matcher accepts name-required `button`/`img` roles even disabled; reviewed
  non-name-required `gridcell`/`separator` input roles apply only when focusable.
  Other roles remain incomplete rather than pretending full role resolution.
  Native select `combobox`/`listbox` roles are reviewed; other select roles remain
  incomplete. Hidden/nonmatching controls are inapplicable.
- IDREF and explicit-for lookup is root-local. Implicit labels use composed
  ancestors through slots/open roots. Self control value/options excluded.
  Hidden direct references include hidden descendants; visible references exclude
  them. Missing/empty/duplicate/special-character references do not throw.
- Generated names, embedded control values, complex references/ownership and
  unreviewed roles remain incomplete with exact fixture/target dispositions.
  Existing 2,000-step, 16,384-character, 64-depth naming budgets and reader limits
  remain explicit, not native-query constant-time guarantees.

## Integration and verification

Nine selected-partial implementations, 96 unimplemented out of 105; all 89 stable
defaults unchanged. Engine revision 0.3. Keep three-rule and six-rule request
memberships/capabilities unchanged. Select the new batch using explicit requests,
not a plugin API or implicit expansion of existing helpers.

Run original/new parity in Chromium, Firefox, WebKit with separate equivalent
contexts and integrity-checked external reference. Compare raw rule state,
occurrence outcome, typed scope path, impact and decisive check/related-node evidence
before grouping. Every mismatch needs exact reproduction and disposition; gaps
are not supported parity passes. Preserve original expectations and archives.

Enabled test-owned local form runs through real IPC/reporting. Mutate button value
attributes, image alt, label text and selected options deterministically. Explicit
naming selection excludes target-size for complete history assertions; separate
nine-rule scan remains partial/indeterminate for existing enabled-control geometry.
At each supported state compare fallback, fresh full and canonical scans. Verify
new, persistent, resolved, recurring findings; narrower/partial cannot resolve.

Commands under Node 26.8.2 / PNPM 12.4.1: `pnpm test:parity`, `pnpm test:host`,
`pnpm test:reporting`, `pnpm validate`, then one `pnpm bench:slice` for the unchanged
three-rule workload. New raw archive/manifest pin source, fixtures, bundle,
environment, commands and dispositions. No nine-rule performance claim.

## Approved divergences, September 16

Tony approved preserving native type matching and rejecting the empty image-input
wrapping label after reviewing the source-backed conflicts. Expectations are unchanged:
`input-button-uppercase` passes Propellr while canonical is inapplicable;
`input-image-empty-wrap` violates Propellr while canonical passes its implicit-label
check using `Submit`. Compare exact outcomes, target, impact and check evidence on
both sides. Do not turn either case into a blanket allowlist or incomplete result.
These are intentional improvements, reported separately from exact parity matches.
See [improvements ledger](propellr-improvements.md), IMP-001 and IMP-002.

Stop after evidence review. No next batch, PR delivery, merge or publishing.
