# Semantic text-capture protocol, phase 1

September 29, 2026. **Draft for Tony's approval, not frozen or implemented.** Plan:
[Jev semantic review](propellr-jev-semantic-review.html), phase 1.
Base `8c401680b6d5bb70ce825cdb66a0d7ee5fa8ddb3`, branch `feat/jev-semantic-review`.

## Approval boundary

| Gate                                                            | State                                               |
| --------------------------------------------------------------- | --------------------------------------------------- |
| Capture fields, bounds, redaction and synthetic-only disclosure | **Pending Tony**                                    |
| Capture/redaction implementation                                | Blocked until protocol approval                     |
| Provider calls, credentials, spend and text egress              | Not authorized; separate phase 2–3 records required |
| Customer pages, source, production or live channels             | Not authorized                                      |

Approving this protocol authorizes phase 1 implementation and its no-provider tests only.
After approval, record approver, date and SHA-256 of the approved draft snapshot in an
amendment; preserve that snapshot's history. Subsequent semantic evaluation must pin the
final approved protocol revision, not a self-referential hash embedded in its own bytes.
Previous component-attribution approvals cover text-free structure, not this capture.
No record is manufactured on Tony's behalf.

## Separation and activation

Proposed schema `propellr-text-capture/1`, collector `{ id: "semantic-text", version: "1" }`.
Use `scanComponents(..., { text: true })` beside the existing structural option. Default off:
no text collection and no added return property. When enabled, return `text` beside `scan`,
`evidence` and optional `structure`, never inside `ScanResult` or occurrence evidence.
No IPC command or advertised capability is added in phase 1.

Collection shares the synchronous browser call, document/epoch and mutation/transfer guards.
The host validates page-derived capture before redaction. Types derive from strict host
schemas; browser imports types only, not Zod, Node or provider clients.

Raw rule order, evaluation, evidence, coverage, reporting and gate policy remain unchanged.
Capture cannot add, drop, reorder, suppress or reinterpret findings. Compare identical scan
metadata in on/off tests, excluding independently generated scan IDs, epochs and measured
`durationMs`; raw rules/coverage, `reportScan` and `applyGate` must otherwise be byte-identical.
No claim that enabling extra collection leaves measured duration identical.

## Population and passing-check identity

One record per `(rule id/version, exact scoped target)` whose **retained** outcome is `pass`
for these seven rules: `button-name`, `link-name`, `label`, `image-alt`,
`input-button-name`, `input-image-alt`, `select-name`. No review record for a violation,
incomplete, inapplicable or not-evaluated outcome. Do not evaluate unselected rules merely
to populate this sidecar. A zero-target available capture is valid only when the selected
naming population was evaluated and genuinely contains no passes; absent usable naming
results is `unavailable`, not an empty successful review.

“Canonical name” here means **text of the rule's own successful check**, not a complete
accessible-name computation. Reuse the value at the point the rule already computes it,
under the same naming budget. Never call `name()` again or select a later alternative for
capture. The canonical ANY-check order is unchanged; accompanying NONE checks still decide
whether the occurrence passes. `button-name` uses its existing successful `name()` candidate.

| Rule                | Successful source/check and capture treatment                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `button-name`       | `aria-labelledby`, `aria-label`, associated `label`, `contents`, `title`, in existing evaluator order                                  |
| `link-name`         | `has-visible-text`, `aria-label`, `aria-labelledby`, `non-empty-title`                                                                 |
| `image-alt`         | `has-alt` (including explicitly empty alt), `aria-label`, `aria-labelledby`, `non-empty-title`, `presentational-role`                  |
| `label`             | `implicit-label`, `explicit-label`, `aria-label`, `aria-labelledby`, `non-empty-title`, `non-empty-placeholder`, `presentational-role` |
| `select-name`       | Same label/ARIA/title/presentation checks as implemented, without placeholder                                                          |
| `input-button-name` | `non-empty-if-present`, `non-empty-value`, then ARIA/title/implicit/explicit label checks                                              |
| `input-image-alt`   | `non-empty-alt`, then ARIA/title/implicit/explicit label checks                                                                        |

