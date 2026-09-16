# Phase 4 naming/forms protocol

Expectations recorded before implementation and differential execution, September 15, 2026.
Baseline: axe-core 4.13.0, source `1cc54b900413660610180d631feb73c9e74f4dc9`;
external published artifact integrity remains in `reference.json`. No dependency changes.

## Checks and applicability

| Rule      | Selector/matcher                                                                                   | ANY                                                                                                                      | NONE                  |
| --------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| image-alt | Visible native `img`; no-explicit-name-required matcher                                            | has-alt, aria-label, aria-labelledby, non-empty-title, presentational-role                                               | alt-space-value       |
| link-name | Visible native `a[href]`                                                                           | has-visible-text, aria-label, aria-labelledby, non-empty-title                                                           | focusable-no-name     |
| label     | Visible `input, textarea`; exclude input types hidden/image/button/submit/reset (case insensitive) | implicit-label, explicit-label, aria-label, aria-labelledby, non-empty-title, non-empty-placeholder, presentational-role | hidden-explicit-label |

No ALL checks. A positive ANY cannot waive a failing NONE. Violations outrank
uncertainty; unknown evidence cannot become a pass. Impact: image/label critical,
link serious. Rule-level impact overrides individual check metadata, including
non-tabbable links. Pass impact is null.
Default inventory remains all 105 baseline rules, 89 stable defaults. Three new
stable default rules become selected-partial, leaving 99 unimplemented. Existing
three-rule request and benchmark stay unchanged. Explicit six-rule selection is
separate from defaults.

## Independently reviewed expectations

- Images: named alt and empty alt pass; absent alt fails; whitespace-only alt
  fails even with an ARIA name. Valid presentation/none suppresses whitespace
  failure. Focusability (including negative tabindex) or global ARIA conflicts
  prevent presentational exemption. Hidden images are inapplicable. Nonfocusable
  separator-role image is inapplicable; focusable separator requires a name.
- Links: text, image alt content, ARIA name/reference and title pass. Empty,
  missing/empty references, hidden-only content fail. Without href inapplicable.
  Negative tabindex does not waive missing text, but removes focusable-no-name
  failure. Empty reference text falls through to contents for the separate
  accessible-name check; it does not suppress otherwise valid link text.
  Native image descendants with `role="img"` contribute their name; valid
  none/presentation descendants contribute no name. Focus/global-ARIA conflicts
  restore native image semantics. These controls also cover existing button-name.
- Forms: nonempty explicit/wrapping labels, ARIA, title and placeholder pass.
  Empty/missing labels fail. Hidden explicit label contributes positive explicit
  check but fails hidden-explicit-label when accessible name is absent; title or
  ARIA can supply that name. Exclude the control's own value from wrapping labels.
  Enabled presentation-role inputs are still focusable and require labels;
  disabled presentation inputs pass. Select and nonnative widgets stay outside
  this rule. Root-local references do not cross shadow roots or frames.
- Hidden direct references include their hidden descendants; visible references
  exclude hidden descendants. Missing, duplicate and CSS-special-character IDREFs
  must not throw. Slots use composed content, preserving light-DOM identity.
- Deterministic full scans: broken, persistent, repaired, recurring, unrelated
  mutation, changed alt/reference/label text. Incremental requests remain explicit
  full-scan fallback and equal fresh full/canonical results.

## Bounded scope

Shared 2,000-step / 16,384-character naming budget and 64-level depth limit,
existing reader/occurrence/evidence bounds retained. Exhaustion yields incomplete
with naming-limit, never guessed pass. No full accessible-name engine: generated
content, SVG/embedded content, embedded control values, complex ARIA ownership or
role-dependent naming require explicit incomplete evidence. Selected ordinary
native controls must pass/fail, not use incomplete stand-ins. Unknown explicit
image roles cannot silently assert matcher coverage. Every reproduced unsupported
comparison needs an exact fixture/rule/target disposition; no blanket allowlist.

Use root-local native references/labels with bounded iteration, separate ANY
check sources from accessible-name precedence and NONE checks. Retain check IDs,
boolean/unknown results and scoped related label paths; do not retain name
strings or raw input values. Related paths correspond to canonical explicit/implicit
label-check `relatedNodes`. Canonical aria-labelledby emits boolean check evidence
without relatedNodes; opposite-name shadow/light-root fixtures verify its root-local
resolution separately. Reference raw outputs remain test artifacts only.

Budgets cap explicit traversal/string processing and retained evidence. As in the
reader, native DOM/layout query internals are not a constant-time guarantee;
root-local `querySelectorAll` can still scan/materialize labels before bounded
iteration. A reusable label index is deferred optimization, not a measured speed
or adversarial-page execution-time guarantee.

## Verification and artifacts

Run independent equal fixture contexts per implementation in Chromium, Firefox,
WebKit, same load/fonts/viewport settings as `test/support/parity.ts`. Compare raw
outcome, target path, impact, rule applicability and decisive check evidence before
grouping. Pin fixtures and implementation bundle hashes in
`artifacts/parity/*-naming.json`; preserve raw failures and dispositions.

One original combined test-owned local fixture is exercised through existing IPC host
and reporting. Its form input is disabled: label still applies, while target-size
excludes disabled controls. Enabled form naming is tested separately; Phase 3's
unsupported enabled-input geometry is not expanded. No new playbook or UI product surface. Verify six explicit rules,
full-state issue continuity/new/resolved/recurring, narrower and denied-frame scans
cannot resolve prior findings, and gate fail/pass/indeterminate. Related label fixtures have stable explicit IDs,
so selector spelling differences do not masquerade as relationship mismatches. Existing
cancellation/stale-result suites remain mandatory.

Commands: `pnpm test:parity`, `pnpm test:host`, `pnpm test:reporting`, pinned
`pnpm validate`, then one `pnpm bench:slice` run for the unchanged three-rule
workload. No six-rule performance claim. Phase 3 raw evidence/benchmark archives
are historical. Record new evidence in `naming-coverage-validation.md`; stop for
review without PR delivery or another batch.
