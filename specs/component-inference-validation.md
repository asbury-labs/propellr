# Component inference: phase 2 evidence

## Checkpoint, September 24, 2026

Phase 2 of the [component intelligence plan](propellr-component-intelligence.html):
uninstrumented attribution and the Jev evaluation. Branch `feat/component-inference-eval` from
`main@f76a991e`. [Protocol](component-inference-protocol.md) was frozen before implementation
(one pre-code amendment: the structure step budget, 4,000 to 8,000).

**Decision: Jev is not adopted. Inference stays disabled.** The phase stops at its approval
gates. No provider credentials, spend authority, TypeSafe agreement review, LLM-arm approval or
human adjudicators exist. **Zero live provider calls were made.**

## What exists

- `propellr-structure-capture/1`: optional, text-free fingerprints (element names, allowlisted
  roles, opaque depth-2 shape hashes and repeat counts) for each violation's composed ancestor
  chain, in the same guarded scan call. 8,000 steps and 64 KiB; exhaustion makes the capture
  `unavailable`, never dropping raw findings. The host validates it like the bridge capture.
- `structural-template/1` heuristic (`src/components/discovery.ts`): candidates are repeated
  ancestors at distance ≥ 1, indexed by shape (no all-pairs comparison); the nearest is the
  decision; near-miss alternatives are kept; groups are suggestions with opaque `shape:` IDs.
- Host-only adapter (`src/host/component-decisions.ts`) for `POST /v1/systemone`, with the wire
  format confirmed against TypeSafe's public API reference: pinned `jev-1.13.0`, native `fetch`,
  HTTPS only (loopback only when explicitly allowed), 64 KiB requests, at most 10 s total and 3
  attempts, retries only for 429/529/network, immediate cancellation, strict response validation,
  exact-input cache of 256 entries, no logging. Not wired into any operation.
- Frozen corpus (`test/fixtures/components/corpus.ts`): 12 original families of exactly 20
  violation cases each. Dev has 4 families (80 cases); holdout has 8 (160, sealed).
- `pnpm eval:components`: refuses the `jev` and `llm` arms and the holdout with exit code 2.
  With an approval record and key, a live Jev lane runs over HTTPS only, capped at the
  approved request count. That path is untested because no approval exists.

## Executed results

**Pre-review pinned `pnpm validate` (head `33a1215a`) passed all 292 tests**: 68 contract, 44 host, 13 playbook,
80 parity/browser, 69 component and 18 reporting, plus build, types, lint and Oxfmt. The browser
bundle changed, so the unchanged three-rule `pnpm bench:slice` ran once: 3 engine tests,
0 failures, bundle hash matching. No performance claim.

- Corpus integrity: all 12 families yield exactly 20 violations, each with instrumented truth; no
  uninstrumented leaks. This used the instrumented arm only; no holdout trial ran.
- Structural capture in Chromium, Firefox and WebKit: raw results identical with it on; capture
  available and text-free for all dev families.
- Adapter, no keys, loopback server: valid answers, cache (hit, and miss on a new evidence
  version), 8 malformed-response shapes, non-JSON and non-finite bodies, 429/529 retry and
  exhaustion, 401 and 422 without retry, total deadline, cancellation, refused connection, HTTPS
  enforcement and no console output. These test integration behavior, not model quality.
- Injection-shaped roles become `div|other`; the page string never reaches a request.

Heuristic arm, dev split only (Chromium, `eval:components -- --provider heuristic --split dev`):

| Family          | Candidate recall | Decision precision | Pairwise precision | Overmerged pairs |
| --------------- | ---------------- | ------------------ | ------------------ | ---------------- |
| favorites-grid  | 1.00             | 1.00               | 1.00               | 0                |
| cart-callsites  | 0.00             | 0.00               | 1.00               | 0                |
| lookalikes      | 1.00             | 1.00               | 0.47               | 100              |
| fragments       | 1.00             | 1.00               | 1.00               | 0                |
| **Pooled (80)** | **0.75**         | **0.75**           | **0.87**           | **100**          |