Attribute and content values are the compacted result already used by that check. Reference
text uses the evaluator's root-local lookup order and duplicate-reference handling; reuse its
computed strings, not an independent DOM query. For `someLabels`, reuse the first successful
label's text. Button associated-label text uses that helper's existing combination.
A boolean-only success is not permission to run additional naming checks.

### Privacy takes precedence over text availability

- `non-empty-value`: `name-unavailable` / `control-value`. Never copy the attribute or live
  value, even when it is an input button's authored caption.
- `non-empty-if-present`: `name-unavailable` / `native-default`. Do not invent localized
  submit/reset text from the browser default.
- `presentational-role`: `name-unavailable` / `non-text-check`.
- A boolean hidden-label success: `name-unavailable` / `hidden-source`.
- A successful reference using CSS-hidden, inert or `aria-hidden` sources:
  `name-unavailable` / `hidden-source`. Naming semantics may legitimately read them; capture
  must not. Track source exclusion while computing the existing check; do not filter a name
  into a different partial name or fall back to another check.
- Any unsupported, excluded or truncated contributor to a combined name makes that name
  unavailable. Keep check identity and reason, not forbidden strings or a misleading prefix.

Password and hidden input targets carry identity/rule/check metadata only with
`name-unavailable` / `excluded-target`, even if an existing naming rule passes them.
Available empty `image-alt` text is `""`, distinct from missing text or presentation.
Unavailable-name records retain no name, alt, basename, heading or container strings.

## Capture fields

The envelope records schema/collector, state, page/document ID, epoch and scan ID (the host
binds the browser capture to the completed scan). `available` carries targets and bounded
population gaps; `unavailable` carries one fixed-code, non-payload diagnostic, no targets.
State binding is checked against the raw scan. Stale scans yield unavailable capture; cancelled
or navigated scans cannot commit current text.

Each target record contains:

| Field                     | Contract                                                                                                                                                                                                                                                       |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `target`, `rule`, `check` | Existing exact scoped target and rule version; allowlisted successful check/source ID. Host verifies a corresponding retained pass. Paths are local join metadata, never provider state.                                                                       |
| `name`                    | Discriminated `available` with compact value, or `name-unavailable` with fixed reason. No string in an unavailable branch.                                                                                                                                     |
| `role`                    | Supported explicit role, otherwise supported implicit native role, or `unknown`; allowlisted tokens only, not verbatim page-chosen role strings. No full ARIA resolver claim.                                                                                  |
| `heading`                 | Nearest preceding visible native `h1`–`h6` in reader order within the target's own document/root; bounded text or explicit unavailable reason. No cross-frame/root heading guess.                                                                              |
| `container`               | Short visible text excerpt from nearest enclosing native `label`, `li`, `article`, `section`, `form`, `nav`, `main`, `div` or `p`; stop before body/document, frame or shadow-root boundary. Omit the target subtree. With no eligible container, mark absent. |
| `sameName`                | Exact-match count including this target, plus population/completeness described below, or unavailable reason. Count in code, never by a model.                                                                                                                 |
| `image`                   | Only for `image-alt`/`input-image-alt`: independently available/unavailable alt and file basename. Preserve absent alt versus authored empty alt. No image pixels or remote retrieval.                                                                         |

Context walks use visible composed descendants, open roots/slots where already observable,
exclude controls and their descendants, and skip script/style/template/noscript and embedded
media/frame content. Never use unfiltered `textContent`, `innerText` or raw HTML. Hidden,
inert and `aria-hidden` ancestors/descendants and closed roots are excluded; denied frames
are gaps, not inspected. Do not collect input values, textarea text, selected options,
contenteditable text, props, source code or arbitrary attributes. A naming source using
contenteditable text is unavailable as an excluded source.

Basename is the last nonempty pathname segment of the authored image `src` resolved against
the document base URL, without percent-decoding. Never retain scheme, credentials, host,
parent directories, query or fragment. `data:`, `blob:`, missing/invalid URLs and pathnames
without a basename are unavailable; never fetch images. Alt and basename are subject to the
same bounds and redaction as other strings.

