# Component inference protocol, phase 2

September 24, 2026. Authored and frozen before implementation or any evaluation run. Plan:
[component intelligence](propellr-component-intelligence.html), phase 2. Base `main@f76a991e`,
branch `feat/component-inference-eval`. Phases 1 and 3 are merged and unchanged by this phase.

Phase 2 asks whether inference over **uninstrumented** pages adds enough value to justify
latency, privacy and cost. It can reject Jev. Everything here is advisory: no inferred result
becomes a supported scope, changes a gate, or is delivered over IPC.

## Approval state (blocking)

| Gate                                                                      | State                                     |
| ------------------------------------------------------------------------- | ----------------------------------------- |
| Provider, exact model, client, synthetic disclosure, numeric spend caps   | **Approved 2026-09-28** (amendment below) |
| TypeSafe MCA review (output reuse, distillation §2.3(b), testing §2.3(g)) | **Recorded 2026-09-28**, Tony, verbal     |
| Two independent human adjudicators for the 240-case corpus                | **Planned:** Tony and one colleague       |
| Native structured-output small LLM arm                                    | **Approved:** `claude-haiku-4-5-20251001` |

A live lane requires a machine-checkable approval record (`decisionApprovalSchema`): provider,
exact model, exact endpoint and adapter version, approver and date, synthetic-only disclosure,
a terms review (reference, reviewer, date; evaluation-only output reuse, distillation prohibited,
adversarial testing not permitted) and numeric request, spend and price ceilings. It is
validated before any browser work or client construction.

Consequences: no network call is made to any provider. `pnpm eval:components` refuses the
`jev` and `llm` arms and exits nonzero when the approval record or key is missing. Nothing
cached, mocked or synthetic can count as a live result. The holdout split stays sealed:
no arm, including the heuristic, is run on it until all approved arms run together.

## Amendment, September 28, 2026 (approvals and LLM arm)

Tony approved, in the Claude Code session of September 28, 2026:

- **Jev lane** on dev, then on the holdout once: `jev-1.13.0` at the pinned endpoint, text-free
  synthetic structure only.
- **Ceilings per arm:** 300 requests and $1.00. Jev input is priced at $0.042 per million
  tokens; Claude Haiku 4.5 at $1 input and $5 output per million.
- **Terms review:** reviewer Tony; reference "verbal approval in Claude Code session,
  2026-09-28"; evaluation-only output reuse, distillation prohibited, adversarial testing not
  permitted.
- **LLM arm:** `claude-haiku-4-5-20251001`, a pinned dated snapshot, not an alias, via
  `POST https://api.anthropic.com/v1/messages` (`anthropic-version: 2023-06-01`), native HTTPS
  with no SDK dependency. Same text-free inputs, question wording and gates as the Jev adapter.
  Temperature 0, `max_tokens` 512, no thinking, and structured output
  (`output_config.format`, `json_schema`). The answer schema is membership `{choice,
confidence}`, part `{choice, confidence}` and cause `{probability}`. Choices must be offered
  options and numbers must be finite in [0,1], checked client-side, since schema numeric bounds
  are unsupported. A `refusal` or `max_tokens` stop is `invalid-response`. 401, 403, 400, 404
  and 422 are never retried; 429, 529, other 5xx and network errors are.
- **Adjudication:** Tony and one colleague label the corpus independently; disagreements are
  recorded, not averaged away. The holdout stays sealed until both label sets exist. Then the
  heuristic, LLM and Jev arms run on it exactly once.

Spend accounting, both adapters: before sending, the client reserves an upper bound (request
UTF-8 bytes as input tokens at the input price, plus `max_tokens` at the output price) and
refuses a call whose reservation would exceed the cap. When a response reports usage, the
reservation is replaced by the reported cost, whether higher or lower. Over-reported usage is
charged in full and stops later calls. The adoption bar, metrics, corpus and split are unchanged.

## Amendment, September 29, 2026 (part rubric 2, before any holdout use)

Approved by Tony on September 29, 2026, after the dev runs of September 28. The rubric-1 part
question asked for the "label path from the component root to the target", which also permits
a root-inclusive reading. On dev, Haiku took that reading (`article>button`), while the options
and scorer use the path below the root (`button`), so every Haiku part was a conflict.

Rubric `component-attribution-questions@2` changes only the question text. Each part option
starts directly below the chosen instance's root, never includes the root's own label, and ends
at the target. Each option's criterion names the candidate it pairs with (ID, distance and root
label). If membership abstains, the part abstains too. The options, answer schemas, scoring
(a part must equal the chain-derived path for the chosen member), corpus and adoption bar are
unchanged. The rubric version is part of every cache key.

Because the rubric changed, both provider arms rerun on dev under rubric 2. The dev results of
September 28 (rubric 1) stay on record and are not replaced. The holdout remains sealed and runs
once, with all three arms, under rubric 2. The approved caps are cumulative per arm across runs.