Family-bootstrap 95% intervals (2,000 resamples, fixed seed): decision precision 0.25–1.00;
pairwise precision 0.61–1.00. Four families make these intervals wide. The two failures are
the ones the protocol predicts: a self-rooted primitive (IconButton) is never a distance ≥ 1
candidate, and identical markup from unrelated definitions overmerges. Coverage is 1.00: the
heuristic never abstains on dev. These are baseline numbers, not an adoption test.

## Blocked tasks

| Plan task                                         | State | Evidence                                                     |
| ------------------------------------------------- | ----- | ------------------------------------------------------------ |
| 240 cases adjudicated by two reviewers            | [f]   | Corpus frozen and split; labels are instrumented-oracle only |
| Compare heuristic, small LLM, Jev, Jev+abstention | [f]   | Only the heuristic arm exists, run on dev only               |
| Provider, spend, disclosure and terms approval    | [f]   | None given; no credentials                                   |
| Live `eval:components` run                        | [f]   | Refused with exit code 2 by design                           |
| Provider metrics (calibration, cost, latency)     | [f]   | No provider responses exist                                  |

## Failures and corrections

- Evaluator bug found by probing: truth and candidates were compared as whole targets, including
  each arm's own page/document IDs, so nothing matched and pairwise precision was trivially 1.
  It now keys identity on target paths. A missing truth case never agrees with another.
- The bootstrap initially let duplicated families pair with each other; copies are now distinct.
- Two test issues: a whitespace role triggers the reader's existing role-token limit, so the
  injection test uses one token; and `pnpm eval:components -- ...` forwards a `--` that the parser
  now strips, covered by a test.

## Review repair 1, PR #19

Copilot raised four findings:

- **Response buffering (fixed):** response bodies were buffered whole. They are now read to at
  most 256 KiB before parsing; a 300 KB body is rejected.
- **Spend cap (fixed):** the approval's spend cap was not enforced. The client now requires a
  budget and enforces requests and spend itself, charging the request byte count up front as a
  token upper bound. The test caught an earlier bytes/3 estimate that could overshoot.
- **Duplicate group IDs (fixed):** groups sharing a shape shared an ID. IDs are now unique per
  grouped key. The new test fails before the fix, and the evaluator's workaround is removed.
- **Page IDs in structure targets (clarified):** that the capture exposed page IDs was partly a
  false positive. Target paths are permitted, already in raw results, and stripped before any
  request; a test now asserts that no selector or page ID reaches a request body.

Pinned `pnpm validate` then passed all 295 tests (72 component). Browser source is unchanged by
this repair. The archive below describes the pre-review head `33a1215a`.

## Review repair 2, PR #19

Copilot found that the approval record did not encode the terms review or the exact
endpoint and client, so a minimally shaped record could enable a live call while those gates were
outstanding. The record now requires provider, model, exact endpoint and adapter, disclosure,
a terms review and numeric ceilings. It is validated before any browser work or client
construction. A test shows an incomplete record is refused with its missing fields named. No
pre-fix run was made, because it would have sent a real request with a placeholder key.
Pinned `pnpm validate` passed all 296 tests (73 component).

## Review repair 3, PR #19

Copilot found two issues:

- **Redirects bypassed the HTTPS boundary (fixed):** native `fetch` followed redirects, so the
  request could move to another scheme or host. Redirects are now refused without being
  followed. In the test, a 307 to a second loopback server is refused, and that server receives
  nothing.
- **Oracle collisions (fixed):** the oracle keyed cases by target path only, so a second rule on
  the same element overwrote the first. Cases are now keyed by rule and path. A two-button
  family violating both `button-name` and `target-size` yields 4 truth cases.