### Same-name count and missing population

Compare compact, **unredacted**, case-sensitive values; no language normalization or model
counting. Deduplicate exact targets that pass more than one naming rule. The counting
population is observable targets passing the selected seven naming implementations across
the top document and accessible same-origin frames/open roots in this scan.

A count is usable for the duplicate-name question only when all seven rules were selected,
the reader and naming population are complete, and every name in that population is available
and untruncated. Otherwise `sameName` is unavailable (`selection-incomplete`,
`population-incomplete` or `name-unavailable`), not a page-wide count inferred from a subset.
Denied scope and known inaccessible regions prevent a complete-page claim. Undetectable closed
roots remain an explicit capability limitation, as in the baseline reader. Counts refer only
to this declared observable passing population, not every control or an accessibility tree.

Unrelated unsupported rules or geometry gaps do not alone invalidate the naming population;
reader, occurrence, naming and raw-evidence limits do. Capture retains these limitations
separately from the raw scan, without adding raw gaps.

## Frozen bounds proposed for approval

- Every captured text string: at most **160 UTF-16 code units**, matching current `compact`
  (`replace(/\s+/g, " ").trim().slice(0, 160)`). Track truncation during the original
  computation. If compacted source would exceed this limit, store an unavailable field,
  not a prefix presented as complete text. Do not export truncated sensitive tokens.
- Every serialized target record, including identity/metadata: at most **1,024 UTF-8 bytes**.
- Entire serialized capture envelope: at most **65,536 UTF-8 bytes**. At most 96 target
  records, matching the existing global occurrence ceiling; byte limit can bind earlier.
- Share the existing **2,000 naming steps / 16,384 input characters / depth 64** ceiling.
  Reusing already computed name strings must not charge them twice. Finish raw evaluations
  first; additional role/context/alt/basename work uses only the residual naming allowance.
  Never interleave extra capture reads with raw evaluations or mutate finalized raw results
  when residual capture work exhausts the budget. No new naming-budget allowance.
- Charge traversal and source-string work before reading/copying it; bounded output alone
  is not a work bound. No unbounded collection followed by slicing.
- Byte, step, character, depth or target-count exhaustion abandons **the whole sidecar**:
  `unavailable` / `text-capture-limit`, no partially retained target list. Long individual
  strings may be field-unavailable without budget exhaustion. An oversized target path can
  therefore make capture unavailable even when the baseline scan remains valid.
- At most 32 fixed diagnostics; reasons never echo text, selectors, URLs or credentials.
  Unknown fields, versions, checks, duplicate `(rule,target)` records, bad numeric bounds,
  mismatched identities and contradictory discriminants fail host validation closed.

## Host redaction, `propellr-redaction/1`

Deterministic host-only pass **after capture validation, before any adapter, cache, log,
archive or provider sees text**. Phase 1 returns only the redacted sidecar from the host;
raw captured strings remain transient and are discarded after redaction. Do not add them
to retained scans, history, events, error messages or debug output. No persistent raw-text
cache. Local target identity remains separate from any future outbound semantic state.

Apply to every captured string (name, heading, container, alt, basename), in fixed order:

| Pattern                            | Proposed deterministic rule                                                                                                                                  | Replacement             |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------- |
| URL query                          | HTTP(S) URL token's substring from `?` to fragment/end; strip fragments too, retaining only non-query URL text                                               | `[query]`, `[fragment]` |
| Email                              | Case-insensitive conventional local-part + `@` + DNS-style domain with dotted suffix                                                                         | `[email]`               |
| Phone                              | A standalone run with at least 7 digits and a leading `+` or phone separator (spaces, parentheses, dots, hyphens); plain contiguous digits use the next rule | `[phone]`               |
| Long digit run                     | Remaining contiguous ASCII digit run of 7 or more                                                                                                            | `[digits]`              |
| Token-like/high-entropy identifier | Remaining standalone ASCII token of at least 24 characters: hex, or characters from letters/digits/`_-/+=` with at least one letter and one digit            | `[token]`               |