## Amendment, September 29, 2026 (confidence gate, before any holdout use)

**Status: draft, pending Tony's approval.** The holdout may not run until this amendment is either
approved or withdrawn.

Both providers return a calibrated membership confidence, and TypeSafe positions Jev for
confidence-gated use (accept above a threshold, otherwise fall back). Rubric 2 still scored every
answer as a decision whatever its confidence. This amendment gates each provider arm on its
membership confidence.

- **Gate.** A provider's membership answer counts as a decision only if its confidence is at
  least the arm's frozen threshold. Below the threshold the case abstains: it is undecided and
  forms no repair group. The heuristic has no confidence and is not gated. Calibration (Brier)
  stays computed over every answer, before the gate.
- **Selection rule, fixed before selection.** Candidate thresholds are 0.50, 0.55, …, 0.95. The
  threshold is the smallest candidate whose accepted decisions, pooled over every rubric 2 dev
  run, reach decision precision of at least 98% at coverage of at least 60%, the adoption bar's
  own values. If no candidate does, the arm is ungated (threshold 0).
- **Frozen thresholds (rubric 2):** Jev `jev-1.13.0` **0.80**; Claude Haiku 4.5
  `claude-haiku-4-5-20251001` **0 (ungated)**. They come from both rubric 2 dev runs in
  `specs/component-inference-evidence/confidence-gate-dev.json`, and a test re-derives them from
  that file. Across the two runs, Jev answered 0.75 and 0.79 on the one family it got wrong and at
  least 0.91 on the three it got right. Haiku answered 0.85 on both a wrong and a right family, so
  no candidate separates them.
- **Caveats.** The 80 dev cases reduce to 3 distinct structural inputs per arm, so these thresholds
  rest on very little evidence. **Jev does not answer identical requests identically:** between the
  two runs, its wrong-family confidence moved from 0.75 to 0.79, only 0.01 below the gate, and two
  families' part answers changed from `button` to `insufficient-evidence` (part confidence
  0.20–0.36). Haiku's answers were identical across runs. The holdout runs once, so run-to-run
  variation is part of what it measures. The sealed holdout is the only real test of these
  thresholds.
- **Reporting.** Gated pooled, per-family and interval metrics are primary and feed the adoption
  check. Ungated metrics and the precision/coverage curve over threshold 0 and every candidate
  are always reported too. Only the frozen threshold counts toward adoption.
- **Unchanged:** the adoption bar, the options, the answer schemas, the part rule, the corpus and
  the approvals. Gating lowers coverage, and the bar's incremental-coverage criterion (10 points
  over the heuristic at matched precision) is unchanged, so if the heuristic decides every case,
  a gated arm cannot meet it. A changed model or rubric needs a newly derived threshold on dev
  before any holdout use. The evaluation refuses to run without a frozen threshold for the model
  and rubric.

## Structural capture, `propellr-structure-capture/1`

Optional browser capture for uninstrumented attribution, in the same guarded scan call as the
bridge capture and after raw rules are fixed. Raw results are unchanged with it on or off.

- Element label: an allowlisted HTML/SVG element name (custom elements become `custom`, other
  names `unknown`), plus `role` when it is a known ARIA role, otherwise `other`. No text,
  attribute values, IDs, classes, URLs or page-chosen names.
- Shape: FNV-1a hash of the label and up to 16 child labels, recursively to depth 2, over light
  children and open shadow-root children. Counts of each depth-2 shape over reader-visited elements.
- For each violation target (at most 96; more makes the capture `unavailable`, never truncated): the composed ancestor chain up to 8 levels, each with
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
- Provider arms add calibration (Brier score of membership confidence), latency p50/p95,
  attempts, failures by code and spend. They are scored by the same oracle and chains as the
  heuristic: `none` and `insufficient-evidence` abstain, and a part abstention forms no group.
  A part that is not the chain-derived path for the chosen member is a conflict and forms no
  group. Only this checked-in protocol at its pinned SHA-256 can bind an evaluation; the digest
  pin is updated together with any intentional revision, and the entry point re-verifies it.
  Cached answers report zero attempts.
  Failed calls are undecided. Decisions are target-level: every (rule, path) case on a target
  shares that target's decision, and request, latency and attempt metrics count targets. The
  adoption check applies the frozen bar and is eligible only on the holdout.

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
  allowlisted roles, enforced at runtime by a strict schema (`invalid-request` before sending).
  Every question carries complete instructions (question IDs are invisible to the model).
- Bounds: request at most 64 KiB; total deadline at most 10 s across all attempts; at most 3
  attempts; retry only 429, 529 and network errors, with backoff inside the deadline; 401 and 422
  are never retried. The caller's AbortSignal cancels immediately. Responses are read to at most
  256 KiB before parsing. Redirects are never followed (`redirect-refused`), so the body cannot
  move to another scheme or host. No request or response bodies are logged.
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