Both tests failed before their fixes and pass after. The current corpus has one rule per element
per family, so the dev metrics above are unchanged. This third push exceeded the default
two-push babysit limit under Tony's standing instruction to reach a clean merge. Pinned
`pnpm validate` passed all 298 tests (75 component).

## Review repair 4, PR #19

Copilot found that `decide()` trusted the TypeScript-only decision input at runtime, so a host
caller could send page text or unbounded values. A strict runtime schema now admits only labels
in the text-free grammar, opaque shapes, bounded distances and repeat counts, and
code-generated `ancestor-N` IDs, with one part per candidate. Anything else is `invalid-request`
and is never sent. The test failed before the fix: seven bad shapes are refused, the server
receives nothing, and a valid case still succeeds. This fourth push also ran under Tony's
standing instruction. Pinned `pnpm validate` passed all 299 tests (76 component).

## Review repair 5, PR #19

Copilot found that the egress grammar accepted any lowercase role token (for example
`button|ignore`), not just the allowlist. It also found that 401, 422 and other non-OK
responses returned without releasing their bodies. The role allowlist now lives in shared
constants: the browser labels with it, and the capture schema and decision-input schema both
enforce it, including inside part paths. Terminal responses now cancel their bodies. The
allowlist test failed before the fix. Body cancellation is resource hygiene and has no separate
test. Pinned `pnpm validate` passed all 299 tests (76 component).

## Review repair 6, PR #19

Copilot found four more issues:

- **Uncharged usage (fixed):** reported usage on an invalid response was not charged. It now is,
  and over-reporting stops later calls.
- **Incomplete runs scored (fixed):** the evaluator could score incomplete runs. It now refuses
  unless both arms have complete coverage, structure is available and all 20 truth cases per
  family are present.
- **Candidate/chain mismatch (fixed):** a candidate naming a missing ancestor threw instead of
  being refused. Candidates must now match the chain's ancestors in order, or the input is
  `invalid-request`.
- **Unreadable approval JSON (fixed):** it now exits 2 with a blocked message, before any
  browser work.

The three new tests failed before their fixes. The heuristic dev evaluation still passes the
completeness gate. This sixth push also ran under Tony's standing instruction. Pinned
`pnpm validate` passed all 301 tests (78 component).

## Review repair 7, PR #19

Copilot found that the vitest evaluation entry point relied on the wrapper's refusals. Run
directly, it would score an unknown provider through the heuristic lane and did not check the Jev
key. It now refuses unapproved providers, the holdout and a missing key itself, before any browser
launch. The direct-run test failed before the fix. Pinned `pnpm validate` passed all 302 tests
(79 component).

## Review repair 8, PR #19

Copilot found that an approved live run would spend budget without scoring the provider. A
provider scorer now maps each decision back to its case through the same chains and oracle,
computes the heuristic's metrics plus Brier calibration, latency, attempts, failures and spend,
and applies the frozen adoption bar (eligible only on the holdout). Decision inputs must also
carry, for each candidate, exactly the part path derived from its chain prefix. The scorer is
tested with synthetic answers, which only exercise it and never count as a provider result.
The part test failed before its fix. The holdout finding was declined: the frozen protocol
opens the holdout only when every approved arm can run, and no LLM client exists. Pinned
`pnpm validate` passed all 303 tests (80 component).

## Review repair 9, PR #19

Copilot found three issues:

- **Custom element names (fixed):** page-controlled custom element names passed the label
  grammar. Element names are now allowlisted in shared constants; custom elements become
  `custom` and others `unknown`, enforced in the browser, the capture schema and at egress.
- **Part abstentions (fixed):** a part abstention still formed a repair group. It now keeps
  membership and forms no group.
- **Decision unit (defined):** live decisions carried no rule identity. They are now explicitly
  target-level, because membership and part describe the element, not the rule. Each
  (rule, path) case shares its target's decision, and the report records `decisionUnit`.

The custom-name and scoring tests failed before their fixes. Only structure labels changed in
the browser, and the capture on/off tests still hold in three engines, so the benchmark was not
rerun. Pinned `pnpm validate` passed all 304 tests (81 component).