Match on bounded strings without catastrophic-backtracking regexes; preserve typed placeholders
without recursively reclassifying them. Rules are conservative heuristics, not a guarantee of
PII detection, entropy measurement or anonymization. Unsupported formats can evade them;
synthetic-only provenance is a separate mandatory disclosure boundary.

Record version and changed field names, never original matches. Recheck string/target/envelope
bounds **after** replacements. A replacement expanding output beyond any bound makes the
sidecar unavailable, not silently truncated. Redaction must be deterministic and idempotent.

For this first pilot, any replacement in name, alt, heading or container conservatively makes
that entire target `redacted-unavailable` for semantic questions; retain only sanitized values
and fixed reason `essential-text-redacted`. A basename-only replacement disables the
filename-like question, not unrelated questions with intact name/context. Do not treat
`[email]`, `[phone]` or another placeholder as a descriptive name, filename or distinguishing
context. If any counted name is redacted, disable same-name distinguishability for that
population: placeholders cannot establish equivalence. No provider request for an unavailable
question; no reconstruction, fallback name or guess about removed meaning.

## Disclosure and retention policy

Any later live semantic lane requires its own machine-checkable per-arm approval record,
including `textDisclosure: "synthetic-only"`, exact model/endpoint/adapter, approver/date,
terms review, request/spend/price ceilings and the frozen protocol digest. Text-free phase 2
attribution records do not satisfy this check. No calls happen in phase 1.

“synthetic-only” is established by host-owned original fixture provenance, not a page flag,
a caller assertion, redaction success, a URL alone or a state digest. The future evaluator
must refuse unknown/customer origins and unapproved fixture revisions before adapter
construction. Provider input is an allowlisted projection of redacted semantic fields with
opaque request-local target IDs. Never send local target paths, page/document/session IDs,
raw image/page URLs, bridge IDs, source references, raw scan/report objects or secrets.

No customer pages or source and no deliberately adversarial/injection provider cases.
Terms review remains `adversarialTesting: "not-permitted"`; privacy leak fixtures are local
no-provider tests, not service security testing. Customer-data retention/ZDR/residency needs
separate approval. No model-output distillation. No network dependency for baseline scans.
Phase 1 adds no disk retention; later synthetic evaluation archives need their own approval
and must contain only redacted data under the approved protocol.

## Implementation acceptance after approval (not executed)

`test/components/text-capture.test.ts` will run real Chromium cases in the existing components
project, using light DOM, open roots/slots and same-origin frames, plus explicit denied scope.
No UI/labeling-sheet change in this phase.

1. Every successful check/source in the seven-rule table; competing checks prove selection
   follows the rule, not an independent helper. Include empty alt, presentation, default
   submit/reset, authored input-button value and CSS-hidden/ARIA-hidden reference passes.
2. Leak fixtures plant values, passwords, hidden inputs, textarea/selected-option and hidden
   text in names/context; none appears in host sidecar, raw naming evidence or outbound state.
   A legitimate hidden-reference pass remains unchanged with `name-unavailable` capture.
3. Per-string, per-target, per-scan and residual naming-budget boundaries; exhaustion returns
   unavailable capture without changing raw findings. Include multibyte text and large paths.
4. Root-local context, slot deduplication, distinct frame targets, complete/subset same-name
   populations and truncated/unavailable names; no false complete-page duplicate count.
5. Each redaction pattern, overlapping matches, ordinary non-sensitive controls, idempotence,
   non-English preservation, post-replacement size limits and essential-meaning loss.
6. Strict schema rejection and raw scan/report/gate isolation on/off; stale transfer,
   navigation and cancellation never attach current text to newer state. Default-off shape
   is unchanged. Naming occurrence evidence still contains no name strings/control values.

After implementation, run the plan's focused build/Chromium text-capture command and pinned
`pnpm validate`; record executed results in `specs/semantic-review-validation.md`. Until then
these are requirements, not checked boxes or evidence of text-capture support.

**Stop now for Tony's approval of this draft.** No runtime code, dependencies, provider calls,
spend, customer data or disclosure are authorized by writing it.
