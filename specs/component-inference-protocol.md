# Component inference protocol, phase 2

September 24, 2026. Authored and frozen before implementation or any evaluation run. Plan:
[component intelligence](propellr-component-intelligence.html), phase 2. Base `main@f76a991e`,
branch `feat/component-inference-eval`. Phases 1 and 3 are merged and unchanged by this phase.

Phase 2 asks whether inference over **uninstrumented** pages adds enough value to justify
latency, privacy and cost. It can reject Jev. Everything here is advisory: no inferred result
becomes a supported scope, changes a gate, or is delivered over IPC.

## Approval state (blocking)

| Gate                                                                      | State                                    |
| ------------------------------------------------------------------------- | ---------------------------------------- |
| Provider, exact model, client, synthetic disclosure, numeric spend caps   | **Not approved.** No credentials exist.  |
| TypeSafe MCA review (output reuse, distillation §2.3(b), testing §2.3(g)) | **Not done.** No adversarial live calls. |
| Two independent human adjudicators for the 240-case corpus                | **Not available.** Labels unadjudicated. |
| Native structured-output small LLM arm                                    | **Not approved**; no client added.       |

A live lane requires a machine-checkable approval record (`decisionApprovalSchema`): provider,
exact model, exact endpoint and adapter version, approver and date, synthetic-only disclosure,
a terms review (reference, reviewer, date; evaluation-only output reuse, distillation prohibited,
adversarial testing not permitted) and numeric request, spend and price ceilings. It is
validated before any browser work or client construction.

Consequences: no network call is made to any provider. `pnpm eval:components` refuses the
`jev` and `llm` arms and exits nonzero when the approval record or key is missing. Nothing
cached, mocked or synthetic can count as a live result. The holdout split stays sealed:
no arm, including the heuristic, is run on it until all approved arms run together.

## Structural capture, `propellr-structure-capture/1`

Optional browser capture for uninstrumented attribution, in the same guarded scan call as the
bridge capture and after raw rules are fixed. Raw results are unchanged with it on or off.

- Element label: `localName` plus `role` when it is a known ARIA role, otherwise `other`. No text,
  attribute values, IDs, classes or URLs.
- Shape: FNV-1a hash of the label and up to 16 child labels, recursively to depth 2, over light
  children and open shadow-root children. Counts of each depth-2 shape over reader-visited elements.
- For each violation target (at most 96): the composed ancestor chain up to 8 levels, each with
  distance, label, shape, repeat count and the ancestor's exact target path when the reader
  visited it. Target paths are the same ones raw results already carry; they exist only for
  host-side joining and are never sent to a provider.
- Bounds: 8,000 shape steps (one per element per depth, so up to 6,000 for the reader's 2,000
  elements; amended from 4,000 before any code ran), 64 KiB JSON. Exhaustion yields `component-structure-limit` and an
  `unavailable` capture; raw findings are never dropped.

## Heuristic arm, `structural-template/1`

Code generates candidates; no pairwise all-pairs comparison. Candidates for a target are chain
ancestors at distance ≥ 1 whose depth-2 shape repeats at least twice (ancestors are indexed by
shape in one pass). The decision is the nearest such candidate; with none, the arm abstains.
Near-miss alternatives (the other repeated ancestors) are retained, not discarded. Groups key
on shape, relative label path from candidate to target, rule and defect signature. They are
suggestions only, with opaque IDs `shape:<hash>:<n>`, unique per grouped key, never framework or
definition names.

## Corpus

Twelve original fixture families, each rendering exactly 20 violation decision cases (240), with
an instrumented arm (truth) and an uninstrumented arm (trial). Splits by family, never by
element: **dev** = favorites grid, cart callsites, lookalikes and fragments (80); **holdout** =
recommendation rail, variants, data records, external labels, two-caller primitive, open shadow
widgets, frame cards and multi-defect cards (160). Truth comes only from the instrumented arm's
supported attributions and repair view. It is the evaluator's oracle, never trial input. Labels
are instrumented-oracle labels, **not** two-reviewer adjudications.

## Metrics (per arm and split)

- Candidate recall: the truth instance root is among the candidates. Reported separately from
  decision accuracy.
- Decision precision and recall over emitted decisions; abstention (answer-coverage) rate.
- Pairwise repair-group precision and recall against truth scopes; overmerge and oversplit counts.
- Bootstrap intervals by family (2,000 resamples, fixed seed), never by DOM node. With four dev
  families these intervals are wide and are reported as such.
- Provider arms add calibration, latency, attempts, fallbacks and cost; unavailable here.

## Adoption bar (frozen now, before any holdout use)

A provider arm is adopted only if, on the holdout: emitted-membership precision ≥ 98% at answer
coverage ≥ 60%; pairwise suggested-group precision ≥ 99%; zero unsupported automatic cause
promotions. Plus incremental value, criterion fixed now: **at least 10 percentage points more
answer coverage than the heuristic arm at matched precision**. The cost/latency criterion is not
used. All metrics are reported regardless. A changed model, rubric or corpus requires
re-evaluation. This small study cannot certify rare-error rates.

## Provider adapter (host-only, no live calls in this phase)

`src/host/component-decisions.ts`, native `fetch`, no SDK:

- `POST /v1/systemone` with `Authorization: Bearer`, pinned model `jev-1.13.0`. Endpoint must be
  HTTPS; plain HTTP is accepted only for an explicit loopback test endpoint.
- Request: minimal state (labels, opaque shape IDs, distances, repeat counts, candidate IDs) and
  separate questions for membership, part and cause. Choices include `none` and
  `insufficient-evidence` and are capped at 255 options. No text, no page strings except
  allowlisted roles. Every question carries complete instructions (question IDs are invisible
  to the model).
- Bounds: request at most 64 KiB; total deadline at most 10 s across all attempts; at most 3
  attempts; retry only 429, 529 and network errors, with backoff inside the deadline; 401 and 422
  are never retried. The caller's AbortSignal cancels immediately. Responses are read to at most
  256 KiB before parsing. No request or response bodies are logged.
- Budget (required): approved request count, spend cap and price per million input tokens.
  Every attempt counts. Before sending, the request's UTF-8 byte count is charged as an upper
  bound on input tokens; reported usage above that bound is charged in full. A call that would
  exceed either ceiling is `budget-exhausted` and is never sent.
- Response: strict schema; the model must match; answer keys must equal question keys; choices must
  be offered options; probabilities must cover exactly the options, be finite, lie in [0,1] and sum
  to 1 ± 0.02; confidence must be finite in [0,1]. Anything else is `invalid-response`. Conflicting
  answers stay conflicts.
- Cache: exact canonical input plus model, rubric, policy and evidence versions; at most 256
  entries. Only validated answers are cached. Nothing is reused across different inputs.

## Verification

`pnpm test:components` gains no-key adapter cases against a local loopback server: valid,
malformed, timeout, 429 retry and exhaustion, 401, 529, cancellation, unavailable provider,
injection-shaped roles, cache and no body logging. It also gains a structural capture on/off
raw-equivalence check, corpus shape checks and a dev-split heuristic run in Chromium. These verify
integration behavior, not model quality. `pnpm eval:components` runs the heuristic arm on dev and
refuses provider arms. `pnpm validate` runs every no-key lane; no paid lane is in CI.

Stop for decision: Jev is **not adopted**. Missing approval blocks it; inference stays disabled.