## Review repair 10, PR #19

Copilot found three more issues:

- **Silent target cap (fixed):** the structure capture could silently cap targets. It now
  becomes `unavailable` instead; this was unreachable anyway, since raw scans cap occurrences at 96. The evaluator also requires a chain for every scored case.
- **Mismatched part answers (fixed):** a part answer not matching the chosen member formed a
  group. It is now a conflict and forms no group.
- **Protocol provenance (fixed):** the direct entry point did not verify protocol provenance. It
  now requires the protocol path and verifies its SHA-256.

Both new tests failed before their fixes. The heuristic dev metrics are unchanged. The
protocol's hash has changed since the first run because review repairs added clarifications.
The adoption bar, thresholds, metrics and corpus split are unchanged.

The first validate run for this repair timed out one existing Firefox naming parity test after
371 s. That test does not exercise component code, and it passed alone twice in about 17 s. The
log is kept as `validate-review-10-failed.log`. The one rerun passed all 304 tests
(81 component).

## Review repair 11, PR #19

Copilot found three evidence-integrity issues:

- **Stale manifest (fixed):** the manifest's protocol and source hashes no longer matched the
  checkout. The manifest and archive are now regenerated from the final source.
- **Unpinned protocol (fixed):** the wrapper hashed any protocol path it was given. Only the
  checked-in protocol at a pinned SHA-256 (`1d6f89a2…`) may now bind an evaluation, and a test
  checks that the pin matches the file.
- **Cached attempts (fixed):** cache hits re-reported their original attempts. They now report
  zero.

Pinned `pnpm validate` then passed all 305 tests (82 component).

## Review repair 12, PR #19

Copilot found that the direct evaluation entry point trusted a caller-supplied digest. The pin now
lives in `tools/frozen-protocol.json`, which both the wrapper and the entry point read. The entry
point requires the pinned path and digest and hashes the pinned file itself, so a self-consistent
hash of another or modified file is refused. A test checks the pin against the checked-in protocol.
**Final pinned `pnpm validate` passed all 305 tests** (68 contract, 44 host, 13 playbook, 80
parity/browser, 82 component, 18 reporting). The heuristic dev evaluation reran under the pinned
protocol with unchanged metrics. The `jev`, `llm` and holdout lanes still exit 2.

## Evidence artifacts

These are the PR #19 checkpoint snapshot, from before the approvals. The live dev runs have
their own manifest (below).

- [Manifest](component-inference-evidence/phase-2-manifest.json): approval state, corpus split,
  heuristic metrics, commands, source and archive hashes.
- [Raw archive](component-inference-evidence/phase-2-results.tar.gz): the final heuristic dev
  report, and all validate (including the failed run), benchmark and evaluation logs.
- Source-tree SHA-256: `9cabda4855a0050b1b63f5900eb8bf978b7dd02b29ace72e64e34878b4cac78e`.
- Archive SHA-256: `ae9a4b0e67a7cc7aa3d3570a0769d2859e535fb81e9c95eb81fdb92419ddf0f1`.

## Approvals and the Haiku arm, September 28, 2026

Tony approved the phase 2 gates (see the protocol amendment of the same date). Records, with no
secrets, are in [approvals/](component-inference-evidence/approvals/): Jev `jev-1.13.0` and
Claude Haiku 4.5 (`claude-haiku-4-5-20251001`), each capped at 300 requests and $1.00, dev and
holdout, synthetic disclosure only, evaluation-only outputs. Adjudicators are Tony and one colleague.

- **Shared transport** (`src/host/decision-transport.ts`): both adapters now use one bounded HTTPS
  transport: HTTPS only, redirects refused, 64 KiB requests, 256 KiB responses read in a streaming,
  bounded way, 10 s total deadline, at most 3 attempts, terminal bodies cancelled, no logging.
- **Spend accounting (amended):** before each attempt, the transport reserves an upper bound:
  request bytes at the input price plus the output-token ceiling at the output price. It refuses
  the attempt if the bound would exceed the cap. Reported usage then replaces the reservation.
  Every attempt counts toward the request cap.
- **Haiku adapter** (`src/host/component-llm.ts`): raw Messages API with the pinned model,
  temperature 0, 512 max tokens and no thinking. Structured output uses a JSON schema whose enums
  are the offered options plus sentinels. The client checks the model, `end_turn`, offered choices
  and unit-interval numbers; refusals and truncations are `invalid-response`. Statuses 401/403 are
  `unauthorized` and 400/404/413/422 are `rejected`, neither retried; 429 and 5xx retry.
- **Gates:** `pnpm eval:components` checks the approval record and key for each arm
  (`PROPELLR_DECISION_APPROVAL` + `TYPESAFE_API_KEY`, `PROPELLR_LLM_APPROVAL` +
  `ANTHROPIC_API_KEY`). The entry point validates the record against that arm's schema before any
  browser work. The holdout stays sealed until both label sets exist.
- **Tests:** 16 no-key loopback tests cover request shape, 10 invalid responses, status handling,
  reservation and refund, grammar refusal, HTTPS and redirects, and the committed records.

Pinned `pnpm validate` passed all 321 tests (68 contract, 44 host, 13 playbook, 80
parity/browser, 98 component, 18 reporting). The heuristic dev lane reran under the re-pinned
protocol (`c66d274e…`) with unchanged metrics. **No live provider call has been made yet**: the
keys were not available to the evaluation shell. The live dev lanes are the next step.

### Review repair 1, PR #20

Copilot found that the approval schemas accepted up to 1,000 requests, $10 and any price, wider
than the approved 300 requests and $1.00. Both schemas now cap the ceilings at the approved values;
a record may lower them but never raise them. Provider prices are pinned literals (Jev $0.042 input;
Haiku $1 input and $5 output), because an understated price would weaken the spend guard. The
Haiku approval now requires the amendment's usage policy: evaluation-only output reuse,
distillation prohibited, adversarial testing not permitted. It records no review of Anthropic's own
terms, because none is on record; the recorded terms review covers the TypeSafe MCA. Regression
tests refuse raised ceilings, understated prices and a missing or altered usage policy.

## Live dev results, September 28, 2026

Both approved arms ran once on the 80 dev cases, from `df7fc72b`, under the pinned protocol
(`c66d274e…`). Keys were loaded from a 0600 file outside the repo, one key per run. No key value
appears in any report or log. **Neither provider is adopted; inference stays disabled.** Dev
results never count as an adoption test.

| Arm                     | Requests | Spend    | Answered | Decision precision | Pairwise precision | Brier |
| ----------------------- | -------- | -------- | -------- | ------------------ | ------------------ | ----- |
| `structural-template/1` | 0        | $0       | 80       | 0.75               | 0.868              | n/a   |
| Jev `jev-1.13.0`        | 3        | $0.00012 | 80       | 0.75               | 0.868              | 0.154 |
| Haiku 4.5               | 3        | $0.0041  | 80       | 0.75               | none (no groups)   | 0.188 |

- **All three arms made the same membership choice.** Every arm chose `ancestor-1`, the nearest
  repeated ancestor, for every target. Each is right on 3 of 4 families and wrong on
  `cart-callsites`. The providers add no coverage over the heuristic.
- **The dev split has little signal.** The 80 targets reduce to 3 distinct structural inputs, so
  each provider arm made 3 requests and its exact-input cache answered the other 77. Uncached latency was
  about 0.3 s for Jev and 1.3–2.3 s for Haiku.
- **Rubric ambiguity (not changed after the fact):** Haiku answered the part as `article>button`,
  which includes the component root. The frozen scorer expects the chain path below the root
  (`button`), so it counted every Haiku part as a conflict and formed no repair groups. The part
  question says "label path from the component root to the target", which supports both readings.
  Fixing it needs a protocol amendment and a new rubric version before the holdout, then a dev
  rerun of both arms.

Evidence: [manifest](component-inference-evidence/phase-2-dev-live-manifest.json) and
[raw archive](component-inference-evidence/phase-2-dev-live-results.tar.gz) (the three dev
reports, eval logs and the `pnpm validate` log), archive SHA-256
`04ba16413c4d8a61e9ca6910999d868e9c79e6578e445163e71822bfcef39e28`.

## Part rubric 2 and dev rerun, September 29, 2026

The part question was reworded before any holdout use (protocol amendment of September 29,
rubric `component-attribution-questions@2`). Each option now names the candidate it pairs with,
starts directly below that candidate's root and excludes the root's own label. Scoring, options,
corpus and adoption bar are unchanged. The rubric 1 results above stay on record.

Pinned `pnpm validate` passed all 321 tests (68 contract, 44 host, 13 playbook, 80
parity/browser, 98 component, 18 reporting). A new test checks the rubric 2 wording. All three
arms reran on dev under the re-pinned protocol (`7b434a1e…`):

| Arm                     | Requests | Spend    | Decision precision | Pairwise precision | Brier |
| ----------------------- | -------- | -------- | ------------------ | ------------------ | ----- |
| `structural-template/1` | 0        | $0       | 0.75               | 0.868              | n/a   |
| Jev `jev-1.13.0`        | 3        | $0.00014 | 0.75               | 0.868              | 0.145 |
| Haiku 4.5               | 3        | $0.0044  | 0.75               | 0.868              | 0.188 |

- **The ambiguity is resolved.** Both providers now answer the root-exclusive part (`button`), and
  Haiku forms the same repair groups as Jev and the heuristic.
- **Membership is unchanged.** All three arms still choose `ancestor-1` for every target, so
  neither provider adds coverage. **Neither is adopted.**
- **Cumulative spend against the approved caps (300 requests, $1.00 per arm):** Jev 6 requests and
  $0.00026; Haiku 6 requests and $0.0085.
- **Cumulative caps are enforced.** `usage-ledger.json` records every live run. The evaluation
  starts each client with only the approval's remaining budget, refuses when it is exhausted, and
  appends its own usage after every live run, including runs that fail part way.
- Uncached latency: Jev 0.15–0.32 s; Haiku 1.2–2.1 s. Latency is reported, not an adoption
  criterion. The report's p50/p95 include cache hits.

Evidence: [manifest](component-inference-evidence/phase-2-dev-rubric2-manifest.json) and
[raw archive](component-inference-evidence/phase-2-dev-rubric2-results.tar.gz), archive SHA-256
`95901605e8c9a7e6b5cc6ea1e5613b4671bd002f253a35ddd7e426c57f3d5df6`.

### Review repairs, PR #22

- **Cumulative caps (repair 1).** A committed usage ledger records every live run. Each client
  starts with only the approval's remaining budget, and the evaluation refuses when it is
  exhausted.
- **One live run at a time (repair 2).** A lock file under `artifacts/components/` is held from
  reading the ledger until the run's usage is appended, so overlapping runs can neither share a
  budget nor drop each other's entry. With the lock held, a keyed Jev run was refused before any
  provider call and the ledger was unchanged.
- **Pending entries (repair 2).** A fresh run's entry has no evidence path until its manifest is
  committed. It still counts toward the budget, and validation no longer fails on it.
- **Validation.** Pinned `pnpm validate` passed all 324 tests (68 contract, 44 host, 13 playbook,
  80 parity/browser, 101 component, 18 reporting). The rubric 2 manifest keeps the validation
  record of its own run (321 tests); evidence is not rewritten after the fact.

## Labeling sheet, September 29, 2026

`pnpm labeling:sheet` builds the offline page for the two adjudicators
([guide](component-labeling.md)). It renders only the uninstrumented version of each family, so
no oracle data or bridge attribute reaches the page. It covers all 240 cases on 12 opaque pages
(16 distinct structures) and took 18 s. The sheet ID is `a49d7e6c0306…`, stable across
regenerations.

- **Browser check:** two simulated labelers answered and exported every case (224 copied answers
  each), with no page errors, and `pnpm labels:compare` read both exports. Screenshots of an
  iframe case and a shadow-DOM case were inspected. That check led to three changes: a close-up
  view, markup rooted in the element's own tree, and staggered ancestor badges.
- **Tests:** 6 new tests cover Cohen's kappa, comparison refusals and reporting, the compare
  command, the page's self-containment, and a real Chromium run. The Chromium run labels, copies
  and exports a validated set; hostile fixture markup never executes.
- **The element itself as root:** the sheet offers "the element itself", which the protocol's
  candidates don't include. In all 20 dev cart-callsites cases, the oracle's root is the target
  itself, which is why every arm scores 0 there.

### Review repair 1, PR #23

Copilot found four defects, all fixed:

- **Grouping disagreements.** The comparison now lists every pair of cases the labelers grouped
  differently, with both labelers' names for both cases. Before, only the agreement rate showed
  them.
- **Private key.** `sheet-cases.json` is schema-checked before any comparison: unique IDs, valid
  pages and chains, and a sheet ID that matches its cases.
- **Stale names.** A name typed before choosing "none" or "can't tell" is not exported, and the
  label schema refuses a component name on such a case.
- **Loading merged into saved answers.** Loading a file now validates the whole file, then
  replaces this browser's answers, so another session's answers can never be exported under the
  loaded labeler's name.

Tests cover each case, including a real Chromium run of the stale name and the replacing load.

### Review repair 2, PR #23

- **Name rule both ways.** The label schema now requires a component name for a chosen root, as
  the page does, so grouping coverage can't be overstated.
- **Ancestor answers checked.** The comparison refuses an `ancestor-N` answer the case's chain
  doesn't have.
- **Full check on load.** Loading a file applies every label-set rule plus the chain check
  before replacing anything; a Chromium test loads an invalid file and sees nothing change.
- **Variant and part (deferred, flagged).** The phase 2 plan asks reviewers to adjudicate part
  and variant separately. This sheet derives the part from membership and has no variant answer.
  The labeling guide now says not to collect attribution labels until both are added or an
  amendment narrows the labels.

## Phase 2 stack settled, September 29, 2026

- **Merged:** #20 (`3d4be9f6`), #21 (`745e9b87`), #22 (`324386de`) and #23 (`a6113d7d`). The
  plan and brief followed in #25 (`94d0c5b2`).
- **#24 closed unmerged** at Tony's request. Its draft amendment gated each provider on a single
  membership-confidence threshold (Jev 0.80, Haiku ungated) and was never approved. The
  [semantic review plan](propellr-jev-semantic-review.html) parks the attribution holdout and
  specifies a floor/bar gate on per-question defect probability instead. The gate run's evidence
  stays on the `feat/component-confidence-gate` branch: its manifest, archive (`d2e34807…`) and
  Jev's run-to-run variation (wrong-family confidence 0.75, then 0.79, on identical requests).
- **Ledger corrected.** The gate run made live calls (3 requests per arm: Jev $0.00014, Haiku
  $0.0044), but its manifest never reached `main`. Both runs are now in `usage-ledger.json`
  without an evidence path, so they count toward the cumulative caps. Totals: Jev 9 requests,
  $0.0004; Haiku 9 requests, $0.013; each of 300 requests and $1.00.

To resume: the attribution holdout is parked. Before any attribution labels are collected, the
labeling sheet needs separate variant and part answers, or an approved amendment narrowing the
labels. Then amend the protocol to say how human labels replace the oracle, and run all three arms
on the sealed holdout exactly once under rubric 2.
